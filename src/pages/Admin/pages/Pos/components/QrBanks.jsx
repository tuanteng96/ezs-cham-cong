import ConfigsAPI from "@/api/Configs.api";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import { getDatabase, ref, set, remove } from "firebase/database";
import { Button, Link, Popover, f7, useStore } from "framework7-react";
import moment from "moment";
import React from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import { PickerShowQrCodePay } from ".";
import { useFirebase } from "@/hooks";

function QrBanks({ Order, Value }) {
  const FirebaseApp = useStore("FirebaseApp");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  const firebase = useFirebase(FirebaseApp);

  const database = firebase.db;

  const Banks = useQuery({
    queryKey: ["BanksPayments"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("MA_QRCODE_NGAN_HANG");

      return data?.data && data?.data.length > 0
        ? JSON.parse(data?.data[0].Value)
        : null;
    },
  });

  const onOpenQR = (nh, open) => {
    f7.dialog.preloader("Đang thực hiện ...");

    var p = {
      ngan_hang: nh.ngan_hang,
      ma_nh: nh.ma_nh,
      ten: nh.ten,
      stk: nh.stk,
      ma_nhan_dien: Banks?.data?.ma_nhan_dien,
      gia_tri: Value,
      don_hang: Order.ID,
    };

    if (FirebaseApp) {
      remove(
        ref(
          database,
          "qrpay/" +
            Brand?.Domain?.replace(/^https?:\/\//, "")
              .replaceAll(".", "_")
              .toUpperCase() +
            "/" +
            CrStocks?.ID
        )
      )
        .then(function () {
          set(
            ref(
              database,
              "qrpay/" +
                Brand?.Domain?.replace(/^https?:\/\//, "")
                  .replaceAll(".", "_")
                  .toUpperCase() +
                "/" +
                CrStocks?.ID +
                "/" +
                p.don_hang
            ),
            {
              ...p,
              TokenDate: moment(new Date()).format("HH:mm DD/MM/YYYY"),
            }
          )
            .then(() => {
              toast.success("Bật QR thanh toán thành công.");
              open(p);
              f7.dialog.close();
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch(function (error) {
          console.log("Remove failed: " + error.message);
        });
    } else {
      f7.dialog.close();
      toast.error("Firebase chưa được kết nối.");
    }
  };

  return (
    <>
      <Button
        type="button"
        className="bg-white max-w-[50px] text-black border border-[#d3d3d3] btn-popover-banks"
        fill
        large
        preloader
        popoverOpen=".popover-banks"
        disabled={
          Banks.isLoading ||
          !Banks?.data?.ngan_hang ||
          Banks?.data?.ngan_hang?.length === 0
        }
      >
        <QrCodeIcon className="w-6" />
      </Button>

      <Popover className="popover-banks w-[280px]">
        <div className="flex flex-col py-2">
          {Banks?.data?.ngan_hang &&
            Banks?.data?.ngan_hang.map((item, index) => (
              <PickerShowQrCodePay key={index}>
                {({ open }) => (
                  <Link
                    className="inline-flex flex-col px-4 py-3 border-b last:border-0"
                    popoverClose
                    noLinkClass
                    onClick={() => onOpenQR(item, open)}
                  >
                    <div className="mb-1 font-medium">
                      {item.ngan_hang.split(/[, ]+/).pop()}
                    </div>
                    <div className="flex gap-1 font-light">
                      <div>{item.ten}</div>
                      <span>-</span>
                      <div>{item.stk}</div>
                    </div>
                  </Link>
                )}
              </PickerShowQrCodePay>
            ))}
        </div>
      </Popover>
    </>
  );
}

export default QrBanks;

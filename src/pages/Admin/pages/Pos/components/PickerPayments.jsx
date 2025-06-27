import AdminAPI from "@/api/Admin.api";
import ConfigsAPI from "@/api/Configs.api";
import StringHelpers from "@/helpers/StringHelpers";
import {
  BackspaceIcon,
  BanknotesIcon,
  CalculatorIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  QrCodeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Link, Popover, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { PickerShowQrCodePay } from ".";
import { getDatabase, ref, remove, set } from "firebase/database";
import moment from "moment";

function PickerPayments({ children, Order, Client }) {
  let DebtPay =
    Order?.thanhtoan?.tong_gia_tri_dh -
      Order?.thanhtoan?.thanh_toan_tien -
      Order?.thanhtoan?.thanh_toan_vi -
      Order?.thanhtoan?.thanh_toan_ao || 0;

  const queryClient = useQueryClient();

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  const FirebaseApp = useStore("FirebaseApp");

  const database = FirebaseApp && getDatabase(FirebaseApp);

  const [visible, setVisible] = useState(false);
  const [visibleCalculator, setVisibleCalculator] = useState(false);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  let openCalculator = () => {
    setVisibleCalculator(true);
  };

  let TypePayments = [
    {
      ID: 1,
      Icon: <BanknotesIcon className="w-8" />,
      Title: "Tiền mặt",
      Desc: "Thanh toán hết bằng tiền mặt",
      MethodID: 1,
    },
    {
      ID: 2,
      Icon: <QrCodeIcon className="w-8" />,
      Title: "Chuyển khoản",
      Desc: "Thanh toán hết bằng chuyển khoản",
      MethodID: 2,
    },
    {
      ID: 3,
      Icon: <CreditCardIcon className="w-8" />,
      Title: "Quẹt thẻ",
      Desc: "Thanh toán hết bằng quẹt thẻ",
      MethodID: 3,
    },
    {
      ID: 4,
      Icon: (
        <svg
          className="w-8"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            fillRule="evenodd"
            d="M3.996 3.195a.75.75 0 0 1 1.059.05l15 16.5a.75.75 0 0 1-1.11 1.01l-15-16.5a.75.75 0 0 1 .05-1.06m5.754.555A.75.75 0 0 1 10.5 3h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75m6.75 0a.75.75 0 0 1 .75-.75h2.25A1.5 1.5 0 0 1 21 4.5v2.25a.75.75 0 0 1-1.5 0V4.5h-2.25a.75.75 0 0 1-.75-.75m-12.75 6a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75m16.5 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75M3.75 16.5a.75.75 0 0 1 .75.75v2.25h2.25a.75.75 0 0 1 0 1.5H4.5A1.5 1.5 0 0 1 3 19.5v-2.25a.75.75 0 0 1 .75-.75m6 3.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75"
            clipRule="evenodd"
          />
        </svg>
      ),
      Title: "Thanh toán từng phần",
      Desc: "Nhiều phương thức Thanh toán",
    },
  ];

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      Type: null,
      Value: [],
      BanksTransfer: null,
    },
  });

  useEffect(() => {
    !visible && reset({ Type: null, Value: [] });
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setValue(
        "Value",
        (
          "" +
          (Order?.ToPay + (Client?.CheckIn?.MemberTipAmount || 0)).toString()
        ).split("")
      );
    }
  }, [visible]);

  let { Type, Value, BanksTransfer } = watch();

  const Banks = useQuery({
    queryKey: ["BanksPaymentsList"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("MA_QRCODE_NGAN_HANG");
      return data?.data && data?.data.length > 0
        ? JSON.parse(data?.data[0].Value)
        : null;
    },
  });

  const endPayMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsEndPayOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: Order?.Member?.ID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["OrderManageID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  const onSubmit = ({ Type, BanksTransfer }) => {
    endPayMutation.mutate(
      {
        data: {
          MethodID: Type.MethodID,
          OrderID: Order?.ID,
          BankNumber: BanksTransfer
            ? `${BanksTransfer?.ngan_hang}|${BanksTransfer?.ten}|${BanksTransfer?.stk}`
            : "",
        },
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          reset();
          toast.success("Đơn hàng đã được thanh toán thành công.");
          if (Type.MethodID === 1) {
            setVisibleCalculator(false);
            close();
            f7.dialog.confirm(
              "Bạn có muốn thực hiện thưởng hoa hồng & doanh số cho lần thanh toán này ?",
              () => {
                f7.views.main.router.navigate(
                  `/admin/pos/orders/view/${Order?.ID}/bonus-sales-commission/`
                );
              }
            );
          }
          if (Type.MethodID === 2) {
            let p = {
              ...BanksTransfer,
              gia_tri: DebtPay + (Client?.CheckIn?.MemberTipAmount || 0),
            };
            delete p.open;

            if (BanksTransfer) {
              BanksTransfer.open && BanksTransfer.open(p);

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
                      console.log("Đã bật");
                      //
                    })
                    .catch((error) => {
                      console.log(error);
                    });
                })
                .catch(function (error) {
                  console.log("Remove failed: " + error.message);
                });
            } else {
              close();
              f7.dialog.confirm(
                "Bạn có muốn thực hiện thưởng hoa hồng & doanh số cho lần thanh toán này ?",
                () => {
                  f7.views.main.router.navigate(
                    `/admin/pos/orders/view/${Order?.ID}/bonus-sales-commission/`
                  );
                }
              );
            }
          }
          if (Type.MethodID === 3) {
            close();
            f7.dialog.confirm(
              "Bạn có muốn thực hiện thưởng hoa hồng & doanh số cho lần thanh toán này ?",
              () => {
                f7.views.main.router.navigate(
                  `/admin/pos/orders/view/${Order?.ID}/bonus-sales-commission/`
                );
              }
            );
          }
          window?.noti27?.TIN_NHAN &&
            window?.noti27.TIN_NHAN({
              type: "PAYMENT_ALL_POS",
              data: {
                MethodID: Type.MethodID,
                OrderID: Order?.ID,
                Order: Order,
                BankNumber: BanksTransfer
                  ? `${BanksTransfer?.ngan_hang}|${BanksTransfer?.ten}|${BanksTransfer?.stk}`
                  : "",
              },
            });
        },
      }
    );
  };

  const onOpenQR = (nh, open) => {
    var p = {
      ngan_hang: nh.ngan_hang,
      ma_nh: nh.ma_nh,
      ten: nh.ten,
      stk: nh.stk,
      ma_nhan_dien: Banks?.data?.ma_nhan_dien,
      gia_tri: Value && Value.length > 0 ? Number(Value.join("")) : 0,
      don_hang: Order.ID,
      open: open,
    };
    setValue("BanksTransfer", p);
  };

  let GuestAmount = Value && Value.length > 0 ? Number(Value.join("")) : 0;
  let ToPay = Order?.ToPay + (Client?.CheckIn?.MemberTipAmount || 0);

  return (
    <AnimatePresence initial={false}>
      <>
        {children({ open, close })}
        {visible &&
          createPortal(
            <div className="fixed z-[12501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[85%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Phương thức thanh toán
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="overflow-auto grow">
                    <div className="grid grid-cols-2 gap-4 p-4">
                      <Controller
                        name="Type"
                        control={control}
                        render={({ field, fieldState }) => (
                          <>
                            {TypePayments.map((item, index) =>
                              item.ID === 2 ? (
                                <Link
                                  popoverOpen={
                                    Banks?.data?.ngan_hang &&
                                    Banks?.data?.ngan_hang.length > 0
                                      ? ".popover-banks-pay"
                                      : null
                                  }
                                  className={clsx(
                                    "flex flex-col items-center justify-center text-center border rounded h-[160px] transition-all",
                                    field.value?.ID === item.ID &&
                                      "border-app text-app",
                                    Order?.ToPay === 0 &&
                                      item.ID === 4 &&
                                      "pointer-events-none grayscale",
                                    DebtPay === 0 &&
                                      Order?.ToPay > 0 &&
                                      Order?.ID &&
                                      item.ID !== 4 &&
                                      "pointer-events-none opacity-50"
                                  )}
                                  key={index}
                                  onClick={() => {
                                    if (
                                      field.value &&
                                      field.value?.Title === item.Title
                                    ) {
                                      //field.onChange(null);
                                    } else {
                                      field.onChange(item);
                                    }
                                  }}
                                >
                                  {BanksTransfer ? (
                                    <>
                                      <div className="mb-3">{item.Icon}</div>
                                      <div className="mb-1 font-semibold">
                                        {BanksTransfer?.ngan_hang
                                          .split(/[, ]+/)
                                          .pop()}
                                      </div>
                                      <div className="px-2 font-light text-gray-500">
                                        <div>{BanksTransfer?.ten}</div>
                                        <div>{BanksTransfer?.stk}</div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="mb-3">{item.Icon}</div>
                                      <div className="mb-1 font-semibold">
                                        {item.Title}
                                      </div>
                                      <div className="px-2 font-light text-gray-500">
                                        {item.Desc}
                                      </div>
                                    </>
                                  )}
                                </Link>
                              ) : (
                                <div
                                  className={clsx(
                                    "flex flex-col items-center justify-center text-center border rounded h-[160px] transition-all",
                                    field.value?.ID === item.ID &&
                                      "border-app text-app",
                                    Order?.ToPay === 0 &&
                                      item.ID === 4 &&
                                      "pointer-events-none grayscale opacity-50",
                                    DebtPay === 0 &&
                                      Order?.ToPay > 0 &&
                                      Order?.ID &&
                                      item.ID !== 4 &&
                                      "pointer-events-none opacity-50"
                                  )}
                                  key={index}
                                  onClick={() => {
                                    setValue("BanksTransfer", null);
                                    if (item.ID !== 4) {
                                      if (
                                        field.value &&
                                        field.value?.Title === item.Title
                                      ) {
                                      } else {
                                        field.onChange(item);
                                      }
                                      if (item.ID === 1) {
                                        setVisibleCalculator(true);
                                      }
                                    } else {
                                      close();
                                      f7.views.main.router.navigate(
                                        `/admin/pos/orders/view/${Order?.ID}/split-payments/`
                                      );
                                    }
                                  }}
                                >
                                  {DebtPay === 0 &&
                                  Order?.ID &&
                                  item.ID === 4 ? (
                                    <>
                                      <div className="mb-3">
                                        <CurrencyDollarIcon className="w-8" />
                                      </div>
                                      <div className="mb-1 font-semibold">
                                        Lịch sử thanh toán
                                      </div>
                                      <div className="px-2 font-light text-gray-500">
                                        Lịch sử, chỉnh sửa thanh toán
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="mb-3">{item.Icon}</div>
                                      <div className="mb-1 font-semibold">
                                        {item.Title}
                                      </div>
                                      <div className="px-2 font-light text-gray-500">
                                        {item.Desc}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    {Brand?.Global?.Admin?.Tips &&
                    Client?.CheckIn?.MemberTipAmount ? (
                      <div className="flex items-end justify-between mb-2.5">
                        <div className="font-medium leading-3">Khách TIP</div>
                        <div className="text-base font-bold leading-3 font-lato text-success">
                          ₫
                          {StringHelpers.formatVND(
                            Client?.CheckIn?.MemberTipAmount
                          )}
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    <div className="flex items-end justify-between mb-2.5">
                      {DebtPay === 0 && Order?.ToPay > 0 && Order?.ID ? (
                        <>
                          <div className="font-medium leading-3 text-success">
                            Đã thanh toán
                            <span className="pl-1">
                              {Order?.MethodPayID === 1 && "tiền mặt"}
                              {Order?.MethodPayID === 2 && "chuyển khoản"}
                              {Order?.MethodPayID === 3 && "Quyẹt thẻ"}
                            </span>
                          </div>
                          <div className="text-base font-bold leading-3 font-lato">
                            ₫
                            {StringHelpers.formatVND(
                              DebtPay > 0 ? DebtPay : Order?.ToPay
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium leading-3">
                            Tổng thanh toán
                          </div>
                          <div className="text-base font-bold leading-3 font-lato">
                            ₫
                            {StringHelpers.formatVND(
                              DebtPay > 0
                                ? DebtPay +
                                    (Client?.CheckIn?.MemberTipAmount || 0)
                                : Order?.ToPay +
                                    (Client?.CheckIn?.MemberTipAmount || 0)
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* <Button
                        type="button"
                        className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
                        fill
                        large
                        preloader
                        onClick={openCalculator}
                      >
                        <CalculatorIcon className="w-6" />
                      </Button> */}

                      <Button
                        type="button"
                        className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
                        fill
                        large
                        preloader
                        preloaderColor="black"
                        onClick={() => {
                          close();
                          f7.views.main.router.navigate(
                            `/admin/printers/order/${Order?.ID}/`
                          );
                        }}
                        loading={endPayMutation.isLoading}
                        disabled={endPayMutation.isLoading}
                      >
                        <PrinterIcon className="w-6" />
                      </Button>

                      <Button
                        type="button"
                        className="flex-1 bg-success"
                        fill
                        large
                        preloader
                        loading={endPayMutation.isLoading}
                        disabled={
                          !Type ||
                          endPayMutation.isLoading ||
                          (DebtPay === 0 && Order?.ID && Order?.ToPay > 0) ||
                          (Type?.MethodID === 2 &&
                            Banks?.data?.ngan_hang.length > 0 &&
                            !BanksTransfer)
                        }
                        onClick={() => {
                          if (Type?.MethodID === 1) {
                            openCalculator();
                          } else {
                            handleSubmit(onSubmit)();
                          }
                        }}
                      >
                        {DebtPay === 0 && Order?.ID && Order?.ToPay > 0
                          ? "Đã thanh toán"
                          : "Thanh toán"}
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
        <Popover className="popover-banks-pay w-[280px]">
          <div className="flex flex-col py-2">
            {Banks?.data?.ngan_hang &&
              Banks?.data?.ngan_hang.map((item, index) => (
                <PickerShowQrCodePay
                  SubTitle="Đã thực hiện thanh toán"
                  onCloseQR={() => {
                    if (endPayMutation?.data?.data) {
                      close();
                      f7.dialog.confirm(
                        "Bạn có muốn thực hiện thưởng hoa hồng & doanh số cho lần thanh toán này ?",
                        () => {
                          f7.views.main.router.navigate(
                            `/admin/pos/orders/view/${Order?.ID}/bonus-sales-commission/`
                          );
                        }
                      );
                    }
                  }}
                  key={index}
                >
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
        {visibleCalculator &&
          createPortal(
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setVisibleCalculator(false)}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[92%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    <div>Số tiền khách trả</div>
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={() => setVisibleCalculator(false)}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="overflow-auto grow">
                    <div className="flex justify-center mt-4 mb-10">
                      <div className="font-lato border-b-[2px] border-primary">
                        <span
                          className={clsx(
                            "pr-1 text-3xl font-bold",
                            (!Value || Value.length === 0) && "text-[#bfbfbf]"
                          )}
                        >
                          ₫
                        </span>
                        <span className="font-[800] text-[38px]">
                          {Value && Value.length > 0 && (
                            <>{StringHelpers.formatVND(GuestAmount)}</>
                          )}
                          {(!Value || Value.length === 0) && (
                            <span className="text-[#bfbfbf]">0</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4">
                      {Array(9)
                        .fill()
                        .map((_, index) => (
                          <Controller
                            name="Value"
                            key={index}
                            control={control}
                            render={({ field, fieldState }) => (
                              <div
                                className="border rounded h-14 border-[#d3d3d3] font-lato flex items-center justify-center font-bold text-2xl"
                                onClick={() =>
                                  field.onChange([
                                    ...field.value,
                                    "" + (index + 1),
                                  ])
                                }
                              >
                                {index + 1}
                              </div>
                            )}
                          />
                        ))}
                      <div></div>
                      <Controller
                        name="Value"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div
                            className="border rounded h-14 border-[#d3d3d3] font-lato flex items-center justify-center font-bold text-2xl"
                            onClick={() =>
                              field.onChange([...field.value, "0"])
                            }
                          >
                            0
                          </div>
                        )}
                      />
                      <Controller
                        name="Value"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div
                            className="border rounded h-14 border-[#d3d3d3] font-lato flex items-center justify-center font-bold text-2xl"
                            onClick={() => {
                              if (field.value && field.value.length > 0) {
                                let newValue = [...field.value];
                                newValue.splice(-1);
                                field.onChange(newValue);
                              }
                            }}
                          >
                            <BackspaceIcon className="w-6" />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <div className="flex items-center justify-between gap-2">
                      {GuestAmount >= ToPay && (
                        <div className="flex-1 font-semibold text-success">
                          Trả lại ・ ₫
                          <span className="pl-px text-lg font-bold font-lato">
                            {StringHelpers.formatVND(GuestAmount - ToPay)}
                          </span>
                        </div>
                      )}
                      {GuestAmount < ToPay && (
                        <div className="flex-1 font-semibold text-danger">
                          Còn thiếu ・ ₫
                          <span className="pl-px text-lg font-bold font-lato">
                            {StringHelpers.formatVND(ToPay - GuestAmount)}
                          </span>
                        </div>
                      )}

                      <Button
                        type="button"
                        className="w-[145px] bg-primary"
                        fill
                        large
                        preloader
                        onClick={() => handleSubmit(onSubmit)()}
                        loading={endPayMutation.isLoading}
                        disabled={
                          !Type ||
                          endPayMutation.isLoading ||
                          (DebtPay === 0 && Order?.ID && Order?.ToPay > 0) ||
                          (Type?.MethodID === 2 &&
                            Banks?.data?.ngan_hang.length > 0 &&
                            !BanksTransfer)
                        }
                      >
                        Thanh toán
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerPayments;

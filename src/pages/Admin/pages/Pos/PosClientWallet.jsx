import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import React, { useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import { useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import StringHelpers from "@/helpers/StringHelpers";
import moment from "moment";
import clsx from "clsx";
import NoFound from "@/components/NoFound";
import { PickerAddEditWallet } from "./components";

function PosClientWallet({ f7router, f7route }) {
  let Auth = useStore("Auth");

  const { data, isLoading } = useQuery({
    queryKey: ["ClientWalletID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "list_money");
      bodyFormData.append("MemberID", f7route?.params?.id);
      let rs = await appPOS.getMemberMoneys(f7route?.params?.id);

      let data = rs
        ? {
            ...null,
            data: rs.Items,
          }
        : null;

      // let { data } = await AdminAPI.clientWalletId({
      //   data: bodyFormData,
      //   Token: Auth?.token,
      // });

      let WalletTotal = {
        Total: 0,
        Available: 0,
        Waiting: 0,
      };

      if (data?.data && data.data.length > 0) {
        WalletTotal.Total = data?.data.reduce((n, { Value }) => n + Value, 0);
        WalletTotal.Available = data?.data
          .filter((item) => {
            if (
              item.Type !== "THANH_TOAN_DH" &&
              item?.ReturnOfID > 0 &&
              item.Order &&
              item.Order.RemainPay !== 0
            ) {
              return false;
            }
            return item.Type === "MUA_HANG" ||
              item.Type === "GIOI_THIEU" ||
              item.Type === "CHIA_SE_MAGIAMGIA"
              ? item.Order.RemainPay === 0
              : item;
          })
          .reduce((n, { Value }) => n + Value, 0);
        WalletTotal.Waiting = WalletTotal.Total - WalletTotal.Available;
      }

      return data ? { ...data, WalletTotal } : null;
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const WalletTypeDesc = (item) => {
    switch (true) {
      case item.Type === "NAP_QUY" && item.Source === "" && item.Value >= 0:
        return "Nạp ví";
      case item.Type === "NAP_QUY" && item.Value < 0 && item.Source === "":
        return "Trừ ví";
      case item.Source === "CHINH_SUA_SO_BUOI_DV":
        return "Hoàn tiền khi hoàn buổi dịch vụ";
      case item.Type === "MUA_HANG" &&
        item?.Desc.indexOf("KHAU_TRU_TRA_HANG") === -1:
        return "Tích lũy mua hàng";
      case item.Type === "MUA_HANG" &&
        item?.Desc.indexOf("KHAU_TRU_TRA_HANG") > -1:
        return "Giảm bớt tích lũy do trả hàng";
      case item.SumType === "TRA_HANG_HOAN_VI":
        return "Hoàn tiền khi trả hàng";
      case item.SumType === "TRA_HANG_PHI_VI":
        return "Phí dịch vụ trả hàng";
      case item.Type === "GIOI_THIEU" &&
        item?.Desc.indexOf("KHAU_TRU_TRA_HANG") === -1:
        return "Hoa hồng giới thiệu";
      case item.Type === "GIOI_THIEU" &&
        item?.Desc.indexOf("KHAU_TRU_TRA_HANG") > -1:
        return "Giảm bớt hoa hồng do trả hàng";
      case item.Type === "CHIA_SE_MAGIAMGIA":
        return "Hoa hồng giới thiệu ( Chia sẻ voucher )";
      case item.SumType === "KET_THUC_THE_HOAN_VI":
        return "Hoàn tiền khi kết thúc thẻ";
      case item.SumType === "KET_THUC_THE_PHI_VI":
        return "Phí dịch vụ kết thúc thẻ";
      case item.SumType === "DANG_KY_THANH_VIEN":
        return "Ưu đãi đăng ký tài khoản";
      case item.SumType === "DANG_NHAP_LAN_DAU":
        return "Ưu đãi khi đăng nhập lần đầu";
      case item.SumType === "CHUC_MUNG_SN":
        return "Ưu đãi mừng sinh nhật";
      case item.SumType === "CHUC_MUNG_SN_THANG":
        return "Ưu đãi tháng sinh nhật";
      case item.Type === "THANH_TOAN_DH":
        return "Thanh toán đơn hàng";
      case item.Type === "PHI" && item.SumType === "":
        return "Phí dịch vụ";
      default:
        return "Chưa xác định";
    }
  };

  return (
    <Page
      className="bg-white"
      name="Pos-client-wallet"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Ví điện tử</NavTitle>
        <NavRight className="h-full pr-4">
          <PickerAddEditWallet MemberID={f7route?.params?.id}>
            {({ open }) => (
              <Link
                onClick={open}
                noLinkClass
                className="!text-white flex item-center justify-center bg-success text-[14px] h-8 px-2 rounded items-center"
              >
                Nạp ví
              </Link>
            )}
          </PickerAddEditWallet>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-3 border-b">
          <div className="flex flex-col items-center py-3">
            <div className="mb-px text-[#333]">Tổng ví</div>
            {isLoading && (
              <div className="w-2/4 h-3 mt-2 bg-gray-200 rounded-full animate-pulse"></div>
            )}
            {!isLoading && (
              <div className="text-base font-bold font-lato">
                {StringHelpers.formatVND(data?.WalletTotal?.Total)}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center py-3 border-x">
            <div className="mb-px text-[#333]">Ví khả dụng</div>
            {isLoading && (
              <div className="w-2/4 h-3 mt-2 bg-gray-200 rounded-full animate-pulse"></div>
            )}
            {!isLoading && (
              <div className="text-base font-bold font-lato text-success">
                {StringHelpers.formatVND(data?.WalletTotal?.Available)}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center py-3">
            <div className="mb-px text-[#333]">Chờ xử lý</div>
            {isLoading && (
              <div className="w-2/4 h-3 mt-2 bg-gray-200 rounded-full animate-pulse"></div>
            )}
            {!isLoading && (
              <div className="text-base font-bold font-lato text-warning">
                {StringHelpers.formatVND(data?.WalletTotal?.Waiting)}
              </div>
            )}
          </div>
        </div>
        <div className="overflow-auto grow">
          {isLoading && (
            <>
              {Array(4)
                .fill()
                .map((_, index) => (
                  <div
                    className="flex justify-between p-4 border-b border-dashed last:border-b-0"
                    key={index}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-10/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <div className="font-light text-gray-500">
                        <div className="w-8/12 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-[130px] flex justify-end">
                      <div className="w-8/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!isLoading && (
            <>
              {data?.data && data?.data.length > 0 && (
                <>
                  {data?.data.map((item, index) => (
                    <PickerAddEditWallet
                      MemberID={f7route?.params?.id}
                      data={item}
                      key={index}
                    >
                      {({ open }) => (
                        <div
                          onClick={() => item.Type === "NAP_QUY" && open()}
                          className="flex justify-between p-4 border-b border-dashed last:border-b-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              {moment(item.CreateDate).format(
                                "HH:mm DD-MM-YYYY"
                              )}
                              {item.Type === "NAP_QUY" && (
                                <PencilSquareIcon className="w-5 ml-2" />
                              )}
                            </div>
                            <div className="font-light text-gray-500">
                              {WalletTypeDesc(item)}
                              <div>{item?.Desc}</div>
                            </div>

                            {item.canh_bao_thanh_toan ? (
                              <div className="font-light text-danger">
                                Chưa thanh toán hết
                              </div>
                            ) : (
                              <></>
                            )}
                          </div>
                          <div
                            className={clsx(
                              "font-semibold font-lato text-base w-[130px] flex justify-end",
                              item?.Value >= 0 ? "text-success" : "text-danger"
                            )}
                          >
                            {item?.Value >= 0 && "+"}
                            {StringHelpers.formatVND(item?.Value)}
                          </div>
                        </div>
                      )}
                    </PickerAddEditWallet>
                  ))}
                </>
              )}
              {(!data?.data || data?.data.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                />
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

export default PosClientWallet;

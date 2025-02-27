import React, { useEffect, useRef } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  Button,
  f7,
  Link,
  Navbar,
  NavLeft,
  NavTitle,
  Page,
  useStore,
} from "framework7-react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ConfigsAPI from "@/api/Configs.api";
import moment from "moment";
import StringHelpers from "@/helpers/StringHelpers";
import clsx from "clsx";
import * as htmlToImage from "html-to-image";

var pIndex = 0;

function PrinterOrder({ f7route }) {
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const CrStocks = useStore("CrStocks");

  const OrderRef = useRef(null);

  const actionsIPToPopover = useRef(null);
  const IpToPopoverWrapper = useRef(null);

  const actionsToPopover = useRef(null);
  const buttonToPopoverWrapper = useRef(null);

  useEffect(() => {
    return () => {
      if (actionsToPopover.current) {
        actionsToPopover.current.destroy();
      }
      if (actionsIPToPopover.current) {
        actionsIPToPopover.current.destroy();
      }
    };
  });

  const { data, isLoading } = useQuery({
    queryKey: ["SizePrinters"],
    queryFn: async () => {
      let data = await GetPrinter();
      return data
        ? data.filter(
            (x) =>
              x.Type === "Order" && x.Checked && x.Path.indexOf("A5") === -1
          )
        : null;
    },
  });

  const PrintersIP = useQuery({
    queryKey: ["PrintersIP", { CrStocks }],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`ipprinter`);
      let rs = null;
      if (data && data.data && data.data.length > 0) {
        let JSONString = data.data[0].Value;
        if (JSONString) {
          let JSONparse = JSON.parse(JSONString);
          let index = JSONparse?.findIndex((x) => x.StockID === CrStocks?.ID);
          if (index > -1) {
            rs = JSONparse[index].Printers;
          }
        }
      }
      return rs;
    },
  });

  const Order = useQuery({
    queryKey: ["OrderPrinter", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let data = await AdminAPI.getPrinterOrderId({
        OrderID: f7route?.params?.id,
        Token: Auth?.token,
      });
      let configs = await ConfigsAPI.getValue(
        "MA_QRCODE_NGAN_HANG,Bill.Title,Bill.Footer"
      );
      let obj = {
        BillTitle: "",
        BillFooter: "",
        ma_nhan_dien: "",
        ngan_hang: "",
      };
      if (configs?.data?.data && configs?.data?.data.length > 0) {
        obj.BillTitle = configs?.data?.data[0]?.Value || "";
        obj.BillFooter = configs?.data?.data[1]?.Value || "";
        let Banks = JSON.parse(configs?.data?.data[2]?.Value);
        if (Banks && Banks?.ngan_hang && Banks?.ngan_hang.length > 0) {
          obj.ngan_hang = Banks?.ngan_hang[0];
        }
      }
      return data?.data
        ? {
            ...data?.data,
            Cashes: (data.data?.Cashes
              ? data.data?.Cashes.filter((x) => x.CashType === "Thu")
              : []
            ).concat(
              data.data?.MemberMoneys
                ? data.data?.MemberMoneys.map((x) => ({
                    ...x,
                    Method: "Ví & Thẻ tiền",
                  }))
                : []
            ),
            SysConfig: obj,
          }
        : null;
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  let onActionIP = () =>
    new Promise((resolve, reject) => {
      let actions = [
        {
          text: "Máy in thực hiện",
          label: true,
        },
      ];
      for (let p of PrintersIP?.data) {
        actions.push({
          text: p.Name,
          onClick: (action, e) => {
            resolve(p);
          },
        });
      }
      actions.push({
        text: "Đóng",
        color: "red",
      });
      if (!actionsIPToPopover.current) {
        actionsIPToPopover.current = f7.actions.create({
          buttons: actions,
          targetEl:
            IpToPopoverWrapper.current.querySelector(".button-ip-print"),
        });
      }
      actionsIPToPopover.current.open();
    });

  let onActionSize = ({ IPAdress }) => {
    if (!data || !data.length === 0) {
      f7.dialog.alert("Bạn chưa cài đặt mẫu in.");
      return;
    }
    if (data && data.length === 1) {
      onConnectPrinter({
        ...data[0],
        IPAdress,
      });
      return;
    }
    let actions = [];
    for (let print of data) {
      actions.push({
        text: print.Title,
        onClick: (action, e) => {
          onConnectPrinter({
            ...print,
            IPAdress,
          });
        },
        close: true,
      });
    }
    actions.push({
      text: "Đóng",
      color: "red",
    });
    if (!actionsToPopover.current) {
      actionsToPopover.current = f7.actions.create({
        buttons: actions,
        targetEl:
          buttonToPopoverWrapper.current.querySelector(".button-to-print"),
      });
    }
    actionsToPopover.current.open();
  };

  const onConnectPrinter = async (print) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let imageBase64 = "";
    const minDataLength = 2000000;
    let i = 0;
    const maxAttempts = 10;

    let refCurrent = OrderRef?.current;

    while (imageBase64.length < minDataLength && i < maxAttempts) {
      imageBase64 = await htmlToImage.toPng(refCurrent, {
        canvasWidth: 530,
        canvasHeight:
          (530 * refCurrent?.clientHeight) / refCurrent?.clientWidth,
        pixelRatio: 1,
        // skipAutoScale: true,
        cacheBust: true,
        //skipFonts: true
      });
      i += 1;
    }

    var p = {
      ipAddress: print?.IPAdress || "192.168.100.251",
      param: {
        feedLine: true,
        cutHalfAndFeed: 1,
        cutPaper: true,
        items: [
          {
            //imageUrl: AssetsHelpers.toAbsoluteUrl(rs?.data?.src),
            base64: imageBase64.replaceAll("data:image/png;base64,", ""),
            alignment: 1,
            width: 600 || 0,
            model: 0,
          },
        ],
      },
    };

    PromHelpers.PRINTER(p)
      .then((r) => {
        f7.dialog.close();
      })
      .catch((e) => {
        if (pIndex === 0) {
          pIndex = 1;
          f7.dialog.close();
          onConnectPrinter(print);
        } else {
          f7.dialog.close();
          f7.dialog.alert("Không thể kết nối máy in.");
        }
      });
  };

  const onPrinter = () => {
    if (PrintersIP?.data && PrintersIP?.data.length > 1) {
      onActionIP().then((ip) => {
        onActionSize({ IPAdress: ip.IpAddress });
      });
    } else {
      onActionSize({
        IPAdress:
          PrintersIP?.data && PrintersIP?.data.length > 0
            ? PrintersIP?.data[0].IpAddress
            : null,
      });
    }
  };

  return (
    <Page
      className="!bg-white"
      name="Order-Printer"
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
        <NavTitle>Hoá đơn ĐH #{f7route?.params?.id}</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full pb-safe-b">
        <div className="p-4 overflow-auto grow">
          <div className="bg-white" ref={OrderRef}>
            <div className="text-center">
              <div className="mb-px text-base font-bold uppercase">
                {Order?.data?.BillTitle || Order?.data?.SysConfig?.BillTitle}
              </div>
              <div
                dangerouslySetInnerHTML={{
                  __html: Order?.data?.BillAddress,
                }}
              ></div>
              <h1 className="mt-2 text-base font-bold uppercase">
                Hóa đơn bán hàng
              </h1>
              <div>
                <p>
                  #<span className="order-id">{Order?.data?.OrderEnt?.ID}</span>
                  <span className="px-1.5">-</span>
                  {moment(Order?.data?.OrderEnt?.CreateDate).format(
                    "HH:mm DD/MM/YYYY"
                  )}
                </p>
              </div>
            </div>
            <div>
              <div className="mt-4 mb-3">
                <div className="flex justify-between mb-1 last:mb-0">
                  <div className="w-[150px]">Khách hàng:</div>
                  <div className="flex-1 font-bold text-right capitalize">
                    {Order?.data?.MemberEnt?.FullName}
                  </div>
                </div>
                <div className="flex justify-between mb-1 last:mb-0">
                  <div className="w-[150px]">Số điện thoại:</div>
                  <div className="flex-1 font-bold text-right">
                    {Order?.data?.MemberEnt?.MobilePhone}
                  </div>
                </div>
                <div className="flex justify-between mb-1 last:mb-0">
                  <div className="w-[150px]">Địa chỉ:</div>
                  <div className="flex-1 font-bold text-right">
                    {Order?.data?.MemberEnt?.HomeAddress}
                  </div>
                </div>
                <div className="flex justify-between mb-1 card-wallet last:mb-0">
                  <div className="w-[150px]">Số dư thẻ tiền:</div>
                  <div className="flex-1 font-bold text-right card-wallet-total">
                    {StringHelpers.formatVND(
                      Order?.data?.MemberEnt?.Present?.the_tien_kha_dung
                    )}
                  </div>
                </div>
                {Brand?.Global.Print?.isSource && (
                  <div className="flex justify-between mb-1 resources last:mb-0">
                    <div className="w-[150px]">Nguồn khách hàng:</div>
                    <div className="flex-1 font-bold text-right resources-name">
                      {Order?.data?.MemberEnt?.Source}
                    </div>
                  </div>
                )}
              </div>
              <table className="w-full border border-collapse border-black text-mini print:break-inside-auto">
                <thead>
                  <tr className="print:break-inside-avoid print:break-after-auto">
                    <th className="border border-black px-1.5 py-2 text-left">
                      Tên mặt hàng
                    </th>
                    <th className="border border-black px-1.5 py-2 text-center">
                      SL
                    </th>
                    <th className="border border-black px-1.5 py-2 text-right">
                      Đơn giá
                    </th>
                    <th className="border border-black px-1.5 py-2 text-right">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Order?.data?.list &&
                    Order?.data?.list.map((item, index) => (
                      <tr
                        className="print:break-inside-avoid print:break-after-auto item-prod"
                        key={index}
                      >
                        <td className="border border-black px-1.5 py-2">
                          {item?.ProdTitle}
                          {item.PriceOrder < item.Price && (
                            <div>
                              (-
                              {(
                                100 -
                                (item.PriceOrder / item.Price) * 100
                              ).toFixed(2)}
                              %)
                            </div>
                          )}
                          {item?.ProdComboList?.length > 1 && (
                            <div>
                              {item?.ProdComboList.map(
                                (i) => `${i?.Product?.Title} (${i.qty})`
                              )}
                            </div>
                          )}
                          {item?.PP_Title && <div>{item.PP_Title}</div>}
                          {item?.PP2_Title && <div>{item.PP2_Title}</div>}
                        </td>
                        <td className="border border-black px-1.5 py-2 text-center">
                          {item?.Qty}
                        </td>
                        <td className="border border-black px-1.5 py-2 text-right">
                          <div
                            className={clsx(
                              "font-semibold group",
                              item.PriceOrder < item.Price && "is-published"
                            )}
                          >
                            <div className="into-money-discount hidden group-[.is-published]:block group-[.is-published]:line-through">
                              {StringHelpers.formatVND(item.Price)}
                            </div>
                            <div className="into-money">
                              {StringHelpers.formatVND(item.PriceOrder)}
                            </div>
                          </div>
                        </td>
                        <td className="border border-black px-1.5 py-2 font-semibold text-right">
                          {StringHelpers.formatVND(
                            item?.PriceOrder * item?.Qty
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="mt-2">
                <div className="flex justify-between mb-1 last:mb-0">
                  <div>Tổng giá trị:</div>
                  <div className="font-bold">
                    {StringHelpers.formatVND(
                      Order?.data?.OrderEnt?.TotalProdValue
                    )}
                  </div>
                </div>
                {Order?.data?.OrderEnt?.TotalValue > 0 && (
                  <div className="flex justify-between mb-1 last:mb-0">
                    <div>Khuyến mại:</div>
                    <div className="font-bold">
                      {StringHelpers.formatVND(
                        Order?.data?.OrderEnt?.TotalProdValue -
                          Order?.data?.OrderEnt?.TotalValue
                      )}
                    </div>
                  </div>
                )}
                {Order?.data?.OrderEnt?.TotalValue > 0 && (
                  <div className="flex justify-between mb-1 last:mb-0">
                    <div>Còn lại:</div>
                    <div className="font-bold">
                      {StringHelpers.formatVND(
                        Order?.data?.OrderEnt?.TotalValue
                      )}
                    </div>
                  </div>
                )}
                {Order?.data?.OrderEnt?.VoucherCode && (
                  <div className="flex justify-between mb-1 last:mb-0">
                    <div>
                      Voucher
                      <span className="font-medium px-1.5">
                        ({Order?.data?.OrderEnt?.VoucherCode})
                      </span>
                      :
                    </div>
                    <div className="font-bold">
                      {StringHelpers.formatVND(
                        Order?.data?.OrderEnt?.TotalValue -
                          Order?.data?.OrderEnt?.ToMoney
                      )}
                    </div>
                  </div>
                )}
                {Order?.data?.OrderEnt?.CustomeDiscount > 0 && (
                  <>
                    <div className="flex justify-between mb-1 last:mb-0">
                      <div>Giá trị đơn hàng:</div>
                      <div className="font-bold">
                        {StringHelpers.formatVND(
                          Order?.data?.OrderEnt?.ToMoney
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between mb-1 last:mb-0">
                      <div>Chiết khấu trên đơn:</div>
                      <div className="font-bold">
                        {Order?.data?.OrderEnt?.CustomeDiscount <= 100
                          ? `${Order?.data?.OrderEnt?.CustomeDiscount}%`
                          : StringHelpers.formatVND(
                              Order?.data?.OrderEnt?.CustomeDiscount
                            )}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-between mb-1 font-bold last:mb-0">
                  <div>Giá trị cần thanh toán:</div>
                  <div>
                    {StringHelpers.formatVND(Order?.data?.OrderEnt?.ToPay)}
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <div className="flex justify-between my-1">
                    <h4 className="font-bold">Lịch sử thanh toán</h4>
                    {(!Order?.data?.Cashes ||
                      Order?.data?.Cashes.length === 0) && (
                      <span className="list-payted-empty">Chưa thanh toán</span>
                    )}
                  </div>

                  {Order?.data?.Cashes && Order?.data?.Cashes.length > 0 && (
                    <div>
                      {Order?.data?.Cashes &&
                        Order?.data?.Cashes.map((cash, i) => (
                          <div
                            className="flex justify-between pb-2 mb-2.5 border-b border-black border-dashed"
                            key={i}
                          >
                            <div className="flex-1 mr-2">
                              {moment(cash.CreateDate).format("DD/MM/YYYY")}
                            </div>
                            <div className="flex-1 text-left">
                              {cash.Method}
                            </div>
                            <div className="flex-1 text-right">
                              {StringHelpers.formatVNDPositive(cash.Value)}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-bold mt-1.5">
                  <div className="text-left">
                    Còn nợ <span className="dotted-item">:</span>
                  </div>
                  <div>
                    {StringHelpers.formatVND(
                      Order?.data?.OrderEnt?.thanhtoan?.tong_gia_tri_dh -
                        Order?.data?.OrderEnt?.thanhtoan?.thanh_toan_tien -
                        Order?.data?.OrderEnt?.thanhtoan?.thanh_toan_vi -
                        Order?.data?.OrderEnt?.thanhtoan?.thanh_toan_ao
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center my-5 code128">
                {Brand?.Global.Print?.isQRPay &&
                  Order?.data?.SysConfig?.ngan_hang && (
                    <div className="qr-pay">
                      <img
                        className="w-[130px]"
                        src={`https://img.vietqr.io/image/${Order?.data?.SysConfig?.ngan_hang?.ma_nh}-${Order?.data?.SysConfig?.ngan_hang?.stk}-qr_only.png?amount=${Order?.data?.OrderEnt?.ToPay}&addInfo=pos${Order?.data?.OrderEnt?.ID}&accountName=${Order?.data?.SysConfig?.ngan_hang?.ten}`}
                      />
                    </div>
                  )}
              </div>
              <div className="text-center">
                <div className="mb-1 font-bold">
                  {Order?.data?.SysConfig?.BillFooter}
                </div>
                <div className="italic">
                  Thời gian in : {moment().format("HH:mm DD/MM/YYYY")}
                </div>
              </div>
            </div>
            <div className="h-20"></div>
          </div>
        </div>

        <div className="hidden" ref={IpToPopoverWrapper}>
          <div className="button-ip-print"></div>
        </div>
        <div className="hidden" ref={buttonToPopoverWrapper}>
          <div className="button-to-print"></div>
        </div>
        <div className="p-4 bg-white border-t">
          <Button
            type="button"
            className="flex-1 bg-primary"
            fill
            large
            preloader
            loading={isLoading || PrintersIP?.isLoading || Order.isLoading}
            disabled={isLoading || PrintersIP?.isLoading || Order.isLoading}
            onClick={onPrinter}
          >
            In hoá đơn
          </Button>
        </div>
      </div>
    </Page>
  );
}

export default PrinterOrder;

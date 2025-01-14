import { PrinterIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Dom7, { height } from "dom7";
import { Button, Link, f7, useStore } from "framework7-react";
import { forwardRef, useEffect, useRef } from "react";
import { useMutation, useQuery } from "react-query";
import { toast } from "react-toastify";
import * as htmlToImage from "html-to-image";
import { toPng } from "html-to-image";
import { createPortal } from "react-dom";
import AdminAPI from "@/api/Admin.api";
import moment from "moment";
import StringHelpers from "@/helpers/StringHelpers";
import ConfigsAPI from "@/api/Configs.api";
import MoresAPI from "@/api/Mores.api";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import PromHelpers from "@/helpers/PromHelpers";

//"Cash", "IO", "Service", "CheckOut", "Order"//

const ButtonPrinter = forwardRef(
  (
    {
      Type,
      ID,
      ButtonType = true,
      LinkTitle = "",
      LinkClassName = "flex justify-between p-3 font-medium",
      LinkWrapClass = "border-b last:border-0",
      className = "w-[60px] bg-primary button-to-print",
      ModeCard = false,
      loading,
      disabled,
      ...props
    },
    ref
  ) => {
    const actionsToPopover = useRef(null);
    const buttonToPopoverWrapper = useRef(null);

    const actionsIPToPopover = useRef(null);
    const IpToPopoverWrapper = useRef(null);

    const OrderRef = useRef(null);
    const ServiceRef = useRef(null);

    const Auth = useStore("Auth");
    const Brand = useStore("Brand");

    const CrStocks = useStore("CrStocks");

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

    const { data } = useQuery({
      queryKey: ["SizePrinters", { Type }],
      queryFn: async () => {
        let data = await GetPrinter();
        return data
          ? data.filter(
              (x) => x.Type === Type && x.Checked && x.Path.indexOf("A5") === -1
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
      queryKey: ["OrderPrinter", { Type, ID }],
      queryFn: async () => {
        let data = await AdminAPI.getPrinterOrderId({
          OrderID: ID,
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
      enabled: Type === "Order" && ID > 0,
    });

    const Service = useQuery({
      queryKey: [`ServicePrinter${ModeCard ? "ModeCard" : ""}`, { Type, ID }],
      queryFn: async () => {
        let data = await AdminAPI.getPrinterServiceId({
          OsID: ID,
          Token: Auth?.token,
          ModeCard: ModeCard,
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
        }
        return data?.data
          ? {
              ...data?.data,
              SysConfig: obj,
            }
          : null;
      },
      enabled: Type === "Service" && ID > 0,
    });

    const imageBase64Mutation = useMutation({
      mutationFn: async (body) => {
        let data = await MoresAPI.base64toImage(body);
        return data;
      },
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
        onConnectPrinter(data[0]);
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

      let refCurrent = null;

      if (Type === "Order") {
        refCurrent = OrderRef?.current;
      }
      if (Type === "Service") {
        refCurrent = ServiceRef?.current;
      }

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
        ipAddress: print?.IPAdress || "192.168.1.251",
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
          f7.dialog.close();
          f7.dialog.alert("Không thể kết nối máy in.");
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
      <>
        <div className="hidden" ref={IpToPopoverWrapper}>
          <div className="button-ip-print"></div>
        </div>
        <div
          className={clsx(!ButtonType && LinkWrapClass)}
          ref={buttonToPopoverWrapper}
        >
          {ButtonType && (
            <Button
              onClick={onPrinter}
              ref={ref}
              type="button"
              className={className}
              fill
              large
              preloader
              preloaderColor="black"
              loading={loading || Order.isLoading}
              disabled={disabled || Order.isLoading}
              {...props}
            >
              <PrinterIcon className="w-6" />
            </Button>
          )}
          {!ButtonType && (
            <Link
              popoverClose={!Order.isLoading && !loading}
              className={LinkClassName}
              noLinkClass
              onClick={() => {
                if (Order.isLoading || loading) return;
                onPrinter();
              }}
              ref={ref}
            >
              {LinkTitle}
              {(Order.isLoading || loading) && (
                <div className="absolute right-4" role="status">
                  <svg
                    aria-hidden="true"
                    className="w-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              )}
            </Link>
          )}
        </div>
        {Type === "Order" &&
          createPortal(
            <div className="fixed z-[0] inset-0 w-full overflow-auto">
              <div className="bg-white" ref={OrderRef}>
                <div className="text-center">
                  <div className="mb-px font-bold uppercase">
                    {Order?.data?.BillTitle ||
                      Order?.data?.SysConfig?.BillTitle}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: Order?.data?.BillAddress,
                    }}
                  ></div>
                  <h1 className="mt-2 font-bold uppercase">Hóa đơn bán hàng</h1>
                  <div>
                    <p>
                      #
                      <span className="order-id">
                        {Order?.data?.OrderEnt?.ID}
                      </span>
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
                          <span className="list-payted-empty">
                            Chưa thanh toán
                          </span>
                        )}
                      </div>

                      {Order?.data?.Cashes &&
                        Order?.data?.Cashes.length > 0 && (
                          <div>
                            {Order?.data?.Cashes &&
                              Order?.data?.Cashes.map((cash, i) => (
                                <div
                                  className="flex justify-between pb-2 mb-2.5 border-b border-black border-dashed"
                                  key={i}
                                >
                                  <div className="flex-1 mr-2">
                                    {moment(cash.CreateDate).format(
                                      "DD/MM/YYYY"
                                    )}
                                  </div>
                                  <div className="flex-1 text-left">
                                    {cash.Method}
                                  </div>
                                  <div className="flex-1 text-right">
                                    {StringHelpers.formatVNDPositive(
                                      cash.Value
                                    )}
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
            </div>,
            document.body
          )}
        {Type === "Service" &&
          createPortal(
            <div className="fixed z-[0] inset-0 w-full overflow-auto">
              <div className="bg-white" ref={ServiceRef}>
                <div className="text-center">
                  <div className="mb-px font-bold uppercase">
                    {Service?.data?.BillTitle ||
                      Service?.data?.SysConfig?.BillTitle}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: Service?.data?.BillAddress,
                    }}
                  ></div>
                  <h1 className="mt-2 font-bold uppercase">Phiếu dịch vụ</h1>
                  <div>
                    <p>
                      #<span className="order-id">{Service?.data?.os?.ID}</span>
                      <span className="px-1.5">-</span>
                      {Service?.data?.os?.BookDate
                        ? moment(Service?.data?.os?.BookDate).format(
                            "HH:mm DD/MM/YYYY"
                          )
                        : "Chưa thực hiện"}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mt-4 mb-3">
                    <div className="flex justify-between mb-1 last:mb-0">
                      <div className="w-[150px]">Khách hàng:</div>
                      <div className="flex-1 font-bold text-right capitalize">
                        {Service?.data?.mem?.FullName}
                      </div>
                    </div>
                    <div className="flex justify-between mb-1 last:mb-0">
                      <div className="w-[150px]">Số điện thoại:</div>
                      <div className="flex-1 font-bold text-right">
                        {Service?.data?.mem?.MobilePhone}
                      </div>
                    </div>
                    <div className="flex justify-between mb-1 last:mb-0">
                      <div className="w-[150px]">Địa chỉ:</div>
                      <div className="flex-1 font-bold text-right">
                        {Service?.data?.mem?.HomeAddress}
                      </div>
                    </div>
                    {!ModeCard &&
                      Service?.data?.staffs &&
                      Service?.data?.staffs.length > 0 && (
                        <div className="flex justify-between mb-1 resources last:mb-0">
                          <div className="w-[150px]">Nhân viên thực hiện:</div>
                          <div className="flex-1 font-bold text-right resources-name">
                            {Service?.data?.staffs
                              .map((x) => x.FullName)
                              .join(", ")}
                          </div>
                        </div>
                      )}
                  </div>
                  <table className="w-full border border-collapse border-black text-mini print:break-inside-auto">
                    <thead>
                      <tr className="print:break-inside-avoid print:break-after-auto">
                        <th className="border border-black px-1.5 py-2 text-left">
                          Tên dịch vụ
                        </th>
                        <th className="border border-black px-1.5 py-2 text-right">
                          Buổi / Tổng
                        </th>
                      </tr>
                    </thead>

                    {ModeCard && (
                      <tbody>
                        {Service?.data?.sums &&
                          Service?.data?.sums.map((item, index) => (
                            <tr
                              className="print:break-inside-avoid print:break-after-auto item-prod"
                              key={index}
                            >
                              <td className="border border-black px-1.5 py-2">
                                <div>{item.RootTitleWithType}</div>
                                <div>{item.CardTitle}</div>
                                <div>{item?.Os?.Desc}</div>
                                <div>
                                  {item?.Os?.Status != "done"
                                    ? "Chưa làm"
                                    : moment(item.Os.BookDate).format(
                                        "HH:mm DD/MM/YYYY"
                                      )}
                                </div>
                              </td>

                              <td className="border border-black px-1.5 py-2 font-semibold text-right">
                                {item.Index} / {item.Total}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    )}
                    {!ModeCard && (
                      <tbody>
                        <tr className="print:break-inside-avoid print:break-after-auto item-prod">
                          <td className="border border-black px-1.5 py-2">
                            <div>{Service?.data?.sum?.RootTitleWithType}</div>
                            <div>{Service?.data?.sum?.CardTitle}</div>
                            {/* <div>{Service?.data?.sum?.Os?.Desc}</div>
                            <div>
                              {Service?.data?.sum?.Os?.Status != "done"
                                ? "Chưa làm"
                                : moment(
                                    Service?.data?.sum?.Os.BookDate
                                  ).format("HH:mm DD/MM/YYYY")}
                            </div> */}
                          </td>
                          <td className="border border-black px-1.5 py-2 font-semibold text-right">
                            {Service?.data?.sum?.Index} /{" "}
                            {Service?.data?.sum?.Total}
                          </td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                  {!ModeCard && (
                    <div className="my-2">
                      Ghi chú: {Service?.data?.os?.Desc}
                    </div>
                  )}

                  <div className="mt-2 text-center">
                    <div className="mb-1 font-bold">
                      {Service?.data?.SysConfig?.BillFooter}
                    </div>
                    <div className="italic">
                      Thời gian in : {moment().format("HH:mm DD/MM/YYYY")}
                    </div>
                  </div>
                </div>
                <div className="h-20"></div>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

export default ButtonPrinter;

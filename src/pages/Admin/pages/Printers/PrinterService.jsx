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
import { ChevronLeftIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ConfigsAPI from "@/api/Configs.api";
import moment from "moment";
import * as htmlToImage from "html-to-image";
import MoresAPI from "@/api/Mores.api";

var pIndex = 0;

function PrinterService({ f7route }) {
  const Auth = useStore("Auth");

  let Mode = f7route?.query?.mode || "";

  const CrStocks = useStore("CrStocks");

  const ServiceRef = useRef(null);

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
              x.Type === "Service" && x.Checked && x.Path.indexOf("A5") === -1
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

  const Service = useQuery({
    queryKey: ["ServicePrinter", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let data = await AdminAPI.getPrinterServiceId({
        OsID: f7route?.params?.id,
        Token: Auth?.token,
        ModeCard: Mode,
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

    let refCurrent = ServiceRef?.current;

    let sizeCanvas = 530;
    if (print.Path.indexOf("printOrderDHSize57") > -1) {
      sizeCanvas = 380;
    }

    while (imageBase64.length < minDataLength && i < maxAttempts) {
      imageBase64 = await htmlToImage.toPng(refCurrent, {
        canvasWidth: sizeCanvas,
        canvasHeight:
          (sizeCanvas * refCurrent?.clientHeight) / refCurrent?.clientWidth,
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

  const onShare = async () => {
    f7.dialog.preloader("Đang thực hiện ...");
    let imageBase64 = "";
    const minDataLength = 2000000;
    let i = 0;
    const maxAttempts = 10;

    let refCurrent = ServiceRef?.current;
    refCurrent?.classList.add("p-4");
    let sizeCanvas = 530;

    while (imageBase64.length < minDataLength && i < maxAttempts) {
      imageBase64 = await htmlToImage.toPng(refCurrent, {
        canvasWidth: sizeCanvas,
        canvasHeight:
          (sizeCanvas * refCurrent?.clientHeight) / refCurrent?.clientWidth,
        pixelRatio: 1,
        // skipAutoScale: true,
        cacheBust: true,
        //skipFonts: true
      });
      i += 1;
    }

    var bodyFormData = new FormData();
    bodyFormData.append(
      "title",
      `Hoa-don-ban-hang-${Service?.data?.os?.ID}-${moment(
        Service?.data?.os?.BookDate
      ).format("HH:mm_DD-MM-YYYY")}`
    );
    bodyFormData.append("base64", imageBase64);

    let rs = await MoresAPI.base64toImage({
      data: bodyFormData,
      Token: Auth?.token,
    });

    refCurrent?.classList.remove("p-4");
    f7.dialog.close();
    PromHelpers.SHARE_SOCIAL(
      JSON.stringify({
        Images: [AssetsHelpers.toAbsoluteUrl(rs?.data?.src)],
        Content: `Hoá đơn bán hàng - ${Service?.data?.os?.ID} (${moment(
          Service?.data?.os?.BookDate
        ).format("HH:mm DD/MM/YYYY")})`,
      })
    );
  };

  return (
    <Page
      className="!bg-white"
      name="Service-Printer"
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
        <NavTitle>
          {" "}
          {Mode ? "Thẻ dịch vụ" : "Phiếu dịch vụ"} #{f7route?.params?.id}
        </NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full pb-safe-b">
        <div className="p-4 overflow-auto grow">
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
                {!Mode &&
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
                    <th className="border border-black px-1.5 py-2 text-right w-[100px]">
                      Buổi / Tổng
                    </th>
                  </tr>
                </thead>

                {Mode && (
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
                {!Mode && (
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
              {!Mode && (
                <div className="my-2">Ghi chú: {Service?.data?.os?.Desc}</div>
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
            loading={isLoading || PrintersIP?.isLoading || Service.isLoading}
            disabled={isLoading || PrintersIP?.isLoading || Service.isLoading}
            onClick={onPrinter}
          >
            In hoá đơn
          </Button>
        </div>
        {/* <div className="flex gap-3 p-4 bg-white border-t">
          <Button
            style={{ "--f7-preloader-color": "#000" }}
            type="button"
            className="bg-white w-[50px] text-black border border-[#d3d3d3] button button-fill button-large button-preloader popover-open"
            fill
            large
            preloader
            onClick={onShare}
            loading={isLoading || PrintersIP?.isLoading || Order.isLoading}
            disabled={isLoading || PrintersIP?.isLoading || Order.isLoading}
          >
            <ShareIcon className="w-6" />
          </Button>
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
        </div> */}
      </div>
    </Page>
  );
}

export default PrinterService;

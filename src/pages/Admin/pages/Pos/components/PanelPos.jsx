import AssetsHelpers from "@/helpers/AssetsHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Link, Panel, f7, useStore } from "framework7-react";
import moment from "moment";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { getDatabase, ref, set } from "firebase/database";
import { toast } from "react-toastify";
import { useMutation } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { PickerShowQrCode } from ".";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { useFirebase } from "@/hooks";

const PanelPos = forwardRef(function PanelPos({ Client }, ref) {
  let buttonRef = useRef(null);
  useImperativeHandle(ref, () => ({
    openPopover: () => {
      buttonRef?.current?.el?.click();
    },
  }));

  const CrStocks = useStore("CrStocks");
  const Brand = useStore("Brand");
  const Auth = useStore("Auth");
  const FirebaseApp = useStore("FirebaseApp");

  const firebase = useFirebase(FirebaseApp);

  const database = firebase.db;

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const getMobileSystem = (navigators, byLogin = false) => {
    if (navigators) {
      let { app, logout } = JSON.parse(navigators);
      if (byLogin) {
        return logout;
      }
      if (/windows phone/i.test(app)) {
        return "Windows Phone";
      }
      if (/android/i.test(app)) {
        return "Android";
      }
      if (/iPad|iPhone|iPod/.test(app)) {
        return "iOS";
      }
    }
    return undefined;
  };

  const getDayFetus = (desc) => {
    if (!desc) return;
    let descSplit = desc.split("\n");
    let index = descSplit.findIndex((x) => x.indexOf("TB:") > -1);
    if (index > -1) {
      let days = descSplit[index].slice(1, -1);
      let daysSplit = days.split(":");
      if (
        daysSplit &&
        moment(daysSplit[1], "DD/MM/YYYY").format("DD/MM/YYYY") === daysSplit[1]
      ) {
        let weekDay = moment
          .duration(moment(daysSplit[1], "DD/MM/YYYY").diff(moment()))
          .asWeeks();
        let weekTotal = Math.round(Math.abs(weekDay)) + Number(daysSplit[2]);
        if (0 < weekTotal && weekTotal < 40) {
          return Math.round(Math.abs(weekDay)) + Number(daysSplit[2]) + " Tuần";
        }
      }
    }
    return;
  };

  const getExpectedBirth = (desc) => {
    if (!desc) return;
    let descSplit = desc.split("\n");
    let index = descSplit.findIndex((x) => x.indexOf("DS:") > -1);
    if (index > -1) {
      let days = descSplit[index].slice(1, -1);
      let daysSplit = days.split(":");
      if (
        daysSplit &&
        moment(daysSplit[1], "DD/MM/YYYY").format("DD/MM/YYYY") === daysSplit[1]
      ) {
        return (
          "Dự sinh " + moment(daysSplit[1], "DD/MM/YYYY").format("DD/MM/YYYY")
        );
      }
    }
    return;
  };

  const getTokenMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsGetTokenId(body);
      return data;
    },
  });

  const QRLogin = (open) => {
    if (FirebaseApp) {
      f7.dialog.preloader("Đang thực hiện ...");
      getTokenMutation.mutate(
        {
          Token: Auth?.token,
          MemberID: Client?.ID,
        },
        {
          onSuccess: ({ data }) => {
            if (data?.token) {
              set(
                ref(
                  database,
                  "qrcode/" +
                    Brand?.Domain?.replace(/^https?:\/\//, "")
                      .replaceAll(".", "_")
                      .toUpperCase() +
                    "/" +
                    CrStocks?.ID +
                    "/" +
                    data?.token
                ),
                {
                  Token: data?.token,
                  TokenDate: moment(new Date()).format("HH:mm DD/MM/YYYY"),
                  StockCurrent: CrStocks?.ID,
                  FullName: Client?.FullName,
                  Domain: Brand?.Global?.APP?.isMulti ? Brand?.Domain : null,
                }
              )
                .then(() => {
                  toast.success("Bật QR Login thành công.");
                  let val = data?.token + "&" + CrStocks?.ID;
                  if (Brand?.Global?.APP?.isMulti) {
                    val =
                      data?.token + "&" + CrStocks?.ID + "&" + Brand?.Domain;
                  }

                  Brand?.Global?.Admin?.isQrAdmin && open(val);
                  f7.dialog.close();
                })
                .catch((error) => {
                  console.log(error);
                });
            } else {
              f7.dialog.close();
              toast.error("Firebase chưa được kết nối.");
            }
          },
        }
      );
    } else {
      toast.error("Firebase chưa được kết nối.");
    }
  };

  const getValueOrder = (rs) => {
    let Value = 0;
    if (rs?.cashSum && rs.cashSum.length > 0) {
      return rs.cashSum[0].Payed - Math.abs(rs.cashSum[0].Return);
    }
    return Value;
  };

  const isOldCard = () => {
    if (Brand?.Global?.Admin?.nv_le_tan_an_tao_the_cu) {
      return adminTools_byStock?.hasRight;
    }
    return !Brand?.Global?.Admin?.nv_le_tan_an_tao_the_cu;
  };

  return (
    <Panel left floating swipeOnlyClose containerEl="#page-pos" id="panel-pos">
      <div className="flex flex-col h-full">
        <div className="flex p-3 border-b">
          <Link
            panelClose
            noLinkClass
            className="flex items-center w-[calc(100%-44px)] bg-white"
            href={`/admin/pos/clients/edit/${
              Client?.ID
            }/?formState=${JSON.stringify(Client)}`}
          >
            <div className="w-11 h-11">
              {Client?.Photo ? (
                <img
                  className="object-cover w-full rounded-xl aspect-square"
                  src={
                    !Client?.Photo
                      ? AssetsHelpers.toAbsoluteUrlCore(
                          "/AppCore/images/blank.png",
                          ""
                        )
                      : AssetsHelpers.toAbsoluteUrl(Client?.Photo)
                  }
                  onError={(e) =>
                    (e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                      "/AppCore/images/blank.png",
                      ""
                    ))
                  }
                />
              ) : (
                <div className="relative h-full overflow-hidden bg-gray-100 w-11 rounded-xl">
                  <svg
                    className="absolute w-12 h-12 text-gray-400 -bottom-2 left-2/4 -translate-x-2/4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 px-3 truncate">
              <div className="font-medium truncate">{Client?.FullName}</div>
              <div className="flex mt-px text-muted">
                {Client?.MobilePhone} <PencilSquareIcon className="w-4 ml-2" />
              </div>
            </div>
          </Link>
          <PickerShowQrCode Title="QR Code đăng nhập">
            {({ open }) => (
              <div
                className="flex items-center justify-center min-w-[44px] w-[44px] border border-app text-app rounded-lg"
                onClick={() => QRLogin(open)}
              >
                <QrCodeIcon className="w-7" />
              </div>
            )}
          </PickerShowQrCode>
        </div>
        <div className="flex flex-wrap gap-1 px-3 py-2.5 border-b-4">
          <div className="bg-danger-light text-danger rounded px-1.5 text-[13px] py-px">
            #{Client?.ID}
          </div>
          {Brand?.Global?.Admin?.thong_tin_pos && (
            <Link
              panelClose
              href={`/admin/pos/manage/${Client?.ID}/info-client`}
              noLinkClass
              className="bg-success-light text-success rounded px-1.5 text-[13px] py-px"
            >
              Thông tin
            </Link>
          )}

          {Client?.Stock?.ID && Client?.Stock?.ID !== CrStocks?.ID ? (
            <div className="bg-danger-light text-danger rounded px-2 text-[13px] py-px">
              Khác điểm : {Client?.Stock?.Title}
            </div>
          ) : (
            <></>
          )}
          {getDayFetus(Client?.Desc) ? (
            <div className="bg-success-light text-success rounded px-2 text-[13px] py-px">
              {getDayFetus(Client?.Desc)}
            </div>
          ) : (
            <></>
          )}

          {getExpectedBirth(Client?.Desc) ? (
            <div className="bg-success-light text-success rounded px-2 text-[13px] py-px">
              {getExpectedBirth(Client?.Desc)}
            </div>
          ) : (
            <></>
          )}

          {Client?.GroupJSON && Client?.GroupJSON.length > 0 ? (
            Client?.GroupJSON.map((item, index) => (
              <div
                className={clsx(
                  "rounded px-2 text-[13px] py-px",
                  !item?.Color
                    ? "!bg-success-light !text-success"
                    : "text-white"
                )}
                style={{
                  backgroundColor: item.Color,
                }}
                key={index}
              >
                {item?.Title}
              </div>
            ))
          ) : (
            <></>
          )}

          {Client?.Birth &&
            moment().format("DD-MM") ===
              moment(Client?.Birth, "YYYY-MM-DD").format("DD-MM") && (
              <>
                <div className="bg-danger-light text-danger rounded px-2 text-[13px] py-px">
                  {moment().format("DD") ===
                  moment(Client?.Birth, "YYYY-MM-DD").format("DD")
                    ? "Sinh nhật hôm nay"
                    : "Sinh nhật tháng"}
                </div>
              </>
            )}
          {Client?.Source && (
            <div className="bg-success-light text-success rounded px-2 text-[13px] py-px">
              {Client?.Source}
            </div>
          )}
          {Client?.Jobs && (
            <div className="bg-success-light text-success rounded px-2 text-[13px] py-px">
              {Client?.Jobs}
            </div>
          )}
          {Client?.AppInfo && (
            <div
              className={clsx(
                "rounded px-2 text-[13px] py-px",
                getMobileSystem(Client?.AppInfo, true)
                  ? "bg-danger-light text-danger"
                  : "bg-success-light text-success"
              )}
            >
              {getMobileSystem(Client?.AppInfo, true) ? "Offline" : "Online"}
              <span className="pl-1">{getMobileSystem(Client?.AppInfo)}</span>
            </div>
          )}
        </div>
        <div className="px-3 py-3 border-b">
          <Link
            ref={buttonRef}
            popoverOpen=".popover-add-pos"
            className="w-full px-4 py-3 font-medium text-white rounded bg-app"
          >
            Thêm mới hoá đơn, tích thẻ
            <ChevronUpIcon className="w-5 ml-2" />
          </Link>
        </div>
        <div className="overflow-auto grow bg-[var(--f7-page-bg-color)]">
          <div className="p-3">
            <div className="mt-3 bg-white rounded-lg first:mt-0">
              <div className="border-b last:border-b-0">
                <Link
                  className="flex px-4 py-3.5 font-medium text-[#3F4254]"
                  noLinkClass
                  href={`/admin/pos/manage/${Client?.ID}/services`}
                  panelClose
                >
                  Quản lý thẻ dịch vụ
                </Link>
              </div>
              <div className="border-b last:border-b-0">
                <Link
                  className="flex px-4 py-3.5 font-medium text-[#3F4254]"
                  noLinkClass
                  href={
                    `/admin/pos/manage/${Client?.ID}/books/?client=` +
                    JSON.stringify({
                      label: Client?.FullName,
                      value: Client?.ID,
                      MobilePhone: Client?.MobilePhone,
                    })
                  }
                  panelClose
                >
                  Quản lý đặt lịch
                </Link>
              </div>
              <div className="border-b last:border-b-0">
                <Link
                  className="flex flex-col px-4 py-3.5 font-medium text-[#3F4254]"
                  noLinkClass
                  href={`/admin/pos/manage/${Client?.ID}/order/`}
                  panelClose
                >
                  Đơn hàng
                  {getValueOrder(Client?.Present) > 0 ? (
                    <div className="mt-[2px] italic leading-4">
                      <span className="font-light text-gray-500">
                        Đã chi tiêu
                      </span>
                      <span className="pl-2 font-bold font-lato text-danger">
                        {StringHelpers.formatVND(
                          getValueOrder(Client?.Present)
                        )}
                      </span>
                    </div>
                  ) : (
                    <></>
                  )}
                </Link>
              </div>
              <div className="border-b last:border-b-0">
                <Link
                  panelClose
                  className="flex px-4 py-3.5 font-medium text-[#3F4254]"
                  noLinkClass
                  href={`/admin/pos/manage/${Client?.ID}/diary`}
                >
                  Nhật ký khách hàng
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 first:mt-0">
              <Link
                className="bg-white rounded-lg p-3.5"
                noLinkClass
                onClick={(e) => {
                  e.preventDefault();
                  f7.panel.close("left");
                  f7.views.main.router.navigate(
                    `/admin/pos/manage/${Client?.ID}/wallet/`
                  );
                }}
              >
                <div className="mb-[2px] font-light text-gray-500">
                  Ví điện tử
                </div>
                <div className="font-bold leading-4 font-lato text-app">
                  {StringHelpers.formatVND(Client?.Present?.nap_vi)}
                </div>
              </Link>
              <Link
                noLinkClass
                className="bg-white rounded-lg p-3.5"
                onClick={(e) => {
                  e.preventDefault();
                  f7.panel.close("left");
                  f7.views.main.router.navigate(
                    `/admin/pos/manage/${Client?.ID}/card/`
                  );
                }}
              >
                <div className="mb-[2px] font-light text-gray-500">
                  Thẻ tiền
                </div>
                <div className="font-bold leading-4 font-lato">
                  {StringHelpers.formatVND(Client?.Present?.the_tien_kha_dung)}
                </div>
              </Link>
              <Link
                noLinkClass
                className="bg-white rounded-lg p-3.5"
                onClick={(e) => {
                  e.preventDefault();
                  f7.panel.close("left");
                  f7.views.main.router.navigate(
                    `/admin/pos/manage/${Client?.ID}/points/`
                  );
                }}
              >
                <div className="mb-[2px] font-light text-gray-500">
                  Tích điểm
                </div>
                <div className="font-bold leading-4 font-lato">
                  {Client?.Present?.points || 0}
                </div>
              </Link>
              <Link
                noLinkClass
                className="bg-white rounded-lg p-3.5"
                onClick={(e) => {
                  e.preventDefault();
                  f7.panel.close("left");
                  f7.views.main.router.navigate(
                    `/admin/pos/manage/${Client?.ID}/debt/`
                  );
                }}
              >
                <div className="mb-[2px] font-light text-gray-500">Công nợ</div>
                <div className="font-bold leading-4 font-lato text-danger">
                  {StringHelpers.formatVND(Client?.Present?.no)}
                </div>
              </Link>
            </div>
            {isOldCard() && (
              <div className="mt-3 bg-white rounded-lg first:mt-0">
                <div className="border-b last:border-b-0">
                  <Link
                    className="flex px-4 py-3.5 font-medium text-[#3F4254]"
                    noLinkClass
                    href={`/admin/pos/manage/${Client?.ID}/create-old-card/`}
                    panelClose
                  >
                    Tạo thẻ cũ
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
});

export default PanelPos;

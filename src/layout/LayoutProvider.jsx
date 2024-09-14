import { f7, useStore } from "framework7-react";
import React, { useEffect, useRef } from "react";
import store from "../js/store";
import { useQuery } from "react-query";
import AuthAPI from "../api/Auth.api";
import AdminAPI from "../api/Admin.api";
import DeviceHelpers from "../helpers/DeviceHelpers";
import axios from "axios";
import ConfigsAPI from "../api/Configs.api";
import moment from "moment";
import PromHelpers from "../helpers/PromHelpers";

function LayoutProvider({ children }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const notificationFull = useRef(null);

  useEffect(() => {
    if (!window.PlatformVersion) {
      f7.dialog
        .create({
          title: "PHIÊN BẢN MỚI",
          text: "Cập nhật hỗ trợ chấm công Wifi.",
          closeByBackdropClick: "true",
          buttons: [
            {
              text: "Nâng cấp ngay",
              onClick: () => {
                if (window.PlatformId === "ANDROID") {
                  PromHelpers.OPEN_LINK(
                    "https://play.google.com/store/apps/details?id=vn.ezsspa&hl=en&gl=US"
                  );
                } else {
                  PromHelpers.OPEN_LINK(
                    "https://apps.apple.com/us/app/ezs-spa/id6466800951"
                  );
                }
              },
              close: false,
            },
          ],
        })
        .open();
    }
  }, []);

  useQuery({
    queryKey: ["Auth", { Token: Auth?.Token, WorkTrackStockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data } = await AuthAPI.checkToken({
        Token: Auth?.token,
        WorkTrackStockID: CrStocks?.ID,
      });
      return { data };
    },
    onSettled: ({ data }) => {
      if (data?.error) {
        if (data?.error === "TOKEN_KHONG_HOP_LE_2") {
          f7.dialog.alert("Phiên đăng nhập của bạn đã hết hạn.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        } else {
          f7.dialog.alert(data?.error || "Lỗi chưa được xác định.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        }
      } else {
        if (data?.Status !== -1) {
          DeviceHelpers.get({
            success: ({ deviceId }) => {
              if (
                (data &&
                  data.ID &&
                  data.DeviceIDs &&
                  data.DeviceIDs === deviceId) ||
                (data && data.ID && data.ID === 1)
              ) {
                store.dispatch("setAuth", data);
              } else if (
                data &&
                data.ID &&
                data.DeviceIDs &&
                data.ID !== 1 &&
                data.DeviceIDs !== deviceId
              ) {
                f7.dialog.alert(
                  "Tài khoản đang đăng nhập trên thiết bị khác.",
                  () => {
                    store
                      .dispatch("setLogout")
                      .then(() => f7.views.main.router.navigate("/login/"));
                  }
                );
              } else if (data && data.ID && !data.DeviceIDs) {
                f7.dialog.alert("Phiên đăng nhập của bạn đã hết hạn.", () => {
                  store
                    .dispatch("setLogout")
                    .then(() => f7.views.main.router.navigate("/login/"));
                });
              } else if (data) {
                store.dispatch("setAuth", data);
              }
            },
          });
        } else {
          f7.dialog.alert("Tài khoản của bạn đã bị vô hiệu hoá.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        }
      }
    },
    enabled: Boolean(Auth && Auth?.token),
  });

  useQuery({
    queryKey: ["Brand", Brand?.Domain],
    queryFn: async () => {
      let { data: Config } = await axios.get(
        `${Brand?.Domain}/api/v3/config?cmd=getnames&names=Bill.Title,logo.mau&ignore_root=1`
      );
      let { data: Global } = await axios.get(
        `${Brand?.Domain}/brand/global/Global.json?${new Date().getTime()}`
      );
      let { data: template } = await axios.get(
        `${
          Brand?.Domain
        }/AdminCp/Controls/Noti2/NotiTemplate.json?${new Date().getTime()}`
      );

      return {
        Config: Config?.data || null,
        Global: Global ? { ...Global, ...template } : null,
      };
    },
    onSettled: ({ Config, Global }) => {
      if (!Config) {
        f7.dialog.alert("Đăng nhập lỗi. Vui lòng đăng nhập lại", () => {
          store
            .dispatch("setLogout")
            .then(() => f7.views.main.router.navigate("/login/"));
        });
      } else {
        store.dispatch("setBrand", {
          Domain: Brand?.Domain,
          Name: Config.filter((x) => x.Name === "Bill.Title")[0]["ValueText"],
          Logo: Config.filter((x) => x.Name === "logo.mau")[0]["Src"],
          Global,
        });
      }
    },
    enabled: Boolean(Brand && Brand?.Domain),
  });

  useQuery({
    queryKey: ["WorkTimeSetting", Auth?.WorkTimeSetting],
    queryFn: async () => {
      let { data, headers } = await ConfigsAPI.getValue(
        "calamviecconfig,congcaconfig"
      );
      return {
        WorkTimes:
          data.data &&
          data.data.filter((x) => x.Name === "calamviecconfig").length > 0
            ? data.data.filter((x) => x.Name === "calamviecconfig")[0].Value
            : null,
        WorkShifts:
          data.data &&
          data.data.filter((x) => x.Name === "congcaconfig").length > 0
            ? data.data.filter((x) => x.Name === "congcaconfig")[0].Value
            : null,
        CrDate: headers?.Date,
      };
    },
    onSettled: ({ WorkTimes, WorkShifts, CrDate }) => {
      let WorkTimeSetting = WorkTimes ? JSON.parse(WorkTimes) : null;
      let WorkShiftsSetting = WorkShifts ? JSON.parse(WorkShifts) : null;
      let AuthWorkTimeSetting = Auth?.WorkTimeSetting
        ? JSON.parse(Auth?.WorkTimeSetting)
        : null;

      let WorkTimeToday = null;

      let indexWorkTime =
        WorkTimeSetting &&
        WorkTimeSetting.findIndex((x) => x.ID === AuthWorkTimeSetting?.ShiftID);

      if (indexWorkTime > -1) {
        let { Days, flexible, Options } = WorkTimeSetting[indexWorkTime];
        if (flexible) {
          WorkTimeToday = {
            flexible,
            Options,
            SalaryHours: AuthWorkTimeSetting?.SalaryHours || 0,
          };
        } else if (Days && Days.length > 0) {
          let indexDays = Days.findIndex(
            (x) =>
              x.Title === moment(CrDate, "MM/DD/YYYY HH:mm:ss").format("dddd")
          );
          WorkTimeToday = Days[indexDays];
          WorkTimeToday.SalaryHours = AuthWorkTimeSetting?.SalaryHours || 0;
        }
      } else {
        let flexibleIndex = WorkTimeSetting.findIndex((x) => x.flexible);
        if (flexibleIndex > -1) {
          let { flexible, Options } = WorkTimeSetting[flexibleIndex];
          WorkTimeToday = {
            flexible,
            Options,
            SalaryHours: AuthWorkTimeSetting?.SalaryHours || 0,
          };
        }
      }
      store.dispatch("setWorkTimeSettings", {
        WorkTimeToday,
        WorkTimeSetting,
        WorkShiftsSetting: {
          DI_SOM: WorkShiftsSetting?.DI_SOM || [],
          DI_MUON: WorkShiftsSetting?.DI_MUON || [],
          VE_SOM: WorkShiftsSetting?.VE_SOM || [],
          VE_MUON: WorkShiftsSetting?.VE_MUON || [],
        },
      });
    },
    enabled: Boolean(Auth && Auth?.token),
  });

  useQuery({
    queryKey: ["Notifications", { ID: Auth?.ID }],
    queryFn: async () => {
      let { data } = await AuthAPI.listNotifications(Auth?.ID);
      return data?.data || [];
    },
    onSettled: (data) => {
      store.dispatch("setNotifications", data);
    },
    enabled: Boolean(Auth && Auth?.token),
  });

  const { refetch: refetchProcessings } = useQuery({
    queryKey: ["Processings", { ID: Auth?.ID, StockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data } = await AdminAPI.listProcessings({
        StockID: CrStocks?.ID,
        Token: Auth?.token,
      });
      let rs = null;
      if (data?.data) {
        rs = {
          items: [],
          Count: 0,
        };

        for (const property in data?.data) {
          if (
            [
              "memberBooks",
              "memberBooksCancel",
              "orderWebApp",
              "smsPayed",
              "noti",
              "contact",
              "qrCallback",
            ].includes(property)
          ) {
            if (Array.isArray(data?.data[property])) {
              rs.Count += data?.data[property].length;
            }

            let obj = {};
            obj.children = data?.data[property];
            obj.ID = property;
            if (property === "memberBooks") {
              obj.Title = "Đặt lịch";
              obj.Index = 1;
            }
            if (property === "memberBooksCancel") {
              obj.Title = "Huỷ lịch";
              obj.Index = 2;
            }
            if (property === "orderWebApp") {
              obj.Title = "Đơn hàng Online";
              obj.Index = 3;
            }
            if (property === "smsPayed") {
              obj.Title = "Duyệt thanh toán";
              obj.Index = 4;
            }
            if (property === "noti") {
              obj.Title = "Lịch nhắc";
              obj.Index = 5;
            }
            if (property === "contact") {
              obj.Title = "Liên hệ";
              obj.Index = 6;
            }
            if (property === "qrCallback") {
              obj.Title = "Thanh toán";
              obj.Index = 7;
            }
            rs.items.push(obj);
          }
        }
      }

      return {
        ...rs,
        items: rs.items.sort((a, b) => a?.Index - b?.Index),
      };
    },
    onSettled: (data) => {
      store.dispatch("setProcessings", data);
    },
    enabled: Boolean(Auth && Auth?.token),
    initialData: {
      items: [],
      Count: 0,
    },
  });

  const handleBzReceive = ({ data }) => {
    let newData = JSON.parse(data.data);
    if (!newData?.subject) return;

    refetchProcessings();

    if (!notificationFull.current) {
      notificationFull.current = f7.notification.create({
        titleRightText: "vài giây trước",
        title: "Thông báo",
        subtitle: "Bạn có 1 cần xử lý mới",
        closeTimeout: 5000,
        closeOnClick: true,

        on: {
          click() {
            if (window.PathCurrent !== "/admin/processings/") {
              f7.views.main.router.navigate("/admin/processings/");
            }
          },
        },
      });
    }
    notificationFull.current.open();
  };

  useEffect(() => {
    if (Auth?.token) {
      if (!window.bzClient) {
        var gr = Brand.Domain.replaceAll("https://", "");

        var bzClient = new BZ({
          group: gr,
          user: "u_" + Auth?.ID,
          ReceiveMessage: function (sender, data, group) {
            var e = new Event("bz.receive");
            e.data = {
              sender: sender,
              data: data,
            };
            document.dispatchEvent(e);

            try {
              var o = JSON.parse(data); //{to: subject:'', body:{}}
              //console.log(o);
            } catch (e) {
              //
              throw e;
            }
          },
        });
        window.bzClient = bzClient;
        bzClient.start();
      }
    }
  }, [Auth, Brand]);

  useEffect(() => {
    document.addEventListener("bz.receive", handleBzReceive);
    return () => document.removeEventListener("bz.receive", handleBzReceive);
  });

  return <>{children}</>;
}

export default LayoutProvider;

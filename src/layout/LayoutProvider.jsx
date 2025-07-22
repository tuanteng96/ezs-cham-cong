import { f7, useStore } from "framework7-react";
import React, { useEffect, useRef } from "react";
import store from "../js/store";
import { useQuery, useQueryClient } from "react-query";
import AuthAPI from "../api/Auth.api";
import AdminAPI from "../api/Admin.api";
import DeviceHelpers from "../helpers/DeviceHelpers";
import axios from "axios";
import ConfigsAPI from "../api/Configs.api";
import moment from "moment";
import PromHelpers from "../helpers/PromHelpers";
import CDNHelpers from "@/helpers/CDNHelpers";

window.axios = axios;

function LayoutProvider({ children }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const queryClient = useQueryClient();

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

  const { refetch: refetchAuth } = useQuery({
    queryKey: ["Auth", { Token: Auth?.token, WorkTrackStockID: CrStocks?.ID }],
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
              let { StockInfo, Info } = data;
              let { Stocks } = Info;
              if (
                data.ID !== 1 &&
                StockInfo &&
                Stocks.some(
                  (x) =>
                    typeof x?.IsPublic !== "undefined" &&
                    x.ID === StockInfo?.ID &&
                    !x?.IsPublic
                )
              ) {
                f7.dialog.alert(
                  `Cơ sở ${StockInfo?.Title} đang dừng hoạt động.`,
                  () => {
                    store
                      .dispatch("setLogout")
                      .then(() => f7.views.main.router.navigate("/login/"));
                  }
                );
              }
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

  window.refetchAuth = refetchAuth;

  useQuery({
    queryKey: ["Brand", Brand?.Domain],
    queryFn: async () => {
      let { data: Config } = await axios.get(
        `${Brand?.Domain}/api/v3/config?cmd=getnames&names=Bill.Title,logo.mau,App.webnoti&ignore_root=1`
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
        let FirebaseApp = null;
        if (Config.filter((x) => x.Name === "App.webnoti").length > 0) {
          let firebaseStr = Config.filter((x) => x.Name === "App.webnoti")[0][
            "ValueText"
          ];

          let firebase = {
            initializeApp: (obj) => {
              FirebaseApp = obj;
            },
          };
          eval(firebaseStr);
        }
        store.dispatch("setBrand", {
          Domain: Brand?.Domain,
          Name: Config.filter((x) => x.Name === "Bill.Title")[0]["ValueText"],
          Logo: Config.filter((x) => x.Name === "logo.mau")[0]["Src"],
          FirebaseApp,
          Global,
        });
      }
    },
    enabled: Boolean(Brand && Brand?.Domain),
  });

  const { refetch: refetchWorkTimeSetting } = useQuery({
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

      if (WorkTimeSetting) {
        let indexWorkTime =
          WorkTimeSetting &&
          WorkTimeSetting.findIndex(
            (x) => x.ID === AuthWorkTimeSetting?.ShiftID
          );

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

  window.refetchWorkTimeSetting = refetchWorkTimeSetting;

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
          items: [
            {
              Title: "Đặt lịch",
              Index: 1,
              children: [],
              ID: "memberBooks",
            },
            {
              Title: "Huỷ lịch",
              Index: 2,
              children: [],
              ID: "memberBooksCancel",
            },
            {
              Title: "Đơn hàng Online",
              Index: 3,
              children: [],
              ID: "orderWebApp",
            },
            {
              Title: "Duyệt thanh toán",
              Index: 4,
              children: [],
              ID: "smsPayed",
            },
            {
              Title: "Lịch nhắc",
              Index: 5,
              children: [],
              ID: "noti",
            },
            {
              Title: "Liên hệ",
              Index: 6,
              children: [],
              ID: "contact",
            },
            {
              Title: "Thanh toán",
              Index: 7,
              children: [],
              ID: "qrCallback",
            },
          ],
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
            let index = rs.items.findIndex((x) => x.ID === property);
            if (index > -1) {
              rs.items[index].children = data?.data[property];
            }
          }
        }
      }
      return {
        ...rs,
        items: rs?.items ? rs.items.sort((a, b) => a?.Index - b?.Index) : [],
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

  window.refetchProcessings = refetchProcessings;

  useQuery({
    queryKey: ["InvoiceProcessings", { ID: Auth?.ID, StockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data } = await AdminAPI.invoiceProcessings({
        Token: Auth?.token,
        MemberCheckInID: CrStocks?.ID,
        pi: 1,
        ps: 100,
      });

      return data?.data
        ? data?.data
            .map((item) => ({
              ...item,
              TimeCheckOut: item.CheckIn.CreateDate,
            }))
            .sort(function (left, right) {
              return moment
                .utc(left.TimeCheckOut)
                .diff(moment.utc(right.TimeCheckOut));
            })
        : [];
    },
    onSettled: (data) => {
      store.dispatch("setInvoiceProcessings", data);
    },
    enabled: Boolean(Auth && Auth?.token),
  });

  useQuery({
    queryKey: ["ClientBirthDay", { ID: Auth?.ID, StockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data } = await AdminAPI.ClientBirthDay({
        Token: Auth?.token,
        pi: 1,
        ps: 100,
      });
      return data?.data || null;
    },
    onSettled: (data) => {
      store.dispatch("setClientBirthDay", data);
    },
    enabled: Boolean(Auth && Auth?.token),
  });

  const handleBzReceive = ({ data }) => {
    if (!Auth) return;
    let newData = JSON.parse(data.data);
    if (!newData?.subject) return;

    refetchProcessings();

    if (
      (newData?.body?.MemberID && newData?.subject === "userCheckInOut") ||
      newData?.subject === "member_group"
    ) {
      Promise.all([
        queryClient.invalidateQueries(["ClientManageID"]),
        queryClient.invalidateQueries(["OrderManageID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["InvoiceProcessings"]),
      ]);
    }

    if (Brand?.Global?.PosApp) {
      // if (!notificationFull.current) {
      //   notificationFull.current = f7.notification.create({
      //     titleRightText: "vài giây trước",
      //     title: "Thông báo",
      //     subtitle: "Bạn có 1 cần xử lý mới",
      //     closeTimeout: 5000,
      //     closeOnClick: true,
      //     on: {
      //       click() {
      //         if (window.PathCurrent !== "/admin/processings/") {
      //           f7.views.main.router.navigate("/admin/processings/");
      //         }
      //       },
      //     },
      //   });
      // }
      // notificationFull.current.open();
    }
  };

  useEffect(() => {
    if (Auth?.token) {
      if (!window.bzClient) {
        var gr = Brand?.Domain.replaceAll("https://", "");

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
    if (Brand && typeof window.appPOS === "undefined") {
      CDNHelpers.addScript(
        Brand.Domain + `/adminz/user.user.top/appPOS.js?${new Date().getTime()}`
      )
        .then(() => {
          appPOS.setDomain(Brand.Domain);
        })
        .catch((err) => console.log(err));
    } else if (!Brand && typeof appPOS !== "undefined") {
      // CDNHelpers.removeScript([
      //   "https://msg.ezs.vn/lib/aspnet/signalr/dist/browser/signalr.js",
      //   "/admincp/Js/datetimepicker/moment.min.js",
      //   "/adminz/user.user.top/POS27.js",
      // ]);
    }

    if (Brand && typeof window.ClientZ === "undefined") {
      window.SERVER = Brand.Domain;
      CDNHelpers.addScript(
        Brand.Domain + `/app2021/service/http-common.js?${new Date().getTime()}`
      ).then(() => {
        // StorageHelpers.remove({
        //   keys: ["clientz"],
        // });
      });
    } else if (!Brand && typeof ClientZ !== "undefined") {
      // StorageHelpers.remove({
      //   keys: ["clientz"],
      // });
      //CDNHelpers.removeScript(["/app2021/service/http-common.js"]);
    }
  }, [Brand?.Domain]);

  useEffect(() => {
    document.addEventListener("bz.receive", handleBzReceive);
    return () => document.removeEventListener("bz.receive", handleBzReceive);
  });

  let logOutAccount = (callback) => {
    store.dispatch("logoutAuto", () => {
      callback && callback();
      f7.views.main.router.navigate("/login/");
    });
  };

  window.logOutAccount = logOutAccount;

  window.f7 = {
    dialog: f7.dialog,
  };

  return <>{children}</>;
}

export default LayoutProvider;

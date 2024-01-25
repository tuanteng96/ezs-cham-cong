import { f7, useStore } from "framework7-react";
import React, { useEffect } from "react";
import store from "../js/store";
import { useQuery } from "react-query";
import AuthAPI from "../api/Auth.api";
import DeviceHelpers from "../helpers/DeviceHelpers";
import axios from "axios";
import ConfigsAPI from "../api/Configs.api";
import moment from "moment";
import PromHelpers from "../helpers/PromHelpers";

function LayoutProvider({ children }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

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
      let { data, error } = await AuthAPI.checkToken({
        Token: Auth?.token,
        WorkTrackStockID: CrStocks?.ID,
      });
      return { data, error };
    },
    onSettled: ({ data, error }) => {
      if (error) {
        if (error === "TOKEN_KHONG_HOP_LE_2") {
          f7.dialog.alert("Phiên đăng nhập của bạn đã hết hạn.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        } else {
          f7.dialog.alert(error || "Lỗi chưa được xác định.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        }
      } else {
        DeviceHelpers.get({
          success: ({ deviceId }) => {
            if (
              data &&
              data.ID &&
              data.DeviceIDs &&
              data.DeviceIDs === deviceId
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
        `${Brand?.Domain}/brand/global/Global.json`
      );

      return {
        Config: Config?.data || null,
        Global: Global || null,
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
    queryKey: ["Notifications", Auth],
    queryFn: async () => {
      let { data } = await AuthAPI.listNotifications(Auth?.ID);
      return data?.data || [];
    },
    onSettled: (data) => {
      store.dispatch("setNotifications", data);
    },
    enabled: Boolean(Auth && Auth?.token),
  });

  return <>{children}</>;
}

export default LayoutProvider;

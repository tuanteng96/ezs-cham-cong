import { createStore } from "framework7/lite";
import StorageHelpers from "../helpers/StorageHelpers";
import PromHelpers from "../helpers/PromHelpers";
import { f7 } from "framework7-react";
import SubscribeHelpers from "../helpers/SubscribeHelpers";
import axios from "axios";
import { pick, keys } from "lodash-es";
import { initializeApp } from "firebase/app";
import CDNHelpers from "@/helpers/CDNHelpers";

const store = createStore({
  state: {
    Brand: JSON.parse(localStorage.getItem("Brand")) || null,
    Auth: JSON.parse(localStorage.getItem("Auth")) || null,
    Stocks: JSON.parse(localStorage.getItem("Stocks")) || null,
    StockRights: [],
    StocksAll: [],
    CrStocks: JSON.parse(localStorage.getItem("CrStocks")) || null,
    RightTree: JSON.parse(localStorage.getItem("RightTree")) || null,
    WorkTimeSettings:
      JSON.parse(localStorage.getItem("WorkTimeSettings")) || null,
    CrsInOut: JSON.parse(localStorage.getItem("CrsInOut")) || null,
    Notifications: [],
    Processings: null,
    InvoiceProcessings: null,
    ClientBirthDayCount: null,
    FirebaseApp: null,
  },
  getters: {
    Brand({ state }) {
      return state.Brand;
    },
    Auth({ state }) {
      return {
        ...state.Auth,
        Info: state.Auth?.Info
          ? {
              ...state.Auth?.Info,
              rightTree: state.RightTree,
              StockRights: state.StockRights,
              StocksAll: state.StocksAll,
            }
          : null,
      };
    },
    Stocks({ state }) {
      return state.Stocks;
    },
    CrStocks({ state }) {
      return state.CrStocks;
    },
    WorkTimeSettings({ state }) {
      return state.WorkTimeSettings;
    },
    CrsInOut({ state }) {
      return state.CrsInOut;
    },
    Notifications({ state }) {
      return state.Notifications;
    },
    Processings({ state }) {
      return state.Processings;
    },
    InvoiceProcessings({ state }) {
      return state.InvoiceProcessings;
    },
    ClientBirthDayCount({ state }) {
      return state.ClientBirthDayCount;
    },
    FirebaseApp({ state }) {
      return initializeApp(state.FirebaseApp, state?.Brand?.Domain);
    },
  },
  actions: {
    setNotifications({ state }, value) {
      state.Notifications = value;
    },
    setClientBirthDayCount({ state }, value) {
      state.ClientBirthDayCount = value;
    },
    setProcessings({ state }, value) {
      state.Processings = value;
    },
    setInvoiceProcessings({ state }, value) {
      state.InvoiceProcessings = value;
    },
    setBrand({ state }, value) {
      StorageHelpers.set({
        data: {
          Brand: value,
        },
        success: () => {
          state.Brand = value;
          state.FirebaseApp = value?.FirebaseApp || null;
        },
      });
      if (!value) {
        if (window.appPOS) {
          window.appPOS = undefined;
          window.pos27 = undefined;
          CDNHelpers.removeScript([
            "/admincp/Js/datetimepicker/moment.min.js",
            "/adminz/user.user.top/POS27.js",
          ]);
        }
        if (window.ClientZ) {
          window.ClientZ = undefined;
          CDNHelpers.removeScript(["/app2021/service/http-common.js"]);
        }
      }
    },
    setAuth({ state }, value) {
      let model = {
        DeviceIDs: null,
        FullName: null,
        Birthday: null,
        Avatar: null,
        ID: null,
        Phone: null,
        StockInfo: null,
        StockID: null,
        UserName: null,
        acc_id: null,
        acc_type: null,
        acc_group: null,
        token: null,
        WorkTimeSetting: null,
        GroupTitles: null,
        Groups: null,
        WorkTrack: null,
        ServerTime: new Date(),
      };

      window.Info = value?.Info || null;

      let newValue = {
        ...pick(value, keys(model)),
        Info: {
          ...pick(
            value.Info,
            keys({
              CrStockID: null,
              //StockRights: null,
              //rightTree: null,
              //Stocks: null,
              Groups: null,
            })
          ),
        },
      };

      StorageHelpers.set({
        data: {
          Auth: newValue,
          Stocks: value?.Info?.Stocks?.filter((x) => x.ParentID !== 0).map(
            (x) => ({
              ...x,
              value: x.ID,
              label: x.Title,
            })
          ),
          RightTree: value?.Info?.rightTree || null,
        },
        success: () => {
          if (
            !state.CrStocks ||
            (state.CrStocks &&
              state.CrStocks?.ID === value.StockInfo?.ID &&
              state.CrStocks?.Lat === value.StockInfo?.Lat &&
              state.CrStocks?.Lng === value.StockInfo?.Lng &&
              state.CrStocks?.WifiID === value.StockInfo?.WifiID &&
              state.CrStocks?.WifiName === value.StockInfo?.WifiName)
          ) {
            let StocksList = value?.Info?.Stocks?.filter(
              (x) => x.ID !== state.CrStocks?.ID
            );

            StorageHelpers.set({
              data: {
                CrStocks:
                  value.StockInfo ||
                  StocksList.filter((x) => x.ParentID > 0)[0],
              },
              success: () =>
                (state.CrStocks =
                  value.StockInfo ||
                  StocksList.filter((x) => x.ParentID > 0)[0]),
            });
          } else {
            let indexStock = value?.Info?.Stocks?.findIndex(
              (x) => x.ID === state.CrStocks?.ID
            );
            if (indexStock === -1) {
              StorageHelpers.set({
                data: {
                  CrStocks: value.StockInfo,
                },
                success: () => (state.CrStocks = value.StockInfo),
              });
            } else {
              StorageHelpers.set({
                data: {
                  CrStocks: value?.Info?.Stocks[indexStock],
                },
                success: () =>
                  (state.CrStocks = value?.Info?.Stocks[indexStock]),
              });
            }
          }
          state.Auth = value;
          state.Stocks = value?.Info?.Stocks
            ? value?.Info?.Stocks.filter((x) => x.ParentID !== 0).map((x) => ({
                ...x,
                value: x.ID,
                label: x.Title,
              }))
            : [];

          state.StockRights = value?.Info?.StockRights || [];
          state.StocksAll = value?.Info?.Stocks || [];
          state.RightTree = value?.Info?.rightTree || null;
        },
      });
    },
    setCrStocks({ state }, value) {
      StorageHelpers.set({
        data: {
          CrStocks: value,
        },
        success: () => {
          state.CrStocks = value;
        },
      });
    },
    setWorkTimeSettings({ state }, value) {
      StorageHelpers.set({
        data: {
          WorkTimeSettings: value,
        },
        success: () => {
          state.WorkTimeSettings = value;
        },
      });
    },
    setCrsInOut({ state }, value) {
      let newState = [...(state.CrsInOut || [])];

      if (value?.success) {
        newState = newState.filter((x) => x.Uuid !== value?.Uuid);
      } else {
        let index = newState.findIndex((x) =>
          value?.CheckOut
            ? value?.CheckOut === x.CheckOut
            : value?.CheckIn === x.CheckIn
        );

        if (index === -1) {
          newState.push({
            ...value,
            Uuid: new Date().getTime(),
          });
        }
      }

      StorageHelpers.set({
        data: {
          CrsInOut: newState,
        },
        success: () => {
          state.CrsInOut = newState;
        },
      });
    },
    setLogout: ({ state }) => {
      StorageHelpers.remove({
        keys: ["Auth", "CrStocks", "WorkTimeSettings", "Stocks", "_noti_id"],
        success: () => {
          state.Auth = null;
          state.CrStocks = null;
          state.Stocks = null;
          state.WorkTimeSettings = null;
        },
      });
      if (window.PlatformId === "IOS") PromHelpers.REMOVE_BADGE();
    },
    logout({ state, dispatch }, callback) {
      f7.dialog.confirm("Bạn chắc chắn muốn đăng xuất tài khoản ?", () => {
        f7.dialog.preloader("Đang thực hiện ...");
        PromHelpers.SEND_TOKEN_FIREBASE().then(({ token, error }) => {
          if (!error) {
            if (state?.Auth?.ID) {
              axios
                .get(
                  `${state.Brand.Domain}/api/v3/apptoken?cmd=call&token=${token}&accid=${state.Auth.ID}&acctype=${state.Auth.acc_type}&senderIndex=2&logout=1`)
                .then(() => {
                  dispatch("setLogout").then(() => {
                    f7.dialog.close();
                    callback && callback();
                  });
                })
                .catch(() => {
                  //f7.dialog.alert("Error : Provisional headers are shown ...");
                  dispatch("setLogout").then(() => {
                    f7.dialog.close();
                    callback && callback();
                  });
                });
            } else {
              dispatch("setLogout").then(() => {
                f7.dialog.close();
                callback && callback();
              });
            }
          } else {
            SubscribeHelpers.remove().then(() =>
              dispatch("setLogout").then(() => {
                f7.dialog.close();
                callback && callback();
              })
            );
          }
        });
      });
    },
    logoutAuto({ state, dispatch }, callback) {
      f7.dialog.preloader("Đang thực hiện ...");
      PromHelpers.SEND_TOKEN_FIREBASE().then(({ token, error }) => {
        if (!error) {
          var bodyFormData = new FormData();
          bodyFormData.append("token", token);
          axios
            .get(
              `${state.Brand.Domain}/api/v3/apptoken?cmd=call&accid=${state.Auth.ID}&acctype=${state.Auth.acc_type}&senderIndex=2&logout=1`,
              bodyFormData
            )
            .then(() => {
              dispatch("setLogout").then(() => {
                f7.dialog.close();
                callback && callback();
              });
            })
            .catch(() => {
              //f7.dialog.alert("Error : Provisional headers are shown ...");
              dispatch("setLogout").then(() => {
                f7.dialog.close();
                callback && callback();
              });
            });
        } else {
          SubscribeHelpers.remove().then(() =>
            dispatch("setLogout").then(() => {
              f7.dialog.close();
              callback && callback();
            })
          );
        }
      });
    },
  },
});
export default store;

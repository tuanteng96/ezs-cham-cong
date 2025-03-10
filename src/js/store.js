import { createStore } from "framework7/lite";
import StorageHelpers from "../helpers/StorageHelpers";
import PromHelpers from "../helpers/PromHelpers";
import { f7 } from "framework7-react";
import SubscribeHelpers from "../helpers/SubscribeHelpers";
import axios from "axios";
import { pick, keys } from "lodash-es";
import { initializeApp } from "firebase/app";

const store = createStore({
  state: {
    Brand: JSON.parse(localStorage.getItem("Brand")) || null,
    Auth: JSON.parse(localStorage.getItem("Auth")) || null,
    Stocks: JSON.parse(localStorage.getItem("Stocks")) || null,
    StocksAll: [],
    CrStocks: JSON.parse(localStorage.getItem("CrStocks")) || null,
    WorkTimeSettings:
      JSON.parse(localStorage.getItem("WorkTimeSettings")) || null,
    Notifications: [],
    Processings: null,
    InvoiceProcessings: null,
    ClientBirthDay: null,
    FirebaseApp: null,
  },
  getters: {
    Brand({ state }) {
      return state.Brand;
    },
    Auth({ state }) {
      return state.Auth;
    },
    Stocks({ state }) {
      return state.Stocks;
    },
    StocksAll({ state }) {
      return state.StocksAll;
    },
    CrStocks({ state }) {
      return state.CrStocks;
    },
    WorkTimeSettings({ state }) {
      return state.WorkTimeSettings;
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
    ClientBirthDay({ state }) {
      return state.ClientBirthDay;
    },
    FirebaseApp({ state }) {
      return state.FirebaseApp ? initializeApp(state.FirebaseApp) : null;
    },
  },
  actions: {
    setNotifications({ state }, value) {
      state.Notifications = value;
    },
    setClientBirthDay({ state }, value) {
      state.ClientBirthDay = value;
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
          state.FirebaseApp = value.FirebaseApp;
        },
      });
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
      };

      window.Info = value?.Info || null;

      let newValue = {
        ...pick(value, keys(model)),
        Info: {
          ...pick(
            value.Info,
            keys({
              CrStockID: null,
              StockRights: null,
              rightTree: null,
              Stocks: null,
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
          StocksAll: value?.Info?.Stocks,
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
          state.Stocks = value?.Info?.Stocks ? value?.Info?.Stocks.filter(
            (x) => x.ParentID !== 0
          ).map((x) => ({
            ...x,
            value: x.ID,
            label: x.Title,
          })) : [];
          state.StocksAll = value?.Info?.Stocks || [];
          // state.Stocks =
          //   (value?.Info?.StockRights &&
          //     value?.Info?.StockRights.length > 0 &&
          //     value?.Info?.StockRights.map((x) => ({
          //       ...x,
          //       value: x.ID,
          //       label: x.Title,
          //     }))) ||
          //   value?.Info?.Stocks?.filter((x) => x.ParentID !== 0).map((x) => ({
          //     ...x,
          //     value: x.ID,
          //     label: x.Title,
          //   }));
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
                f7.dialog.close();
                f7.dialog.alert("Error : Provisional headers are shown ...");
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
      });
    },
  },
});
export default store;

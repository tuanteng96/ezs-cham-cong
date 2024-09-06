import { createStore } from "framework7/lite";
import StorageHelpers from "../helpers/StorageHelpers";
import PromHelpers from "../helpers/PromHelpers";
import { f7 } from "framework7-react";
import SubscribeHelpers from "../helpers/SubscribeHelpers";
import axios from "axios";
import { pick, keys } from "lodash-es";

const store = createStore({
  state: {
    Brand: JSON.parse(localStorage.getItem("Brand")) || null,
    Auth: JSON.parse(localStorage.getItem("Auth")) || null,
    Stocks: JSON.parse(localStorage.getItem("Stocks")) || null,
    CrStocks: JSON.parse(localStorage.getItem("CrStocks")) || null,
    WorkTimeSettings:
      JSON.parse(localStorage.getItem("WorkTimeSettings")) || null,
    Notifications: [],
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
    CrStocks({ state }) {
      return state.CrStocks;
    },
    WorkTimeSettings({ state }) {
      return state.WorkTimeSettings;
    },
    Notifications({ state }) {
      return state.Notifications;
    },
  },
  actions: {
    setNotifications({ state }, value) {
      state.Notifications = value;
    },
    setBrand({ state }, value) {
      StorageHelpers.set({
        data: {
          Brand: value,
        },
        success: () => (state.Brand = value),
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
          Stocks: value?.Info?.StockRights
            ? value?.Info?.StockRights.map((x) => ({
                ...x,
                value: x.ID,
                label: x.Title,
              }))
            : [],
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
                CrStocks: value.StockInfo || StocksList[0],
              },
              success: () =>
                (state.CrStocks = value.StockInfo || StocksList[0]),
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
          state.Stocks = value?.Info?.Stocks?.filter(
            (x) => x.ParentID !== 0
          ).map((x) => ({
            ...x,
            value: x.ID,
            label: x.Title,
          }));
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

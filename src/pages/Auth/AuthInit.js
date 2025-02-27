import { f7 } from "framework7-react";
import AuthAPI from "../../api/Auth.api";
import DeviceHelpers from "../../helpers/DeviceHelpers";
import store from "../../js/store";
import axios from "axios";

const AuthInit = async () =>
  new Promise(async (resolve, reject) => {
    if (store?.getters?.Auth?.value?.token) {
      DeviceHelpers.get({
        success: ({ deviceId }) => {
          AuthAPI.checkToken(store?.getters?.Auth?.value?.token)
            .then(({ data }) => {
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
                data.DeviceIDs !== deviceId
              ) {
                f7.dialog.alert("Phiên đăng nhập của bạn đã hết hạn.", () => {
                  store
                    .dispatch("logout")
                    .then(() => f7.views.main.router.navigate("/login/"));
                });
              } else if (data && data.ID && !data.DeviceIDs) {
                // Reset máy
                f7.dialog.alert("Phiên đăng nhập của bạn đã hết hạn.", () => {
                  store
                    .dispatch("logout")
                    .then(() => f7.views.main.router.navigate("/login/"));
                });
              } else {
                if (data?.error === "TOKEN_KHONG_HOP_LE_2") {
                  f7.dialog.alert("Phiên đăng nhập của bạn đã hết hạn.", () => {
                    store
                      .dispatch("logout")
                      .then(() => f7.views.main.router.navigate("/login/"));
                  });
                } else {
                  f7.dialog.alert(
                    data?.error || "Lỗi chưa được xác định.",
                    () => {
                      store
                        .dispatch("logout")
                        .then(() => f7.views.main.router.navigate("/login/"));
                    }
                  );
                }
              }
            })
            .catch((err) => console.log(err));
        },
      });
    }
    if (store?.getters?.Brand?.value?.Domain) {
      let { data: rsConfig } = await axios.get(
        `${store?.getters?.Brand?.value?.Domain}/api/v3/config?cmd=getnames&names=Bill.Title,logo.mau&ignore_root=1`
      );
      let { data: rsStocks } = await axios.get(
        `${store?.getters?.Brand?.value?.Domain}/api/v3/web?cmd=getStock`
      );
      if (rsConfig.success && rsConfig.data) {
        store.dispatch("setBrand", {
          Domain: store?.getters?.Brand?.value?.Domain,
          Name: rsConfig.data.filter((x) => x.Name === "Bill.Title")[0][
            "ValueText"
          ],
          Logo: rsConfig.data.filter((x) => x.Name === "logo.mau")[0]["Src"],
          Stocks: rsStocks?.data?.all
            ? rsStocks?.data?.all.filter((x) => x.ParentID !== 0)
            : []
        });
      }
    }
    resolve()
  });

export { AuthInit };

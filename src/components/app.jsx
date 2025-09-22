import React, { useEffect } from "react";

import { App, View, f7 } from "framework7-react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer } from "react-toastify";

import routes from "../js/routes";
import store from "../js/store";

import Navigation from "./Navigation";
import Panels from "./Panels";

import PromHelpers from "../helpers/PromHelpers";
import { LayoutProvider } from "../layout";
import KeyboardsHelper from "../helpers/KeyboardsHelper";

import "moment/dist/locale/vi";

window.timeOutForce = null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const MyApp = () => {
  const f7params = {
    name: "Thông báo", // App name
    theme: "ios", // Automatic theme detection
    colors: {
      primary: "#3E97FF",
    },
    // App store
    store: store,
    // App routes
    routes: routes,
    dialog: {
      buttonOk: "Ok",
      buttonCancel: "Huỷ",
    },
    touch: {
      activeState: false,
    },
    iosTranslucentBars: false,
    iosTranslucentModals: false,
    view: {
      //iosDynamicNavbar: false,
      xhrCache: false,
      // restoreScrollTopOnBack: false
    },
  };

  const handleNotification = (data) => {
    if (
      data?.data?.id &&
      Number(data?.data?.id) !== Number(localStorage.getItem("_noti_id"))
    ) {
      localStorage.setItem("_noti_id", data?.data?.id);
      f7.views.main.router.navigate(`/notifications/view/${data?.data?.id}/`);
    }
  };

  window.addEventListener("click", KeyboardsHelper.bodyEventListener);

  const onAppForceIn = () => {
    window.refetchProcessings && window.refetchProcessings();
    window.refetchWorkTimeSetting && window.refetchWorkTimeSetting();
  };

  const onAppForceOut = () => {
    window.refetchProcessings && window.refetchProcessings();
    window.refetchWorkTimeSetting && window.refetchWorkTimeSetting();
    KeyboardsHelper.forceOutListener();
  };

  useEffect(() => {
    window.APP_READY = true;
    document.body.addEventListener("noti_click.go_noti", handleNotification);
    document.addEventListener("onAppForceIn", onAppForceIn);
    document.addEventListener("onAppForceOut", onAppForceOut);

    return () => {
      document.body.removeEventListener(
        "noti_click.go_noti",
        handleNotification
      );
      document.removeEventListener("onAppForceIn", onAppForceIn);
      document.removeEventListener("onAppForceOut", onAppForceOut);
    };
  }, []);

  useEffect(() => {
    var element = document.getElementById("splash-screen");
    if (element) {
      element.classList.add("hidden");
    }
  }, []);

  window.ToBackBrowser = () => {
    const { history } = f7.view.main.router;
    if (history.length === 1 && history[0] === "/") {
      PromHelpers.CLOSE_APP();
    } else {
      f7.views.main.router.back();
    }
    f7.views.main.app.sheet.close();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <App {...f7params}>
        <LayoutProvider>
          <View main className="safe-areas" url="/">
            <Navigation />
          </View>
        </LayoutProvider>
        <Panels />
      </App>
      <ToastContainer
        icon={false}
        theme="colored"
        limit={2}
        autoClose={800}
        draggable={false}
      />
    </QueryClientProvider>
  );
};
export default MyApp;

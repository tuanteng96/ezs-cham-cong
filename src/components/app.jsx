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
    refetchOnWindowFocus: false,
  },
});

const MyApp = () => {
  const f7params = {
    name: "EZS Chấm công", // App name
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
    iosTranslucentBars: false,
    iosTranslucentModals: false,
    view: {
      //iosDynamicNavbar: false,
      xhrCache: false,
      // restoreScrollTopOnBack: false
    },
  };

  const handleNotification = (data) => {
    //f7.dialog.alert(JSON.stringify(data));
  };

  window.addEventListener("click", KeyboardsHelper.bodyEventListener);

  const onAppForceIn = () => {
    window.timeOutForce = setTimeout(() => {
      PromHelpers.RELOAD_APP();
    }, 30 * 60 * 100); //3 * 60 * 60 * 100
  };

  const onAppForceOut = () => {
    KeyboardsHelper.forceOutListener();
    if (window.timeOutForce) clearTimeout(window.timeOutForce);
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
      <ToastContainer icon={false} theme="colored" limit={1} />
    </QueryClientProvider>
  );
};
export default MyApp;

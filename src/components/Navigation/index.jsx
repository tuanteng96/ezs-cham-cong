import React, { useEffect, useState } from "react";
import NavigationBase from "./NavigationBase";
import NavigationDivide from "./NavigationDivide";
import { f7, f7ready, useStore } from "framework7-react";
import NavigationPos from "./NavigationPos";
import { RolesHelpers } from "@/helpers/RolesHelpers";

let PermissionsUrl = [
  { Url: ["/admin/pos/calendar/"], Redirect: "/", Role: "pos_mng" },
];

function Navigation(props) {
  const [pathname, setPathname] = useState("");

  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const PermissionsAll = RolesHelpers.useRoles({
    nameRoles: ["pos_mng"],
    auth: Auth,
    CrStocks,
  });

  useEffect(() => {
    f7ready((f7) => {
      f7.views.main.on("routeChange", (newRoute) => {
        setPathname(newRoute.url);

        window.PathCurrent = newRoute.url;

        if (window.PlatformId === "ANDROID") {
          if (
            document.activeElement &&
            (document.activeElement.tagName === "INPUT" ||
              document.activeElement.tagName === "TEXTAREA")
          ) {
            document.activeElement.blur();
          }
        }
      });
    });
  }, []);

  useEffect(() => {
    if (Auth && CrStocks) {
      let index = PermissionsUrl.findIndex(
        (x) => x.Url.includes(pathname) || pathname.indexOf(x.Url) > -1
      );
      if (index > -1) {
        let { hasRight } = PermissionsAll[PermissionsUrl[index].Role];
        if (!hasRight) {
          f7.dialog.alert("Bạn không có quyền truy cập.", () => {
            f7.views.main.router.navigate("/");
          });
        }
      }
    }
  }, [CrStocks?.ID, pathname]);

  if (pathname.includes("pos/") || ["/admin/cash/"].includes(pathname)) {
    return <NavigationPos pathname={pathname} />;
  }

  if (Brand?.Global?.Timekeeping?.Version === 1) {
    return <NavigationDivide pathname={pathname} />;
  }
  return <NavigationBase pathname={pathname} />;
}

export default Navigation;

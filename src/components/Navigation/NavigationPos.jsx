import { f7, Link, Popover, Toolbar, useStore } from "framework7-react";
import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  BanknotesIcon,
  BarsArrowUpIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  HomeIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import RouterHelpers from "../../helpers/RouterHelpers";
import { PickerSheet } from "@/partials/components/Sheet";
import { PickerCashAddEdit } from "@/pages/Admin/pages/Cash/components";
import {
  PickerAddDebt,
  PickerInvoiceNew,
} from "@/pages/Admin/pages/Pos/components";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function NavigationPos({ pathname }) {
  let InvoiceProcessings = useStore("InvoiceProcessings");
  let Processings = useStore("Processings");

  let [CountProcessings, setCountProcessings] = useState(0);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { thu_chi_cash, tong_hop_cash } = RolesHelpers.useRoles({
    nameRoles: ["thu_chi_cash", "tong_hop_cash"],
    auth: Auth,
    CrStocks,
  });

  useEffect(() => {
    setCountProcessings(Processings?.Count);
  }, [Processings]);

  const noBottomNav = useMemo(() => {
    return (
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.includes(pathname) ||
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.some(
        (x) => pathname.indexOf(x) > -1
      )
    );
  }, [pathname]);

  if (noBottomNav) {
    return <></>;
  }

  return (
    <>
      {[
        "/admin/pos/clients/",
        "/admin/pos/calendar/",
        "/admin/pos/orders/",
        "/admin/cash/",
      ].includes(pathname) && (
        <>
          {CountProcessings > 0 && (
            <Link
              href="/admin/processings/"
              noLinkClass
              className="button-to-popover fixed z-[600] bg-danger text-white w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-fab right-4 bottom-[calc(var(--f7-toolbar-height)+80px+var(--f7-safe-area-bottom))]"
            >
              <BellAlertIcon className="w-7 animate-ezs-bell" />
              {CountProcessings > 0 ? (
                <div className="absolute -top-px -right-px font-lato font-bold text-white bg-danger text-[11px] px-1 py-[2px] leading-none border border-white rounded-full">
                  {CountProcessings}
                </div>
              ) : (
                <></>
              )}
            </Link>
          )}

          <PickerSheet
            Title="Bạn muốn thực hiện ?"
            Options={[
              {
                GroupTitle: "",
                Options: [
                  {
                    Title: "Tạo khách hàng",
                    onClick: (e) => {
                      f7.views.main.router.navigate(e.Path);
                    },
                    Path: "/admin/pos/clients/add/",
                  },
                  {
                    Title: "Tạo hoá đơn",
                    component: ({ children, close, setHideForChild }) => (
                      <PickerInvoiceNew
                        onOpen={() => {
                          setHideForChild(true);
                        }}
                        onClose={() => {
                          setHideForChild(false);
                          close();
                        }}
                        onOpenParent={() => setHideForChild(false)}
                      >
                        {({ open }) => (
                          <div
                            className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                            onClick={() => {
                              open();
                            }}
                          >
                            {children}
                          </div>
                        )}
                      </PickerInvoiceNew>
                    ),
                  },
                  {
                    Title: "Tạo đặt lịch",
                    onClick: (e) => {
                      f7.views.main.router.navigate(e.Path);
                    },
                    Path: "/admin/pos/calendar/add/",
                  },
                ],
              },
              {
                GroupTitle: "",
                Options: [
                  {
                    Title: "Tạo thanh toán nợ",
                    component: ({ children, close, setHideForChild }) => (
                      <PickerAddDebt
                        onOpen={() => {
                          setHideForChild(true);
                        }}
                        onClose={() => {
                          setHideForChild(false);
                          close();
                        }}
                        onOpenParent={() => setHideForChild(false)}
                      >
                        {({ open }) => (
                          <div
                            className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                            onClick={() => {
                              open();
                            }}
                          >
                            {children}
                          </div>
                        )}
                      </PickerAddDebt>
                    ),
                  },
                  {
                    Title: "Tạo chi / Thu khác",
                    component: ({ children, close, setHideForChild }) => (
                      <PickerCashAddEdit
                        onOpen={() => {
                          setHideForChild(true);
                        }}
                        onClose={() => {
                          setHideForChild(false);
                          close();
                        }}
                        onOpenParent={() => setHideForChild(false)}
                      >
                        {({ open }) => (
                          <div
                            className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                            onClick={() => {
                              open();
                            }}
                          >
                            {children}
                          </div>
                        )}
                      </PickerCashAddEdit>
                    ),
                    hidden: !thu_chi_cash?.hasRight && !tong_hop_cash?.hasRight,
                  },
                ],
              },
              {
                GroupTitle: "",
                Options: [
                  {
                    Title: "Hoá đơn đang xử lý",
                    onClick: (e) => {
                      f7.views.main.router.navigate(e.Path);
                    },
                    Path: "/admin/pos/invoice-processings/",
                    Count:
                      InvoiceProcessings && InvoiceProcessings.length > 0
                        ? InvoiceProcessings.filter(
                            (x) => !x?.CheckIn?.CheckOutTime
                          ).length
                        : 0,
                  },
                ],
              },
            ]
              .map((g) => ({
                ...g,
                Options: g.Options.filter(
                  (o) => !o.hidden && (o.Count === undefined || o.Count > 0)
                ),
              }))
              .filter((g) => g.Options.length > 0)}
            // Close={{
            //   Title: "Đóng",
            // }}
          >
            {({ open }) => (
              <Link
                onClick={open}
                noLinkClass
                className="button-to-popover fixed z-[600] bg-primary text-white w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-fab right-4 bottom-[calc(var(--f7-toolbar-height)+16px+var(--f7-safe-area-bottom))]"
              >
                <PlusIcon className="w-7" />
              </Link>
            )}
          </PickerSheet>
        </>
      )}

      <Toolbar
        className="bg-white border-t border-[#EBEDF3]"
        bottom
        inner={false}
        outline={false}
      >
        <div className="grid grid-cols-6 bg-white">
          <Link href="/">
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1",
                pathname === "/" ? "text-app" : "text-gray-600"
              )}
            >
              <HomeIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Trang chủ</span>
            </div>
          </Link>
          <Link href="/admin/pos/calendar/">
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1",
                pathname === "/admin/pos/calendar/"
                  ? "text-app"
                  : "text-gray-600"
              )}
            >
              <CalendarDaysIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Bảng lịch</span>
            </div>
          </Link>

          <Link href="/admin/pos/clients/">
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1",
                pathname === "/admin/pos/clients/"
                  ? "text-app"
                  : "text-gray-700"
              )}
            >
              <UserGroupIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Khách hàng</span>
            </div>
          </Link>

          <Link href="/admin/pos/orders/">
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1",
                pathname === "/admin/pos/orders/" ? "text-app" : "text-gray-600"
              )}
            >
              <DocumentTextIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Hoá đơn</span>
            </div>
          </Link>

          <Link href="/admin/cash/" noLinkClass className="relative">
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1",
                pathname === "/admin/cash/" ? "text-app" : "text-gray-600"
              )}
            >
              <BanknotesIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Sổ quỹ</span>
            </div>
          </Link>

          <Link panelOpen="right">
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1 text-gray-600"
              )}
            >
              <BarsArrowUpIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Menu</span>
            </div>
          </Link>
        </div>
      </Toolbar>
    </>
  );
}

export default NavigationPos;

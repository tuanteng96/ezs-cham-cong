import { f7, Link, Popover, Toolbar, useStore } from "framework7-react";
import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  BarsArrowUpIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  HomeIcon,
  PlusIcon,
  Square3Stack3DIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import RouterHelpers from "../../helpers/RouterHelpers";
import { useIsFetching, useQueryClient } from "react-query";
import { PickerSheet } from "@/partials/components/Sheet";

function NavigationPos({ pathname }) {
  const queryClient = useQueryClient();

  let InvoiceProcessings = useStore("InvoiceProcessings");
  let Processings = useStore("Processings");
  let ClientBirthDayCount = useStore("ClientBirthDayCount");

  let [CountProcessings, setCountProcessings] = useState(0);
  let [isPopoverOpened, setIsPopoverOpened] = useState(false);

  let isLoadingProcessings = useIsFetching({ queryKey: ["Processings"] }) > 0;
  let isLoadingInvoice =
    useIsFetching({ queryKey: ["InvoiceProcessings"] }) > 0;

  useEffect(() => {
    setCountProcessings(Processings?.Count);
  }, [Processings]);

  useEffect(() => {
    if (isPopoverOpened) {
      Promise.all([
        queryClient.invalidateQueries(["ClientBirthDayCount"]),
        queryClient.invalidateQueries(["InvoiceProcessings"]),
      ]);
    }
  }, [isPopoverOpened]);

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
      {["/admin/pos/clients/", "/admin/pos/calendar/", "/admin/pos/orders/"].includes(pathname) && (
        <PickerSheet
          Title="Bạn muốn thực hiện ?"
          Options={[
            {
              Title: "Tạo đặt lịch mới",
              onClick: (e) => {
                f7.views.main.router.navigate(e.Path);
              },
              Path: "/admin/pos/calendar/add/",
            },
            {
              Title: "Tạo khách hàng mới",
              onClick: (e) => {
                f7.views.main.router.navigate(e.Path);
              },
              Path: "/admin/pos/clients/add/",
            },
          ]}
          Close={{
            Title: "Đóng",
          }}
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
                pathname === "/admin/pos/orders/"
                  ? "text-app"
                  : "text-gray-600"
              )}
            >
              <DocumentTextIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Hoá đơn</span>
            </div>
          </Link>

          <Link
            onClick={setIsPopoverOpened}
            className="relative btn-popover-processings"
          >
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1",
                [
                  "/admin/processings/",
                  "/admin/pos/invoice-processings/",
                ].includes(pathname)
                  ? "text-app"
                  : "text-gray-600"
              )}
            >
              <Square3Stack3DIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">Cần xử lý</span>
            </div>
            {isLoadingProcessings && (
              <div className="absolute top-2 right-2 font-lato font-bold text-white bg-danger text-[11px] px-1 py-[2px] w-5 h-[15px] animate-pulse leading-none rounded"></div>
            )}
            {!isLoadingProcessings && (
              <>
                {CountProcessings > 0 ? (
                  <div className="absolute top-2 right-2 font-lato font-bold text-white bg-danger text-[11px] px-1 py-[2px] leading-none rounded">
                    {CountProcessings}
                  </div>
                ) : (
                  <></>
                )}
              </>
            )}
          </Link>

          <Popover
            targetEl={".btn-popover-processings"}
            opened={isPopoverOpened}
            className="popover-processings w-[210px]"
            onPopoverClosed={() => setIsPopoverOpened(false)}
          >
            <div className="flex flex-col py-1">
              <Link
                className={clsx(
                  "relative px-4 py-3 font-medium border-b last:border-0",
                  pathname === "/admin/processings/" && "text-app"
                )}
                noLinkClass
                onClick={() => {
                  setIsPopoverOpened(false);
                  f7.views.main.router.navigate("/admin/processings/");
                }}
              >
                Cần xử lý
                {isLoadingProcessings ? (
                  <span className="w-5 animate-pulse absolute text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4 font-lato"></span>
                ) : (
                  <>
                    {CountProcessings > 0 ? (
                      <span className="absolute text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4 font-lato">
                        {CountProcessings}
                      </span>
                    ) : (
                      <></>
                    )}
                  </>
                )}
              </Link>
              <Link
                className={clsx(
                  "relative px-4 py-3 font-medium border-b last:border-0",
                  pathname === "/admin/pos/invoice-processings/" && "text-app"
                )}
                noLinkClass
                onClick={() => {
                  setIsPopoverOpened(false);
                  f7.views.main.router.navigate(
                    "/admin/pos/invoice-processings/"
                  );
                }}
              >
                Hoá đơn đang xử lý
                {isLoadingInvoice ? (
                  <span className="w-5 animate-pulse absolute text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4 font-lato"></span>
                ) : (
                  <>
                    {InvoiceProcessings && InvoiceProcessings.length > 0 ? (
                      <span className="absolute text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4 font-lato">
                        {InvoiceProcessings &&
                          InvoiceProcessings.filter(
                            (x) => !x?.CheckIn?.CheckOutTime
                          ).length}
                      </span>
                    ) : (
                      <></>
                    )}
                  </>
                )}
              </Link>
              <Link
                className={clsx(
                  "relative px-4 py-3 font-medium border-b last:border-0",
                  pathname === "/admin/pos/clients/birthday/" && "text-app"
                )}
                noLinkClass
                onClick={() => {
                  setIsPopoverOpened(false);
                  f7.views.main.router.navigate("/admin/pos/clients/birthday/");
                }}
              >
                Khách sinh nhật
                {ClientBirthDayCount?.day > 0 && (
                  <span className="absolute text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4 font-lato">
                    {ClientBirthDayCount?.day}
                  </span>
                )}
              </Link>
            </div>
          </Popover>

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

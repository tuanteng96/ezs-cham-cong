import { Link, Popover, Toolbar, useStore } from "framework7-react";
import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  BarsArrowUpIcon,
  CalendarDaysIcon,
  PlusIcon,
  Square3Stack3DIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import RouterHelpers from "../../helpers/RouterHelpers";
import { useIsFetching, useQueryClient } from "react-query";
import moment from "moment";
import Dom7 from "dom7";

function NavigationPos({ pathname }) {

  const queryClient = useQueryClient();

  let InvoiceProcessings = useStore("InvoiceProcessings");
  let Processings = useStore("Processings");
  let ClientBirthDay = useStore("ClientBirthDay");

  let [CountProcessings, setCountProcessings] = useState(0);

  let isLoadingProcessings = useIsFetching({ queryKey: ["Processings"] }) > 0;
  let isLoadingInvoice =
    useIsFetching({ queryKey: ["InvoiceProcessings"] }) > 0;

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
    <Toolbar
      className="bg-white border-t border-[#EBEDF3]"
      bottom
      inner={false}
      outline={false}
    >
      <div className="grid grid-cols-5">
        <Link href="/admin/pos/calendar/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/admin/pos/calendar/" ? "text-app" : "text-gray-700"
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
              pathname === "/admin/pos/clients/" ? "text-app" : "text-gray-700"
            )}
          >
            <UserGroupIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Khách hàng</span>
          </div>
        </Link>
        <Popover className="popover-menu">
          <div className="flex flex-col py-1 text-center">
            <Link
              href="/admin/pos/calendar/add/"
              popoverClose
              className="py-3 font-medium border-b last:border-0"
              noLinkClass
            >
              Tạo đặt lịch mới
            </Link>
            <Link
              href="/admin/pos/clients/add/"
              className="py-3 font-medium border-b last:border-0"
              popoverClose
              noLinkClass
            >
              Tạo khách hàng mới
            </Link>
          </div>
        </Popover>
        <Link
          popoverOpen=".popover-menu"
          noLinkClass
          className="relative flex items-center justify-center"
        >
          <div className="w-10 h-10">
            <div
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full rounded-full shadow-3xl transition bg-success"
              )}
            >
              <PlusIcon className="text-white w-7" />
            </div>
          </div>
        </Link>
        <Link className="relative" popoverOpen=".popover-processings">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              [
                "/admin/processings/",
                "/admin/pos/invoice-processings/",
              ].includes(pathname)
                ? "text-app"
                : "text-gray-700"
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
          className="popover-processings w-[210px]"
          onPopoverClose={(e) => {
            // if (Dom7(e.el).hasClass("modal-out")) {
            //   Dom7(e.el).remove();
            // }
          }}
          onPopoverOpen={() => {
            queryClient.invalidateQueries(["InvoiceProcessings"]);
          }}
        >
          <div className="flex flex-col py-1">
            <Link
              href="/admin/processings/"
              popoverClose
              className={clsx(
                "relative px-4 py-3 font-medium border-b last:border-0",
                pathname === "/admin/processings/" && "text-app"
              )}
              noLinkClass
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
              href="/admin/pos/invoice-processings/"
              className={clsx(
                "relative px-4 py-3 font-medium border-b last:border-0",
                pathname === "/admin/pos/invoice-processings/" && "text-app"
              )}
              popoverClose
              noLinkClass
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
              href="/admin/pos/clients/birthday/"
              popoverClose
              className={clsx(
                "relative px-4 py-3 font-medium border-b last:border-0",
                pathname === "/admin/pos/clients/birthday/" && "text-app"
              )}
              noLinkClass
            >
              Khách sinh nhật
              {ClientBirthDay &&
                ClientBirthDay.filter(
                  (x) =>
                    moment(x.Birth).format("DD-MM") === moment().format("DD-MM")
                ).length > 0 && (
                  <span className="absolute text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4 font-lato">
                    {
                      ClientBirthDay.filter(
                        (x) =>
                          moment(x.Birth).format("DD-MM") ===
                          moment().format("DD-MM")
                      ).length
                    }
                  </span>
                )}
            </Link>
          </div>
        </Popover>

        <Link panelOpen="right">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1 text-gray-700"
            )}
          >
            <BarsArrowUpIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Menu</span>
          </div>
        </Link>
      </div>
    </Toolbar>
  );
}

export default NavigationPos;

import { BellAlertIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef } from "react";
import { Link, f7, useStore, Popover } from "framework7-react";
import store from "../../../js/store";
import { useIsFetching } from "react-query";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function TopBars(props) {
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");
  let Auth = useStore("Auth");
  let Stocks = useStore("Stocks");
  let Notifications = useStore("Notifications");
  let Processings = useStore("Processings");

  const { pos_mng } = RolesHelpers.useRoles({
    nameRoles: ["pos_mng"],
    auth: Auth,
    CrStocks,
  });

  const isFetchingProcess = useIsFetching(["Processings"]);
  const isFetchingNoti = useIsFetching(["Notifications"]);
  const isFetching = isFetchingProcess === 1 || isFetchingNoti === 1;

  const actionsToPopover = useRef(null);
  const buttonToPopoverWrapper = useRef(null);

  useEffect(() => {
    return () => {
      if (actionsToPopover.current) {
        actionsToPopover.current.destroy();
      }
    };
  }, []);

  const openChooseStocks = () => {
    let newButtons = Stocks
      ? Stocks.map((x) => ({
          text: x.Title,
          close: false,
          disabled: CrStocks?.ID === x.ID,
          onClick: (actions, e) => {
            store.dispatch("setCrStocks", x).then(() => actions.close());
          },
        }))
      : [];
    if (newButtons && newButtons.length > 4) {
      f7.views.main.router.navigate(`/stocks/`);
    } else {
      actionsToPopover.current = f7.actions.create({
        buttons: [
          ...newButtons,
          {
            text: "Đóng",
            color: "red",
          },
        ],
        targetEl:
          buttonToPopoverWrapper.current.querySelector(".button-to-popover"),
      });

      if (newButtons && newButtons.length > 0) {
        actionsToPopover.current.open();
      }
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center" ref={buttonToPopoverWrapper}>
        <div className="text-white" onClick={openChooseStocks}>
          <div className="text-base font-bold capitalize">{Brand?.Name}</div>
          <div className="flex items-center text-xs opacity-85">
            <span className="flex items-end pt-px font-medium">
              {CrStocks?.Title}
              {Stocks?.length > 0 && <ChevronDownIcon className="w-3.5 ml-1" />}
            </span>
          </div>
        </div>
      </div>
      <div className="flex">
        {Brand?.Global?.PosApp && (
          <>
            {pos_mng?.hasRight && (
              <>
                <Link
                  popoverOpen=".popover-notifications"
                  className="relative flex items-center justify-center bg-white rounded-xl w-11 h-11"
                >
                  <BellAlertIcon className="w-6 text-app" />
                  {!isFetching && (
                    <>
                      {(Notifications && Notifications.length > 0) ||
                      (Processings?.Count && Processings?.Count > 0) ? (
                        <span className="font-lato absolute text-white bg-danger text-[11px] px-1 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-1.5 right-1.5">
                          {Notifications.length + (Processings?.Count || 0)}
                        </span>
                      ) : (
                        <></>
                      )}
                    </>
                  )}
                </Link>
                <Popover className="popover-notifications w-[170px]">
                  <div className="flex flex-col">
                    <Link
                      className="relative px-4 py-3 font-medium border-b last:border-0"
                      noLinkClass
                      href="/notifications/"
                      popoverClose
                    >
                      <span>Thông báo</span>
                      {Notifications && Notifications.length > 0 ? (
                        <span className="absolute text-white bg-danger font-lato text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4">
                          {Notifications.length}
                        </span>
                      ) : (
                        <></>
                      )}
                    </Link>
                    <Link
                      className="relative px-4 py-3 font-medium border-b last:border-0"
                      noLinkClass
                      href="/admin/processings/"
                      popoverClose
                    >
                      <span>Cần xử lý</span>
                      {Processings?.Count && Processings?.Count > 0 ? (
                        <span className="absolute text-white bg-danger font-lato text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center top-2/4 right-4 -translate-y-2/4">
                          {Processings?.Count}
                        </span>
                      ) : (
                        <></>
                      )}
                    </Link>
                  </div>
                </Popover>
              </>
            )}

            {!pos_mng?.hasRight && (
              <Link
                href="/notifications/"
                className="relative flex items-center justify-center bg-white rounded-xl w-11 h-11"
              >
                <BellAlertIcon className="w-6 text-app" />
                {Notifications && Notifications.length > 0 && (
                  <div className="absolute text-white bg-danger text-[10px] px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center top-1.5 right-1.5">
                    {Notifications.length}
                  </div>
                )}
              </Link>
            )}
          </>
        )}
        {!Brand?.Global?.PosApp && (
          <Link
            href="/notifications/"
            className="relative flex items-center justify-center bg-white rounded-xl w-11 h-11"
          >
            <BellAlertIcon className="w-6 text-app" />
            {Notifications && Notifications.length > 0 && (
              <div className="absolute text-white bg-danger text-[10px] px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center top-1.5 right-1.5">
                {Notifications.length}
              </div>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}

export default TopBars;

import { BellAlertIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef } from "react";
import { Link, f7, useStore } from "framework7-react";
import store from "../../../js/store";

function TopBars(props) {
  let Brand = useStore("Brand");
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Stocks = useStore("Stocks");
  let Notifications = useStore("Notifications");

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
  };

  const getFirstText = (text) => {
    if (!text) return;
    return text.split(" ").reverse()[0].charAt(0);
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
        <Link href="/notifications/" className="relative flex items-center justify-center bg-white rounded-xl w-11 h-11">
          <BellAlertIcon className="w-6 text-app" />
          {Notifications && Notifications.length > 0 && (
            <div className="absolute text-white bg-danger text-[10px] px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center top-1.5 right-1.5">
              {Notifications.length}
            </div>
          )}
        </Link>
        {/* <Link
          href="/account/"
          className="flex items-center justify-center overflow-hidden rounded-xl w-11 h-11 bg-[#e09a25] text-white font-bold text-lg uppercase"
        >
          {getFirstText(Auth?.FullName)}
        </Link> */}
      </div>
    </div>
  );
}

export default TopBars;

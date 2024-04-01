import React from "react";
import PromHelpers from "../../helpers/PromHelpers";
import {
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import { CheckBadgeIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import store from "../../js/store";
import { toast } from "react-toastify";

function StocksPage({ f7router }) {
  let Stocks = useStore("Stocks");
  let CrStocks = useStore("CrStocks");

  const onChangeStock = (x) => {
    store.dispatch("setCrStocks", x).then(() => {
      f7router.navigate("/");
      toast.success("Thay đổi cơ sở thành công.")
    });
  };

  return (
    <Page
      className="bg-white"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Danh sách cơ sở</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div>
        {Stocks &&
          Stocks.map((stock, index) => (
            <div
              className={clsx(
                "p-4 border-b last:border-0 text-[15px] font-medium relative",
                CrStocks?.ID === stock.ID && "text-app"
              )}
              key={index}
              onClick={() => onChangeStock(stock)}
            >
              <div className="pr-12">{stock.Title}</div>
              {CrStocks?.ID === stock.ID && (
                <div className="absolute top-0 right-0 flex items-center justify-center w-12 h-full">
                  <CheckBadgeIcon className="w-7" />
                </div>
              )}
            </div>
          ))}
      </div>
    </Page>
  );
}

export default StocksPage;

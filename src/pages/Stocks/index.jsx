import React, { useEffect, useState } from "react";
import PromHelpers from "../../helpers/PromHelpers";
import {
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Subnavbar,
  useStore,
} from "framework7-react";
import {
  CheckBadgeIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import store from "../../js/store";
import { toast } from "react-toastify";
import NoFound from "@/components/NoFound";

function StocksPage({ f7router, f7route }) {
  let Stocks = useStore("Stocks");
  let CrStocks = useStore("CrStocks");

  const [ListStocks, setListStocks] = useState(Stocks);
  const [Key, setKey] = useState("");

  useEffect(() => {
    if (!Key) {
      setListStocks(Stocks);
    } else {
      setListStocks(
        Stocks.filter((x) => x.Title.toUpperCase().includes(Key.toUpperCase()))
      );
    }
  }, [Key]);

  const onChangeStock = (x) => {
    store.dispatch("setCrStocks", x).then(() => {
      //f7router.navigate("/");
      f7router.back();
      toast.success("Thay đổi cơ sở thành công.");
    });
  };

  return (
    <Page
      name="stocks-page"
      className="bg-white"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      noToolbar
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
        <Subnavbar className="[&>div]:px-0 shadow-lg">
          <div className="flex w-full">
            <div className="relative flex-1">
              <Input
                className="[&_input]:border-0 [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14 [&_input]:pr-10 [&_input]:shadow-none"
                type="text"
                placeholder="Tên cơ sở bạn cần ?"
                value={Key}
                clearButton={true}
                onInput={(e) => setKey(e.target.value)}
              />
              <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
                <MagnifyingGlassIcon className="w-6 text-[#cccccc]" />
              </div>
            </div>
          </div>
        </Subnavbar>
      </Navbar>
      <div>
        {ListStocks &&
          ListStocks.map((stock, index) => (
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
        {(!ListStocks || ListStocks.length === 0) && (
          <NoFound
            Title="Không có kết quả nào."
            Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
          />
        )}
      </div>
    </Page>
  );
}

export default StocksPage;

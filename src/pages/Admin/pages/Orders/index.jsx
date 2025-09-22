import {
  Input,
  Link,
  NavTitle,
  Navbar,
  Page,
  Popover,
  Subnavbar,
  f7,
  useStore,
} from "framework7-react";
import React, { useRef, useState } from "react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import { useInfiniteQuery, useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import NoFound from "@/components/NoFound";
import clsx from "clsx";
import StringHelpers from "@/helpers/StringHelpers";
import InfiniteScroll from "react-infinite-scroll-component";
import moment from "moment";
import { useDebounce } from "@/hooks";

function OrdersAdmin({ f7router }) {
  let elRef = useRef();

  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const [filters, setFilters] = useState({
    Key: "",
    pi: 1,
    ps: 20,
    Type: "Hôm nay",
  });

  const debouncedKey = useDebounce(filters, 500);

  let getFromTo = () => {
    let From = "";
    let To = "";

    if (filters.Type === "Hôm nay") {
      From = moment().format("DD-MM-YYYY");
      To = moment().format("DD-MM-YYYY");
    }

    if (filters.Type === "Hôm qua") {
      From = moment().subtract(1, "days").format("DD-MM-YYYY");
      To = moment().subtract(1, "days").format("DD-MM-YYYY");
    }

    if (filters.Type === "7 ngày trước") {
      From = moment().subtract(7, "days").format("DD-MM-YYYY");
      To = moment().format("DD-MM-YYYY");
    }
    return { From, To };
  };

  let { data, isLoading } = useQuery({
    queryKey: ["OrdersSum", debouncedKey],
    queryFn: async () => {
      let isAdmin = false;
      if (Auth?.ID === 1 || Auth?.Info?.Groups?.some((x) => x.ID === 1))
        isAdmin = true;

      let { From, To } = getFromTo();

      const { data: dataSum } = await AdminAPI.listOrdersSum({
        ...filters,
        pi: 1,
        ps: 12,
        Token: Auth.token,
        StockID: !Brand?.Global?.Admin?.cho_phep_tim_khac_diem
          ? !isAdmin
            ? CrStocks?.ID
            : ""
          : CrStocks?.ID,
        From,
        To,
      });
      return dataSum && dataSum.length > 0 ? dataSum[0] : null;
    },
    enabled: Boolean(
      Brand?.Global?.EZSIDVersion &&
        debouncedKey.Key === "" &&
        debouncedKey.Type !== "Toàn thời gian"
    ),
  });

  const OrdersQuery = useInfiniteQuery({
    queryKey: ["OrdersList", debouncedKey],
    queryFn: async ({ pageParam = 1 }) => {
      let isAdmin = false;
      if (Auth?.ID === 1 || Auth?.Info?.Groups?.some((x) => x.ID === 1))
        isAdmin = true;

      let { From, To } = getFromTo();

      const { data } = await AdminAPI.listOrders({
        ...filters,
        pi: pageParam,
        ps: 12,
        Token: Auth.token,
        StockID: !Brand?.Global?.Admin?.cho_phep_tim_khac_diem
          ? !isAdmin
            ? CrStocks?.ID
            : ""
          : CrStocks?.ID,
        From,
        To,
      });

      return {
        ...data,
      };
    },
    onSuccess: () => {
      f7.dialog.close();
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
    keepPreviousData: true,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(OrdersQuery?.data?.pages, "data");

  const renderMetaJSON = (MetaJSON) => {
    if (!MetaJSON) return <></>;
    let parseMetaJSON = JSON.parse(MetaJSON);
    if (parseMetaJSON && parseMetaJSON?.oi?.length > 0) {
      return (
        <div className="truncate">
          {parseMetaJSON?.oi?.map((x) => x.name).join(", ")}
        </div>
      );
    }
    return <></>;
  };

  return (
    <Page
      className="bg-[var(--f7-page-bg-color)]"
      name="OrderAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavTitle>Hoá đơn</NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>

        <Subnavbar className="[&>div]:px-0 border-b">
          <div className="relative flex w-full">
            <div className="relative flex-1">
              <Input
                className="[&_input]:shadow-none [&_input]:border-0 [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14"
                type="text"
                placeholder="Tìm đơn hàng ..."
                value={filters.Key}
                clearButton={true}
                onInput={(e) => {
                  setFilters((prevState) => ({
                    ...prevState,
                    Key: e.target.value,
                    Type: e.target.value ? "Toàn thời gian" : "Hôm nay",
                  }));
                }}
              />
              <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
                <MagnifyingGlassIcon className="w-6 text-gray-500" />
              </div>
            </div>
            <div className="flex items-center justify-end pr-4">
              <Link
                popoverOpen=".popover-orders"
                noLinkClass
                className="flex h-[30px] w-full items-center justify-center text-sm bg-gray-200 rounded-[20px] px-3 !text-gray-900"
              >
                <span>{filters.Type}</span>
                <ChevronDownIcon className="w-4 ml-1" />
              </Link>
            </div>
            <Popover className="popover-orders w-[160px]">
              <div className="flex flex-col py-1">
                {[
                  {
                    Title: "Hôm nay",
                  },
                  {
                    Title: "Hôm qua",
                  },
                  {
                    Title: "7 ngày trước",
                  },
                  {
                    Title: "Toàn thời gian",
                  },
                ].map((item, index) => (
                  <Link
                    popoverClose
                    key={index}
                    className={clsx(
                      "relative px-4 py-3 font-medium border-b last:border-0",
                      item.Title === filters.Type && "text-app"
                    )}
                    noLinkClass
                    onClick={() => {
                      f7.dialog.preloader("Đang thực hiện ...");
                      setFilters((prevState) => ({
                        ...prevState,
                        Type: item.Title,
                        Key: "",
                      }));
                    }}
                  >
                    {item.Title}
                  </Link>
                ))}
              </div>
            </Popover>
          </div>
        </Subnavbar>
      </Navbar>

      <div
        className={clsx(
          "flex flex-col h-full overflow-hidden relative transition-[padding] duration-300 ease-in-out",
          Brand?.Global?.EZSIDVersion
            ? !(
                debouncedKey.Key === "" &&
                debouncedKey.Type !== "Toàn thời gian"
              )
              ? "pt-0"
              : "pt-[67px]"
            : ""
        )}
      >
        {Brand?.Global?.EZSIDVersion ? (
          <div
            className={clsx(
              "px-4 py-2.5 bg-white rounded-b-xl min-h-[67px] h-[67px] absolute top-0 left-0 w-full transition",
              !(
                debouncedKey.Key === "" &&
                debouncedKey.Type !== "Toàn thời gian"
              )
                ? "-translate-y-full"
                : "translate-y-0"
            )}
          >
            <div className="flex items-end justify-between mb-px">
              <div className="text-base font-semibold">Tổng</div>
              <div className="text-lg font-semibold leading-6 font-lato">
                {isLoading && (
                  <div className="animate-pulse h-4 bg-gray-200 rounded-full w-[80px] mb-1.5"></div>
                )}
                {!isLoading && <>{StringHelpers.formatVND(data?.ToPay)}</>}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                {OrdersQuery?.data?.pages &&
                OrdersQuery?.data?.pages[0].total > 0 ? (
                  <span className="pr-1.5 font-lato">
                    {OrdersQuery?.data?.pages[0].total}
                  </span>
                ) : (
                  <span className="pr-1.5 font-lato">0</span>
                )}
                Hoá đơn
              </div>
              {isLoading && (
                <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-[100px] mb-1"></div>
              )}
              {!isLoading && (
                <>
                  {data?.TotalDebt > 0 ? (
                    <div>
                      Còn nợ
                      <span className="pl-1.5 font-lato font-semibold text-danger">
                        {StringHelpers.formatVND(data?.TotalDebt)}
                      </span>
                    </div>
                  ) : (
                    <></>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <></>
        )}

        <div
          id="scrollableDivOrders"
          className="overflow-auto grow"
          ref={elRef}
        >
          <InfiniteScroll
            dataLength={Lists.length}
            next={OrdersQuery.fetchNextPage}
            hasMore={OrdersQuery.hasNextPage}
            loader={
              OrdersQuery.isLoading ? null : (
                <>
                  {Lists && Lists.length > 0 && (
                    <div className="flex justify-center ezs-ptr">
                      <div className="lds-ellipsis">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    </div>
                  )}
                </>
              )
            }
            scrollableTarget="scrollableDivOrders"
            refreshFunction={OrdersQuery.refetch}
            pullDownToRefresh
            pullDownToRefreshThreshold={50}
            pullDownToRefreshContent={
              <div className="flex justify-center ezs-ptr">
                <div className="lds-ellipsis">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            }
            releaseToRefreshContent={
              <div className="flex justify-center ezs-ptr">
                <div className="lds-ellipsis">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            }
          >
            <div className="p-4">
              {OrdersQuery.isLoading && (
                <>
                  {Array(4)
                    .fill()
                    .map((_, index) => (
                      <div
                        className="flex flex-col p-4 mb-3.5 bg-white rounded-lg last:mb-0"
                        key={index}
                      >
                        <div className="flex justify-between mb-3">
                          <div className="animate-pulse h-3.5 bg-gray-200 rounded-full w-7/12"></div>
                          <div className="animate-pulse h-3.5 bg-gray-200 rounded-full w-[80px]"></div>
                        </div>
                        <div>
                          <div className="flex mb-1.5 font-medium">
                            <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-10/12"></div>
                          </div>
                          <div className="flex items-center font-light text-gray-500 text-[14px] mb-1.5">
                            <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                          </div>
                          <div>
                            <div className="h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
              {!OrdersQuery.isLoading && (
                <>
                  {Lists && Lists.length > 0 && (
                    <>
                      {Lists.map((item, index) => (
                        <Link
                          noLinkClass
                          className="flex flex-col p-4 mb-3.5 bg-white rounded-lg last:mb-0"
                          href={`/admin/pos/orders/view/${item.ID}`}
                          key={index}
                        >
                          <div className="flex justify-between mb-1">
                            <div className="font-semibold">
                              {item?.Member?.FullName}
                            </div>
                            <div className="items-end font-semibold">
                              {StringHelpers.formatVND(
                                item?.thanhtoan?.tong_gia_tri_dh
                              )}
                            </div>
                          </div>
                          <div className="text-gray-500">
                            <div>#{item?.ID}</div>
                            {renderMetaJSON(item?.MetaJSON)}
                          </div>
                          <div className="flex justify-between pt-3 mt-3 border-t">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-500 font-lato">
                                {moment(item?.CreateDate).format(
                                  "HH:mm DD-MM-YYYY"
                                )}
                              </div>

                              {StringHelpers.getClassOrder(item).Value ===
                              "Trả hàng" ? (
                                <>
                                  <div className="w-[5px] h-[5px] bg-gray-300 rounded-full"></div>
                                  <div
                                    className={
                                      StringHelpers.getClassOrder(item).Color
                                    }
                                  >
                                    {StringHelpers.getClassOrder(item).Value}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {item?.thanhtoan?.tong_gia_tri_dh -
                                    item?.thanhtoan?.thanh_toan_tien -
                                    item?.thanhtoan?.thanh_toan_vi -
                                    item?.thanhtoan?.thanh_toan_ao >
                                  0 ? (
                                    <div className="text-gray-500">
                                      Nợ
                                      <span className="pl-1 font-medium font-lato text-danger">
                                        {StringHelpers.formatVND(
                                          item?.thanhtoan?.tong_gia_tri_dh -
                                            item?.thanhtoan?.thanh_toan_tien -
                                            item?.thanhtoan?.thanh_toan_vi -
                                            item?.thanhtoan?.thanh_toan_ao
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <></>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="text-primary">
                              <ArrowRightIcon className="w-5" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                  {(!Lists || Lists.length === 0) && (
                    <NoFound
                      Title="Không có kết quả nào."
                      Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                    />
                  )}
                </>
              )}
            </div>
          </InfiniteScroll>
        </div>
      </div>
    </Page>
  );
}

export default OrdersAdmin;

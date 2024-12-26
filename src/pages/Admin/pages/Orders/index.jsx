import {
  Input,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Subnavbar,
  useStore,
} from "framework7-react";
import React, { useRef, useState } from "react";
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import { useInfiniteQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import NoFound from "@/components/NoFound";
import clsx from "clsx";
import StringHelpers from "@/helpers/StringHelpers";

function OrdersAdmin({ f7router }) {
  const allowInfinite = useRef(true);
  let Auth = useStore("Auth");
  let InvoiceProcessings = useStore("InvoiceProcessings");
  const [filters, setFilters] = useState({
    Key: "",
    pi: 1,
    ps: 20,
  });

  const OrdersQuery = useInfiniteQuery({
    queryKey: ["OrdersList", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await AdminAPI.listOrders({
        ...filters,
        pi: pageParam,
        ps: 12,
        Token: Auth.token,
      });

      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
    keepPreviousData: true,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(OrdersQuery?.data?.pages, "data");

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    OrdersQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      className="bg-white"
      name="OrderAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => OrdersQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={OrdersQuery.isFetchingNextPage}
      onInfinite={loadMore}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            href="/admin/pos/invoice-processings/"
          >
            <UsersIcon className="w-6" />
            {InvoiceProcessings && InvoiceProcessings.length > 0 && (
              <div className="absolute top-2 right-1 text-white bg-danger text-[11px] px-1 py-[2px] leading-none rounded">
                {InvoiceProcessings.length}
              </div>
            )}
          </Link>
        </NavLeft>
        <NavTitle>
          Đơn hàng
          {OrdersQuery?.data?.pages &&
            OrdersQuery?.data?.pages[0].total > 0 && (
              <span className="pl-1">
                ({OrdersQuery?.data?.pages[0].total})
              </span>
            )}
        </NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <PlusIcon className="w-6" />
          </Link>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>

        <Subnavbar className="[&>div]:px-0 shadow-lg">
          <div className="relative w-full">
            <Input
              className="[&_input]:border-0 [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14"
              type="text"
              placeholder="Tìm kiếm đơn hàng ..."
              value={filters.Key}
              clearButton={true}
              onInput={(e) => {
                setFilters((prevState) => ({
                  ...prevState,
                  Key: e.target.value,
                }));
              }}
            />
            <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
              <MagnifyingGlassIcon className="w-6 text-gray-500" />
            </div>
          </div>
        </Subnavbar>
      </Navbar>

      <div>
        {OrdersQuery.isLoading && (
          <>
            {Array(4)
              .fill()
              .map((_, index) => (
                <div
                  className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
                  key={index}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex mb-1 font-medium">
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-10/12 mb-1"></div>
                    </div>
                    <div className="flex items-center font-light text-gray-500 text-[14px] mb-1">
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                    </div>
                    <div>
                      <div className="h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                    </div>
                  </div>
                  <div className="flex justify-end w-10 gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg animate-pulse bg-primary-light text-primary"></div>
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
                  <div
                    className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
                    key={index}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex mb-px font-medium">
                        <div className="max-w-[140px] truncate">
                          {item?.Member?.FullName}
                        </div>
                        <div className="px-1">-</div>
                        <div>{item?.Member?.MobilePhone}</div>
                      </div>
                      <div className="flex items-center font-light text-gray-500 text-[14px]">
                        <span>
                          ID <b className="font-medium">#{item.ID}</b>
                        </span>
                        <span className="px-1">-</span>
                        <span
                          className={clsx(
                            "font-medium",
                            StringHelpers.getClassOrder(item).Color
                          )}
                        >
                          {StringHelpers.getClassOrder(item).Value}
                        </span>
                      </div>
                      <div>
                        {StringHelpers.formatVND(
                          item?.thanhtoan?.tong_gia_tri_dh
                        )}
                        {item?.thanhtoan?.tong_gia_tri_dh -
                          item?.thanhtoan?.thanh_toan_tien -
                          item?.thanhtoan?.thanh_toan_vi -
                          item?.thanhtoan?.thanh_toan_ao >
                          0 && (
                          <span>
                            <span className="px-1">-</span>
                            <span className="pr-1 text-danger">Nợ</span>
                            <span className="font-medium text-danger">
                              {StringHelpers.formatVND(
                                item?.thanhtoan?.tong_gia_tri_dh -
                                  item?.thanhtoan?.thanh_toan_tien -
                                  item?.thanhtoan?.thanh_toan_vi -
                                  item?.thanhtoan?.thanh_toan_ao
                              )}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end w-10 gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary">
                        <ArrowRightIcon className="w-5" />
                      </div>
                    </div>
                  </div>
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
    </Page>
  );
}

export default OrdersAdmin;

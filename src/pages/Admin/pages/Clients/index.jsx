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
  ShoppingCartIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import { useInfiniteQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import NoFound from "@/components/NoFound";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import clsx from "clsx";
import StringHelpers from "@/helpers/StringHelpers";
import moment from "moment";

function ClientsAdmin({ f7router }) {
  const allowInfinite = useRef(true);
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  let InvoiceProcessings = useStore("InvoiceProcessings");
  const [filters, setFilters] = useState({
    Key: "",
    pi: 1,
    ps: 12,
  });
  const [isClients, setIsClients] = useState(true);

  const ClientsQuery = useInfiniteQuery({
    queryKey: ["ClientsList", filters],
    queryFn: async ({ pageParam = 1 }) => {
      let isAdmin = false;
      if (Auth?.ID === 1 || Auth?.Info?.Groups?.some((x) => x.ID === 1))
        isAdmin = true;
      const { data } = await AdminAPI.listClients({
        ...filters,
        pi: pageParam,
        ps: 20,
        Token: Auth.token,
        StockID:
          !Brand?.Global?.Admin?.cho_phep_tim_khac_diem && !isAdmin
            ? CrStocks?.ID
            : "",
      });

      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
    keepPreviousData: true,
    enabled: isClients,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    ClientsQuery?.data?.pages,
    "data"
  );

  const OrdersQuery = useInfiniteQuery({
    queryKey: ["OrdersList", filters],
    queryFn: async ({ pageParam = 1 }) => {
      let isAdmin = false;
      if (Auth?.ID === 1 || Auth?.Info?.Groups?.some((x) => x.ID === 1))
        isAdmin = true;

      const { data } = await AdminAPI.listOrders({
        ...filters,
        pi: pageParam,
        ps: 12,
        Token: Auth.token,
        StockID:
          !Brand?.Global?.Admin?.cho_phep_tim_khac_diem && !isAdmin
            ? CrStocks?.ID
            : "",
      });

      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
    keepPreviousData: true,
    enabled: !isClients,
  });

  const ListsOrder = ArrayHelpers.useInfiniteQuery(
    OrdersQuery?.data?.pages,
    "data"
  );

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;
    if (isClients) {
      ClientsQuery.fetchNextPage().then(() => {
        allowInfinite.current = true;
      });
    } else {
      OrdersQuery.fetchNextPage().then(() => {
        allowInfinite.current = true;
      });
    }
  };

  return (
    <Page
      className="bg-white"
      name="ClientAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) =>
        isClients
          ? ClientsQuery.refetch().then(() => done())
          : OrdersQuery.refetch().then(() => done())
      }
      infinite
      infiniteDistance={50}
      infinitePreloader={
        isClients
          ? ClientsQuery.isFetchingNextPage
          : OrdersQuery.isFetchingNextPage
      }
      onInfinite={loadMore}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        {/* <NavLeft className="h-full">
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
        </NavLeft> */}
        <NavTitle>
          {isClients && (
            <>
              Khách hàng
              {ClientsQuery?.data?.pages &&
                ClientsQuery?.data?.pages[0].total > 0 && (
                  <span className="pl-1">
                    ({ClientsQuery?.data?.pages[0].total})
                  </span>
                )}
            </>
          )}
          {!isClients && (
            <>
              Đơn hàng
              {OrdersQuery?.data?.pages &&
                OrdersQuery?.data?.pages[0].total > 0 && (
                  <span className="pl-1">
                    ({OrdersQuery?.data?.pages[0].total})
                  </span>
                )}
            </>
          )}
        </NavTitle>
        {isClients && (
          <NavRight className="h-full">
            <Link
              noLinkClass
              className="!text-white h-full flex item-center justify-center w-12"
              href="/admin/pos/clients/add/"
            >
              <PlusIcon className="w-6" />
            </Link>
          </NavRight>
        )}

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>

        <Subnavbar className="[&>div]:px-0 shadow-lg">
          <div className="flex w-full">
            <div className="relative flex-1">
              <Input
                className="[&_input]:border-0 [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14 [&_input]:pr-10 [&_input]:shadow-none"
                type="text"
                placeholder={
                  isClients
                    ? "Tìm theo tên, số điện thoại ..."
                    : "Tìm kiếm đơn hàng ..."
                }
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
                <MagnifyingGlassIcon className="w-6 text-[#cccccc]" />
              </div>
            </div>
            <div
              className="relative flex items-center justify-center w-14"
              onClick={() => {
                setIsClients(!isClients);
                setFilters((prevState) => ({
                  ...prevState,
                  Key: "",
                  pi: 1,
                }));
              }}
            >
              <div className="absolute w-[1px] h-2/4 bg-[#cccccc] left-0"></div>
              {isClients && <ShoppingCartIcon className="w-6 text-primary" />}
              {!isClients && <UserGroupIcon className="w-6 text-primary" />}
            </div>
          </div>
        </Subnavbar>
      </Navbar>
      {isClients && (
        <div>
          {ClientsQuery.isLoading && (
            <>
              {Array(4)
                .fill()
                .map((_, index) => (
                  <div
                    className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
                    key={index}
                  >
                    <div className="w-11">
                      <div className="w-11 h-11 bg-gray-100 text-[#bababe] rounded-full flex items-center justify-center animate-pulse"></div>
                    </div>
                    <div className="flex-1 pl-4 pr-4">
                      <div className="flex mb-1 font-medium">
                        <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-10/12 mb-1"></div>
                      </div>
                      <div className="flex items-center font-light text-gray-500 text-[14px] mb-1">
                        <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                      </div>
                    </div>
                    <div className="flex justify-end w-10 gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg animate-pulse bg-primary-light text-primary"></div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!ClientsQuery.isLoading && (
            <>
              {Lists && Lists.length > 0 && (
                <>
                  {Lists.map((item, index) => (
                    <Link
                      noLinkClass
                      href={`/admin/pos/manage/${
                        item.ID
                      }/?state=${JSON.stringify({
                        MobilePhone: item.MobilePhone,
                        FullName: item.FullName,
                      })}`}
                      className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
                      key={index}
                    >
                      <div className="w-11">
                        <img
                          className="object-cover w-full rounded-full aspect-square"
                          src={
                            !item?.Photo
                              ? AssetsHelpers.toAbsoluteUrlCore(
                                  "/AppCore/images/blank.png",
                                  ""
                                )
                              : AssetsHelpers.toAbsoluteUrl(item?.Photo)
                          }
                          onError={(e) =>
                            (e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                              "/AppCore/images/blank.png",
                              ""
                            ))
                          }
                        />
                      </div>
                      <div className="flex-1 pl-4 pr-4">
                        <div className="flex mb-px font-medium">
                          <div
                            className={clsx(
                              "max-w-[180px] truncate",
                              item.GroupJSON &&
                                item.GroupJSON.length > 0 &&
                                item.GroupJSON[0].Color
                                ? ""
                                : "!text-black"
                            )}
                            style={{
                              color:
                                item.GroupJSON &&
                                item.GroupJSON.length > 0 &&
                                item.GroupJSON[0].Color,
                            }}
                          >
                            {item.FullName}
                          </div>
                        </div>
                        <div className="flex items-center text-gray-500 font-lato">
                          {item.MobilePhone}
                        </div>
                      </div>
                      <div className="flex justify-end w-10 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary">
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
      )}
      {!isClients && (
        <div className="p-4">
          {OrdersQuery.isLoading && (
            <>
              {Array(2)
                .fill()
                .map((_, index) => (
                  <div
                    className="flex flex-col p-4 mb-3 border rounded last:mb-0"
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
                    <div className="flex justify-between pt-4 mt-4 border-t">
                      <div className="w-full">
                        <div className="flex mb-1 font-medium">
                          <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-10/12 mb-1"></div>
                        </div>
                        <div className="flex mb-1 font-medium">
                          <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-6/12 mb-1"></div>
                        </div>
                        <div className="flex font-medium">
                          <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12 mb-1"></div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary animate-pulse">
                          <ArrowRightIcon className="w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!OrdersQuery.isLoading && (
            <>
              {ListsOrder && ListsOrder.length > 0 && (
                <>
                  {ListsOrder.map((item, index) => (
                    <Link
                      noLinkClass
                      className="flex flex-col p-4 mb-3 border rounded last:mb-0"
                      href={`/admin/pos/orders/view/${item.ID}`}
                      key={index}
                    >
                      <div className="flex justify-between">
                        <div className="w-[100px]">
                          <div className="mb-1 text-xl font-bold font-lato">
                            #{item?.ID}
                          </div>
                          <div
                            className={clsx(
                              "px-2.5 py-1 text-[13px] border rounded-2xl inline-block",
                              StringHelpers.getClassOrder(item).Color
                            )}
                          >
                            {StringHelpers.getClassOrder(item).Value}
                          </div>
                        </div>
                        <div className="flex-1 pl-5 text-right">
                          <div className="mb-2 text-lg font-bold font-lato">
                            {StringHelpers.formatVND(
                              item?.thanhtoan?.tong_gia_tri_dh
                            )}
                          </div>
                          {item?.Status !== "cancel" && (
                            <div className="flex justify-between">
                              <span className="w-24 text-right">
                                Thanh toán:
                              </span>
                              <span className="pl-1">
                                {StringHelpers.formatVND(
                                  item?.thanhtoan?.thanh_toan_tien +
                                    item?.thanhtoan?.thanh_toan_vi +
                                    item?.thanhtoan?.thanh_toan_ao
                                )}
                              </span>
                            </div>
                          )}
                          {item?.thanhtoan?.tong_gia_tri_dh -
                            item?.thanhtoan?.thanh_toan_tien -
                            item?.thanhtoan?.thanh_toan_vi -
                            item?.thanhtoan?.thanh_toan_ao >
                            0 &&
                            !item.IsReturn &&
                            item?.Status !== "cancel" && (
                              <div className="flex justify-between">
                                <span className="w-24 text-right text-danger">
                                  Còn nợ:
                                </span>
                                <span className="font-semibold font-lato text-danger">
                                  {StringHelpers.formatVND(
                                    item?.thanhtoan?.tong_gia_tri_dh -
                                      item?.thanhtoan?.thanh_toan_tien -
                                      item?.thanhtoan?.thanh_toan_vi -
                                      item?.thanhtoan?.thanh_toan_ao
                                  )}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex justify-between pt-4 mt-4 border-t">
                        <div>
                          <div className="text-gray-600">
                            {moment(item?.CreateDate).format(
                              "HH:mm DD-MM-YYYY"
                            )}
                          </div>
                          <div className="flex items-center text-gray-500 text-[14px] my-px">
                            {item?.Stock && <>Tại {item?.Stock?.Title}</>}
                          </div>
                          {item?.User && (
                            <div className="mb-px text-gray-500">
                              <span>Nhân viên bán</span>
                              <span className="pl-1.5">
                                {item?.User?.FullName}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary">
                            <ArrowRightIcon className="w-5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              )}
              {(!ListsOrder || ListsOrder.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                />
              )}
            </>
          )}
        </div>
      )}
    </Page>
  );
}

export default ClientsAdmin;

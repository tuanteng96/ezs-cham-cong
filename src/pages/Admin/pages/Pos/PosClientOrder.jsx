import {
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import React, { useRef, useState } from "react";
import { ArrowRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import { useInfiniteQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import NoFound from "@/components/NoFound";
import clsx from "clsx";
import StringHelpers from "@/helpers/StringHelpers";
import moment from "moment";

function PosClientOrder({ f7route }) {
  const allowInfinite = useRef(true);
  let Auth = useStore("Auth");

  const [filters] = useState({
    Key: "",
    pi: 1,
    ps: 20,
  });

  const OrdersQuery = useInfiniteQuery({
    queryKey: ["ClientOrderID", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await AdminAPI.listOrders({
        ...filters,
        pi: pageParam,
        ps: 12,
        Token: Auth.token,
        ForMember: f7route?.params?.id,
        Key: "KH:" + f7route?.params?.id,
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
        <NavTitle>
          Đơn hàng
          {OrdersQuery?.data?.pages &&
            OrdersQuery?.data?.pages[0].total > 0 && (
              <span className="pl-1">
                ({OrdersQuery?.data?.pages[0].total})
              </span>
            )}
        </NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>

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
            {Lists && Lists.length > 0 && (
              <>
                {Lists.map((item, index) => (
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
                            <span className="w-24 text-right">Thanh toán:</span>
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
                          {moment(item?.CreateDate).format("HH:mm DD-MM-YYYY")}
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

export default PosClientOrder;

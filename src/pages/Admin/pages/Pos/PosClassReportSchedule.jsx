import AdminAPI from "@/api/Admin.api";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import {
  AdjustmentsVerticalIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import moment from "moment";
import React, { useRef, useState } from "react";
import { useInfiniteQuery } from "react-query";
import { PickerClassReportFilter } from "./components";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import clsx from "clsx";

function PosClassReportSchedule({ f7router, f7route }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const allowInfinite = useRef(true);

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const [filters, setFilters] = useState({
    ClassIDs: null,
    TeachIDs: null,
    StockID: CrStocks
      ? {
          label: CrStocks?.Title,
          value: CrStocks?.ID,
        }
      : null,
    DateStart: null,
    DateEnd: null,
    BeginFrom: new Date(),
    BeginTo: new Date(),
    Status: "",
    WorkingTime: "",
    Pi: 1,
    Ps: 30,
  });

  const { data, refetch, isLoading, fetchNextPage } = useInfiniteQuery({
    queryKey: ["PosClassReportSchedule", filters],
    queryFn: async ({ pageParam = 1 }) => {
      let { data } = await AdminAPI.getClassListSchedule({
        data: {
          ...filters,
          StockID: filters?.StockID
            ? [filters?.StockID?.value]
            : adminTools_byStock?.StockRoles?.map((x) => x.value),
          ClassIDs: filters.ClassIDs ? [filters.ClassIDs?.value] : [],
          TeachIDs: filters.TeachIDs ? [filters.TeachIDs?.value] : [],
          DateStart: null,
          DateEnd: null,
          BeginFrom: moment(filters.BeginFrom)
            .set({
              hour: "00",
              minute: "00",
              second: "00",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          BeginTo: moment(filters.BeginTo)
            .set({
              hour: "23",
              minute: "59",
              second: "59",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          Status: filters?.Status ? filters?.Status?.value : "",
          WorkingTime: filters?.WorkingTime ? filters?.WorkingTime?.value : "",
          Pi: pageParam,
          Ps: 20,
        },
        Token: Auth?.token,
      });
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.Pi === lastPage.PCount ? undefined : lastPage.Pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(data?.pages, "Items");

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      className="bg-white"
      name="Pos-class-reuquest-schedule"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={isLoading}
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
          <div>
            Thống kê lớp học (
            {data?.pages && data?.pages.length > 0 ? data?.pages[0].Total : 0})
          </div>
          <div className="font-lato text-[12px] tracking-[1px] opacity-90">
            {moment(filters.BeginFrom).format("DD/MM/YYYY")}
            <span className="px-1">-</span>
            {moment(filters.BeginTo).format("DD/MM/YYYY")}
          </div>
        </NavTitle>
        <NavRight className="h-full">
          <PickerClassReportFilter
            filters={filters}
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                ...val,
              }));
            }}
          >
            {({ open }) => (
              <Link
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
                onClick={open}
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </Link>
            )}
          </PickerClassReportFilter>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>

      <div className="pb-safe-b">
        <div className="p-4">
          {isLoading && (
            <>
              {Array(2)
                .fill()
                .map((_, index) => (
                  <div className="mb-4 border rounded last:mb-0" key={index}>
                    <div className="flex justify-between px-4 py-4 font-medium bg-gray-100 border-b">
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between px-4 py-4 font-medium border-b">
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between px-4 py-4 font-medium border-b">
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!isLoading && (
            <>
              {Lists && Lists.length > 0 && (
                <>
                  {Lists.map((item, index) => (
                    <div
                      className="mb-3.5 last:mb-0 border shadow rounded overflow-hidden"
                      key={index}
                    >
                      <div className="px-4 py-2.5 bg-gray-50">
                        <div className="font-semibold text-[15px] text-primary">
                          {item?.Class?.Title}
                        </div>
                        <div className="mt-1 font-medium leading-4 text-gray-700 font-lato">
                          Ngày {moment(item.TimeBegin).format("DD-MM-YYYY")}
                          <span className="pl-1">
                            ({moment(item.TimeBegin).format("HH:mm")}
                            <span className="px-1">-</span>
                            {moment(item.TimeBegin)
                              .add(item.Class.Minutes, "minutes")
                              .format("HH:mm")}
                            )
                          </span>
                        </div>
                      </div>
                      <div className="border-t">
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[110px]">Cơ sở</div>
                          <div className="flex-1 text-right">
                            {item?.Stock?.Title}
                          </div>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[110px]">HVL</div>
                          <div className="flex-1 text-right">
                            {item?.Teacher?.FullName}
                          </div>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[110px]">
                            Học viên / Tổng
                          </div>
                          <div className="flex-1 text-right font-lato text-[15px] font-medium">
                            {item?.Member?.Lists?.length || 0}
                            <span className="px-px">/</span>
                            {item?.Class?.MemberTotal}
                          </div>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[110px]">
                            Trạng thái
                          </div>
                          <div className="flex-1 text-right">
                            <div
                              className={clsx(
                                item?.Member?.Status && "text-success"
                              )}
                            >
                              {item?.Member?.Status && "Hoàn thành"}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[110px]">
                            Loại làm việc
                          </div>
                          <div className="flex-1 text-right">
                            {item?.Member?.IsOverTime && "Ngoài giờ"}
                          </div>
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
      </div>
    </Page>
  );
}

export default PosClassReportSchedule;

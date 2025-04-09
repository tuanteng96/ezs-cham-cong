import React, { useState } from "react";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  AdjustmentsVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import NoFound from "@/components/NoFound";
import { useInfiniteQuery } from "react-query";
import moment from "moment";
import ClassOsAPI from "@/api/ClassOs.api";
import { PickerFilter } from "./components";
import ArrayHelpers from "@/helpers/ArrayHelpers";

function OsClass(props) {
  let Auth = useStore("Auth");

  let [filters, setFilters] = useState({
    ClassIDs: [],
    TeachIDs: [Auth?.ID], //Auth?.ID
    StockID: null,
    DateStart: null,
    DateEnd: null,
    BeginFrom: new Date(),
    BeginTo: new Date(),
    Pi: 1,
    Ps: 20,
  });

  const { data, isLoading, refetch } = useInfiniteQuery({
    queryKey: ["OsMembers", filters],
    queryFn: async ({ pageParam = 1 }) => {
      let { data } = await ClassOsAPI.getListMembers({
        data: {
          ...filters,
          StockID: filters?.StockID?.value ? [filters?.StockID?.value] : [],
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
          Pi: pageParam,
        },
        Token: Auth?.token,
      });
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage?.Pi === lastPage?.PCount ? undefined : lastPage?.Pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(data?.pages, "Items");

  return (
    <Page
      className="bg-white"
      name="OsClass"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
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
          {moment(filters.BeginFrom).format("DD-MM-YYYY") ===
            moment().format("DD-MM-YYYY") &&
          moment(filters.BeginTo).format("DD-MM-YYYY") ===
            moment().format("DD-MM-YYYY")
            ? "Quản lý lớp hôm nay"
            : `Quản lý lớp (${moment(filters.BeginFrom).format(
                "DD/MM"
              )} - ${moment(filters.BeginTo).format("DD/MM")})`}
        </NavTitle>
        <NavRight className="h-full">
          <PickerFilter
            initialValues={filters}
            onChange={(values) =>
              setFilters({
                ...filters,
                ...values,
              })
            }
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
          </PickerFilter>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div>
        {isLoading && (
          <div className="p-4">
            {Array(2)
              .fill()
              .map((_, index) => (
                <div
                  className="mb-3.5 border shadow last:mb-0 rounded overflow-hidden flex flex-col"
                  key={index}
                >
                  <div className="px-4 py-2.5 border-b bg-gray-50 relative">
                    <div className="mb-1 font-semibold text-primary">
                      <div className="animate-pulse h-3.5 bg-gray-200 rounded-full w-8/12"></div>
                    </div>
                    <div className="font-medium text-gray-700 font-lato">
                      <div className="w-2/4 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <ChevronRightIcon className="absolute w-6 text-gray-300 right-3 top-2/4 -translate-y-2/4" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                      <div className="text-gray-600">Tổng học viên</div>
                      <div className="font-semibold font-lato text-[15px]">
                        <div className="animate-pulse h-3.5 bg-gray-200 rounded-full w-6"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                      <div className="text-gray-600">Điểm danh đến</div>
                      <div className="font-semibold font-lato text-[15px]">
                        <div className="animate-pulse h-3.5 bg-gray-200 rounded-full w-6"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                      <div className="text-gray-600">Điểm danh không đến</div>
                      <div className="font-semibold font-lato text-[15px]">
                        <div className="animate-pulse h-3.5 bg-gray-200 rounded-full w-6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
        {!isLoading && (
          <>
            {Lists && Lists.length > 0 && (
              <div className="p-4">
                {Lists.map((item, index) => (
                  <Link
                    href={`/osclass/${item.ID}?prevState=${JSON.stringify({
                      ClassID: item?.Class?.ID,
                      ClassTitle: item?.Class?.Title,
                      TimeBegin: item.TimeBegin,
                      Minutes: item?.Class?.Minutes,
                      StockID: item?.StockID,
                    })}`}
                    noLinkClass
                    className="mb-3.5 border shadow last:mb-0 rounded overflow-hidden flex flex-col"
                    key={index}
                  >
                    <div className="px-4 py-2.5 border-b bg-gray-50 relative">
                      <div className="font-semibold text-primary">
                        {item?.Class?.Title}
                      </div>
                      <div className="font-medium text-gray-700 font-lato">
                        {moment(item.TimeBegin).format("DD/MM/YYYY")}
                        <span className="pl-1">
                          ({moment(item.TimeBegin).format("HH:mm")} -{" "}
                          {moment(item.TimeBegin)
                            .add(item?.Class?.Minutes, "minute")
                            .format("HH:mm")}
                          )
                        </span>
                      </div>
                      <ChevronRightIcon className="absolute w-6 text-gray-300 right-3 top-2/4 -translate-y-2/4" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                        <div>Cơ sở {item?.Stock?.Title}</div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                        <div className="text-gray-600">Tổng học viên</div>
                        <div className="font-semibold font-lato text-[15px]">
                          {item?.Member?.Lists?.length || 0}
                          <span className="px-px">/</span>
                          {item?.Class?.MemberTotal}
                          {item?.Member?.Lists &&
                            item?.Member?.Lists?.length > 0 &&
                            item?.Member?.Lists?.length ===
                              item?.Class?.MemberTotal && (
                              <span className="text-danger pl-1.5">(FULL)</span>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                        <div className="text-gray-600">Điểm danh đến</div>
                        <div className="font-semibold font-lato text-[15px]">
                          {item?.Member?.Lists && item?.Member?.Lists.length > 0
                            ? item?.Member?.Lists.filter(
                                (x) => x.Status === "DIEM_DANH_DEN"
                              ).length
                            : 0}
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                        <div className="text-gray-600">Điểm danh không đến</div>
                        <div className="font-semibold font-lato text-[15px]">
                          {item?.Member?.Lists && item?.Member?.Lists.length > 0
                            ? item?.Member?.Lists.filter(
                                (x) => x.Status === "DIEM_DANH_KHONG_DEN"
                              ).length
                            : 0}
                        </div>
                      </div>
                      {item?.Member?.Status && (
                        <div className="flex items-center justify-between px-4 py-3 border-b border-dashed last:border-0">
                          <div className="text-gray-600">Trạng thái</div>
                          <div className="font-semibold text-success">
                            Đã hoàn thành
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
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

export default OsClass;

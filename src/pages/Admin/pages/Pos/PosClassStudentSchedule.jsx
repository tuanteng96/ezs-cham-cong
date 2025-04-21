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
import { PickerClassStudentFilter } from "./components";
import ArrayHelpers from "@/helpers/ArrayHelpers";

function PosClassStudentSchedule({ f7router, f7route }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const allowInfinite = useRef(true);

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const [filters, setFilters] = useState({
    MemberIDs: null,
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
    UserRequest: "",
  });

  const { data, refetch, isLoading, fetchNextPage } = useInfiniteQuery({
    queryKey: ["PosClassStudentSchedule", filters],
    queryFn: async ({ pageParam = 1 }) => {
      let result = await AdminAPI.getClassListSchedule({
        data: {
          ...filters,
          StockID: filters?.StockID
            ? [filters?.StockID?.value]
            : adminTools_byStock?.StockRoles?.map((x) => x.value),
          ClassIDs: filters.ClassIDs ? [filters.ClassIDs?.value] : [],
          TeachIDs: filters.TeachIDs ? [filters.TeachIDs?.value] : [],
          MemberIDs: filters.MemberIDs ? [filters.MemberIDs?.value] : [],
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

      if (!filters.MemberIDs)
        return {
          Items: [],
          Pi: 1,
          PCount: 0,
        };

      return result?.data || null;
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
        <NavTitle>Danh sách theo học viên</NavTitle>
        <NavRight className="h-full">
          <PickerClassStudentFilter
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
          </PickerClassStudentFilter>
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
                    <Link
                      noLinkClass
                      href={`/admin/pos/calendar/class-schedule/${
                        item?.Class?.ID
                      }/?formState=${JSON.stringify({
                        DateFrom: moment(item?.TimeBegin).format(
                          "HH:mm DD-MM-YYYY"
                        ),
                        Class: {
                          Title: item?.Class?.Title,
                          Minutes: item?.Class?.Minutes,
                          StockID: item?.StockID,
                        },
                      })}`}
                      className="mb-3.5 last:mb-0 border shadow rounded overflow-hidden flex flex-col"
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
                          <div className="text-gray-500 w-[90px]">Cơ sở</div>
                          <div className="flex-1 text-right">
                            {item?.Stock?.Title}
                          </div>
                        </div>
                        {/* <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[90px]">Dịch vụ</div>
                          <div className="flex-1 text-right">
                            {item?.Class?.Prods?.map((x) => x.Title).join(", ")}
                          </div>
                        </div> */}
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[90px]">
                            Trạng thái
                          </div>
                          <div className="flex-1 text-right">
                            {item?.Member?.Status
                              ? "Hoàn thành"
                              : "Chưa hoàn thành"}
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
      </div>
    </Page>
  );
}

export default PosClassStudentSchedule;

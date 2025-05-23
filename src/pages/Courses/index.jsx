import React, { useState, useRef } from "react";
import {
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
  Link,
} from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import { useInfiniteQuery } from "react-query";
import CoursesAPI from "../../api/Course.api";
import ArrayHelpers from "../../helpers/ArrayHelpers";
import {
  AdjustmentsVerticalIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import { PickerCourseFilter } from "./components";
import NoFound from "../../components/NoFound";

function CoursesPage(props) {
  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");
  let [filters, setFilters] = useState({
    pi: 1,
    ps: 10,
    filter: {
      StockID: CrStocks ? { label: CrStocks.Title, value: CrStocks.ID } : "",
      Tags: "",
      Status: "",
      Teachers: Auth?.ID === 1 ? "" : "," + Auth?.ID.toString(),
    },
  });

  const allowInfinite = useRef(true);

  const { Global } = useStore("Brand");

  const CoursesQuery = useInfiniteQuery({
    queryKey: ["CoursesList", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await CoursesAPI.list({
        ...filters,
        pi: pageParam,
        ps: 15,
        filter: {
          ...filters?.filter,
          StockID: filters?.filter?.StockID?.value || '',
          Tags: "",
          Status: filters?.filter?.Status?.value || "",
          Teachers: Auth?.ID === 1 ? "" : "," + Auth?.ID.toString(),
        },
      });
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pcount ? undefined : lastPage.pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    CoursesQuery?.data?.pages,
    "items"
  );

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    CoursesQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => CoursesQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={CoursesQuery.isFetchingNextPage}
      onInfinite={loadMore}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            back
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Khoá đào tạo</NavTitle>
        <NavRight className="h-full">
          <PickerCourseFilter
            data={filters.filter}
            onChange={(val) =>
              setFilters((prevState) => ({
                ...prevState,
                filter: {
                  ...prevState.filter,
                  ...val,
                },
              }))
            }
          >
            {({ open }) => (
              <div
                className="flex items-center justify-center w-12 h-full"
                onClick={open}
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </div>
            )}
          </PickerCourseFilter>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="p-4">
        {CoursesQuery.isLoading && (
          <>
            {Array(5)
              .fill()
              .map((_, index) => (
                <div
                  className="p-4 mb-4 bg-white rounded last:mb-0"
                  key={index}
                >
                  <div className="flex items-center justify-between pb-3.5 mb-5 border-b">
                    <div className="w-10/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="relative">
                    <div className="w-full h-3 mb-1.5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-3 mb-1.5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-7/12 h-3 mb-1.5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-3 mb-1.5 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
          </>
        )}

        {!CoursesQuery.isLoading && (
          <>
            {Lists &&
              Lists.length > 0 &&
              Lists.map((item, index) => (
                <div
                  className="p-4 mb-4 bg-white rounded last:mb-0"
                  key={index}
                >
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b">
                    <div className="text-base font-medium capitalize text-primary">
                      {item.Title} 
                      {Global?.Admin?.khoahocinfo && <span>- {item.Total} buổi</span>}
                    </div>
                  </div>
                  <div className="text-[15px]">
                    <div className="flex mb-1">
                      <span className="pr-1 text-[#3f4254]">
                        Thời gian bắt đầu :
                      </span>
                      <span className="font-medium">
                        {item.DateStart
                          ? moment(item.DateStart).format("DD-MM-YYYY")
                          : "Chưa xác định"}
                      </span>
                    </div>
                    <div className="flex mb-1">
                      <span className="pr-1 text-[#3f4254]">Cơ sở :</span>
                      <span className="font-medium">
                        {item.StockTitle || "Chưa xác định"}
                      </span>
                    </div>
                    <div className="flex mb-1">
                      <span className="pr-1 text-[#3f4254]">Trạng thái :</span>
                      <span className="font-medium">
                        {item.Status ? (
                          Number(item.Status) === 1 ? (
                            <span className="text-success">Đang vận hành</span>
                          ) : (
                            <span className="text-danger">Đã kết thúc</span>
                          )
                        ) : (
                          "Chưa xác định"
                        )}
                      </span>
                    </div>
                    {item.Tags && (
                      <div className="flex">
                        <span className="pr-1 text-[#3f4254]">Tags :</span>
                        <span className="font-medium">{item.Tags}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-3.5 mt-4 border-t grid grid-cols-2 gap-4">
                    <Link
                      href={`/courses/student/${item.ID}?title=${item.Title}`}
                      className="!text-white bg-primary mr-3 px-2 py-2.5 text-[15px] rounded font-medium w-full"
                    >
                      Học viên
                    </Link>
                    <Link
                      href={`/courses/attendance/${item.ID}?title=${item.Title}`}
                      className="!text-white bg-success mr-3 px-2 py-2.5 text-[15px] rounded font-medium w-full"
                    >
                      Điểm danh
                    </Link>
                  </div>
                </div>
              ))}
            {(!Lists || Lists.length === 0) && (
              <NoFound
                Title="Không có kết quả nào."
                Desc="Rất tiếc ... Không tìm thấy dữ liệu nào, bạn có thể thay đổi tháng để
                  tìm dữ liệu"
              />
            )}
          </>
        )}
      </div>
    </Page>
  );
}

export default CoursesPage;

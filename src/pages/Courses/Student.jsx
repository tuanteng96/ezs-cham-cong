import React, { useState, useRef } from "react";
import {
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Link,
  useStore,
} from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import { useInfiniteQuery } from "react-query";
import CoursesAPI from "../../api/Course.api";
import {
  AdjustmentsVerticalIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import NoFound from "../../components/NoFound";
import ArrayHelpers from "../../helpers/ArrayHelpers";
import StringHelpers from "../../helpers/StringHelpers";
import moment from "moment";
import { PickerEditStudent, PickerStudentFilter } from "./components";

function StudentPage({ f7route }) {
  let { params, query } = f7route;
  let [filters, setFilters] = useState({
    pi: 1,
    ps: 20,
    filter: {
      MemberID: "",
      CourseID: params.id,
      Status: [
        {
          value: 2,
          label: "Chưa tốt nghiệp",
        },
        {
          value: 4,
          label: "Chờ tốt nghiệp",
        },
      ],
      Places: "",
      no: "",
    },
    order: {
      CreateDate: "desc",
    },
  });

  const { Global } = useStore("Brand");

  const allowInfinite = useRef(true);

  const StudentQuery = useInfiniteQuery({
    queryKey: ["CoursesStudentList", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await CoursesAPI.listStudentCourse({
        ...filters,
        pi: pageParam,
        ps: 10,
        filter: {
          ...filters.filter,
          no: filters.filter.no?.value || "",
          Status:
            filters.filter.Status && filters.filter.Status.length > 0
              ? "," + filters.filter.Status.map((x) => x.value).toString()
              : "",
        },
      });
      return data
        ? {
            ...data,
            items: data?.items
              ? data?.items.map((x) => ({
                  ...x,
                  OutOfDate: getOutOfDate(x),
                }))
              : [],
          }
        : null;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pcount ? undefined : lastPage.pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    StudentQuery?.data?.pages,
    "items"
  );

  const getOutOfDate = (rowData) => {
    if (rowData.Status === "1") return;
    let { Course, MinDate, tongthoigian } = rowData;
    let { DayCount } = Course;

    if (!MinDate) return;

    let EndDate = moment(MinDate, "YYYY-MM-DD")
      .add(Number(DayCount), "days")
      .format("YYYY-MM-DD");

    let ofDate = moment(EndDate, "YYYY-MM-DD").diff(new Date(), "days");

    if (!Global?.Admin?.khoahocinfo) {
      EndDate = moment(MinDate, "YYYY-MM-DD")
        .add(Number(tongthoigian), "days")
        .format("YYYY-MM-DD");
      ofDate = moment(EndDate, "YYYY-MM-DD").diff(new Date(), "days");
    }

    if (ofDate < 0) {
      return `Quán hạn tốt nghiệp ${Math.abs(ofDate)} ngày`;
    }
  };

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    StudentQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => StudentQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={StudentQuery.isFetchingNextPage}
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
        <NavTitle>
          (
          {StudentQuery?.data?.pages && StudentQuery?.data?.pages.length > 0
            ? StudentQuery?.data?.pages[0].total
            : 0}
          ) {query.title}
        </NavTitle>
        <NavRight className="h-full">
          <PickerStudentFilter
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
          </PickerStudentFilter>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {StudentQuery.isLoading && (
        <div className="pb-safe-b">
          <div className="p-4">
            {Array(3)
              .fill()
              .map((_, index) => (
                <div className="bg-white mb-3.5 last:mb-0 rounded" key={index}>
                  <div className="border-b px-3 py-2.5">
                    <div className="w-full h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="p-4">
                    <div className="w-full h-3 mb-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-2/4 h-3 mb-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-8/12 h-3 mb-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      {!StudentQuery.isLoading && (
        <div className="pb-safe-b">
          {Lists && Lists.length > 0 && (
            <div className="p-4">
              {Lists.map((item, index) => (
                <div className="bg-white mb-3.5 last:mb-0 rounded" key={index}>
                  <div className="border-b px-3 py-2.5">
                    <div className="font-semibold text-[15px] text-primary">
                      {item?.Member?.FullName} - {item?.Member?.MobilePhone}
                    </div>
                    {item?.OutOfDate && (
                      <div className="text-danger text-[13px]">
                        {item.OutOfDate}
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-[15px]">
                    <div>
                      <span className="pr-1 text-[#3f4254]">Buổi / Tổng :</span>
                      {Global?.Admin?.khoahocinfo ? (
                        <span className="font-medium">
                          {item?.TotalCheck + Number(item?.TotalBefore || 0)} /
                          {item?.Course?.Total}
                        </span>
                      ) : (
                        <span className="font-medium">
                          {item?.TotalCheck + Number(item?.TotalBefore || 0)} /
                          {item?.Sobuoi}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="pr-1 text-[#3f4254]">
                        Giá trị khoá học :{" "}
                      </span>
                      <span className="font-medium">
                        {StringHelpers.formatVNDPositive(
                          item?.OrderItem?.ToPay
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="pr-1 text-[#3f4254]">Nợ : </span>
                      <span className="font-medium">
                        {StringHelpers.formatVNDPositive(item?.RemainPay)}
                      </span>
                    </div>
                    <div>
                      <span className="pr-1 text-[#3f4254]">Tags : </span>
                      <span className="font-medium">{item?.Tags}</span>
                    </div>
                    <div>
                      <span className="pr-1 text-[#3f4254]">Trạng thái : </span>
                      <span className="font-medium">
                        {Number(item?.Status) === 1 && "Đã tốt nghiệp"}
                        {Number(item?.Status) === 2 && "Chưa tốt nghiệp"}
                        {Number(item?.Status) === 3 && "Đang tạm dừng"}
                        {Number(item?.Status) === 4 && "Chờ tốt nghiệp"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <PickerEditStudent
                      refetch={StudentQuery.refetch}
                      data={item}
                      params={params}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          className="!text-white bg-success mr-3 px-2 py-2.5 text-[15px] rounded font-medium w-full"
                          onClick={open}
                        >
                          Xem chi tiết
                        </button>
                      )}
                    </PickerEditStudent>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(!Lists || Lists.length === 0) && (
            <div className="px-5">
              <NoFound
                Title="Không có kết quả nào."
                Desc="Rất tiếc ... Không tìm thấy dữ liệu nào, bạn có thể thay đổi tháng để tìm dữ liệu"
              />
            </div>
          )}
        </div>
      )}
    </Page>
  );
}

export default StudentPage;

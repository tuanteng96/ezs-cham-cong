import React, { useState, useRef } from "react";
import {
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Link,
  f7,
} from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import { useInfiniteQuery } from "react-query";
import CoursesAPI from "../../api/Course.api";
import { CalendarDaysIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { DatePickerWrap } from "../../partials/forms";
import NoFound from "../../components/NoFound";
import ArrayHelpers from "../../helpers/ArrayHelpers";
import StringHelpers from "../../helpers/StringHelpers";

function AttendancePage({ f7route }) {
  let { params, query } = f7route;
  let [filters, setFilters] = useState({
    pi: 1,
    ps: 20,
    filter: {
      MemberID: "",
      CourseID: params.id,
      Status: "",
      Places: "",
      no: "",
    },
    order: {
      CreateDate: "desc",
    },
  });

  const allowInfinite = useRef(true);

  const StudentQuery = useInfiniteQuery({
    queryKey: ["CoursesStudentList", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await CoursesAPI.listStudentCourse({
        ...filters,
        pi: pageParam,
        ps: 10,
      });
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pcount ? undefined : lastPage.pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    StudentQuery?.data?.pages,
    "items"
  );

  console.log(Lists);

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
      onPtrRefresh={(done) => StudentQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={StudentQuery.isLoading}
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
        <NavTitle>Học viên {query.title}</NavTitle>
        <NavRight className="h-full">
          <DatePickerWrap
            value={filters.filter.CreateDate}
            format="DD-MM-YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                filter: {
                  ...prevState.filter,
                  CreateDate: val,
                },
              }));
            }}
            label="Chọn ngày"
          >
            {({ open }) => (
              <div
                className="flex items-center justify-center w-12 h-full"
                onClick={open}
              >
                <CalendarDaysIcon className="w-6" />
              </div>
            )}
          </DatePickerWrap>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {StudentQuery.isLoading && <div>Đang tải ...</div>}
      {!StudentQuery.isLoading && (
        <>
          {Lists && Lists.length > 0 && (
            <div className="p-4">
              {Lists.map((item, index) => (
                <div className="bg-white mb-3.5 rounded" key={index}>
                  <div className="border-b px-3 py-2.5">
                    <div className="font-semibold text-[15px]">
                      {item?.Member.FullName} - {item?.Member.MobilePhone}
                    </div>
                    {item?.OutOfDate && (
                      <div className="text-danger text-[13px]">
                        {item.OutOfDate}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div>{item?.Places}</div>
                    <div>{item?.Member.HomeAddress}</div>
                    <div>
                      {item?.TotalCheck + Number(item?.TotalBefore || 0)}/
                      {item?.Course?.Total}
                    </div>
                    <div>
                      {StringHelpers.formatVNDPositive(item?.RemainPay)}
                    </div>
                    <div>
                      {Number(item?.Status) === 1 && "Đã tốt nghiệp"}
                      {Number(item?.Status) === 2 && "Chưa tốt nghiệp"}
                      {Number(item?.Status) === 3 && "Đang tạm dừng"}
                    </div>
                    <div>{item.Desc}</div>
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
        </>
      )}
    </Page>
  );
}

export default AttendancePage;

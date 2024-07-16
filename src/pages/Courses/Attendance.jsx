import React, { useState, useRef } from "react";
import {
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Link,
} from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import { useQuery } from "react-query";
import CoursesAPI from "../../api/Course.api";
import { CalendarDaysIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import { DatePickerWrap } from "../../partials/forms";
import NoFound from "../../components/NoFound";

function AttendancePage({ f7route }) {
  let { params, query } = f7route;
  let [filters, setFilters] = useState({
    pi: 1,
    ps: 500,
    filter: {
      CreateDate: new Date(),
      CourseID: params.id,
    },
  });

  const allowInfinite = useRef(true);

  const { data: Clients, isLoading: isLoadingClient } = useQuery({
    queryKey: ["CoursesListStudent", params.id],
    queryFn: async () => {
      const { data } = await CoursesAPI.listStudentCourse({
        pi: 1,
        ps: 500,
        filter: {
          MemberID: "",
          CourseID: params.id,
          Status: "",
        },
        order: {
          CreateDate: "desc",
        },
      });
      return data?.items || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["CoursesListAttendance", { filters, Clients }],
    queryFn: async () => {
      let From = moment(filters.filter.CreateDate)
        .set({
          hour: "00",
          minute: "00",
          second: "00",
        })
        .format("YYYY-MM-DD HH:mm:ss");
      let To = moment(filters.filter.CreateDate)
        .set({
          hour: "23",
          minute: "59",
          second: "59",
        })
        .format("YYYY-MM-DD HH:mm:ss");
      const { data } = await CoursesAPI.studentCheck({
        ...filters,
        filter: {
          ...filters.filter,
          CreateDate: [From, To],
        },
      });

      let newData = [...Clients];
      if (data?.items && data?.items.length > 0) {
        for (let item of data?.items) {
          let index = newData.findIndex((x) => x.MemberID === item.MemberID);
          if (index > -1) {
            newData[index].items = [item];
          }
        }
      }
      return newData;
    },
    enabled: Boolean(Clients && Clients.length > 0),
  });

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    // CoursesQuery.fetchNextPage().then(() => {
    //   allowInfinite.current = true;
    // });
  };
  console.log(data)
  return (
    <Page
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      //   ptr
      //   onPtrRefresh={(done) => CoursesQuery.refetch().then(() => done())}
      //   infinite
      //   infiniteDistance={50}
      //   infinitePreloader={CoursesQuery.isLoading}
      //   onInfinite={loadMore}
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
        <NavTitle>{query.title}</NavTitle>
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
      <div>
        <div className="flex">
            <div>Học viên</div>
            <div>{moment(filters.filter.CreateDate).format("DD-MM-YYYY")}</div>
        </div>
        {
            data && data.length > 0 && (
                <div>
                    {
                        data.map((member,index) => (
                            <div key={index}>
                                <div>{member.Member.FullName}</div>
                                <div>Checkin</div>
                            </div>
                        ))
                    }
                </div>
            )
        }

        {/* {CoursesQuery.isLoading && (
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
                    <div className="flex pb-5 relative before:content-[''] before:absolute before:h-full before:border-l before:z-1 before:left-[5px] before:border-dashed">
                      <div className="z-10 w-[11px] h-[11px] bg-white border rounded-full border-success"></div>
                      <div className="relative flex-1 pl-3">
                        <div className="absolute top-[-5px] l-3 text-muted">
                          Xin nghỉ từ
                        </div>
                        <div className="pt-5 font-semibold capitalize">
                          <div>
                            <div className="w-7/12 h-3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="z-10 w-[11px] h-[11px] bg-white border rounded-full border-danger"></div>
                      <div className="relative flex-1 pl-3">
                        <div className="absolute top-[-5px] l-3 text-muted">
                          Đến
                        </div>
                        <div className="pt-5 font-semibold capitalize">
                          <div>
                            <div className="w-7/12 h-3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                      {item.Title} - {item.Total} buổi
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
                    <div className="flex">
                      <span className="pr-1 text-[#3f4254]">Tags :</span>
                      <span className="font-medium">{item.Tags}</span>
                    </div>
                  </div>
                  <div className="pt-3.5 mt-4 border-t">
                    <button
                      type="button"
                      className="!text-white bg-success mr-3 px-2 py-2.5 text-[15px] rounded font-medium"
                    >
                      Điểm danh
                    </button>
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
        )} */}
      </div>
    </Page>
  );
}

export default AttendancePage;

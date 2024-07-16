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
import { useMutation, useQuery } from "react-query";
import CoursesAPI from "../../api/Course.api";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import { DatePickerWrap } from "../../partials/forms";
import NoFound from "../../components/NoFound";
import CourseAPI from "../../api/Course.api";
import { toast } from "react-toastify";
import { PickerEditCheck } from "./components";

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

  const { data, isLoading, refetch } = useQuery({
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

      let newData = [...Clients.map((x) => ({ ...x, items: [] }))];

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

  const addEditMutation = useMutation({
    mutationFn: async (data) => {
      let rs = await CourseAPI.studentEditCheck(data);
      await refetch();
      return rs;
    },
  });

  const onCheckAttendance = (member) => {
    let time = moment();
    let body = {
      edit: [
        {
          ID: 0,
          MemberID: member?.MemberID,
          CourseID: member?.CourseID,
          CourseMemberID: member?.CourseMemberID,
          Desc: "",
          CreateDate: moment()
            .set({
              hour: time.get("hour"),
              minute: time.get("minute"),
              second: time.get("second"),
            })
            .format("YYYY-MM-DD HH:mm"),
        },
      ],
    };
    f7.dialog.preloader("Đang thực hiện ...");
    addEditMutation.mutate(body, {
      onSuccess: (data) => {
        f7.dialog.close();
        toast.success("Điểm danh thành công.", {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 300,
        });
      },
    });
  };

  return (
    <Page
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
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
      <div className="flex flex-col h-full bg-white">
        <div className="flex border-b shadow-lg">
          <div className="w-[160px] px-4 py-3 border-r font-semibold">
            Học viên
          </div>
          <div className="flex-1 px-4 py-3 font-semibold text-center">
            {moment(filters.filter.CreateDate).format("DD-MM-YYYY")}
          </div>
        </div>
        <div className="grow">
          {(isLoading || isLoadingClient) && (
            <>
              {Array(5)
                .fill()
                .map((_, index) => (
                  <div className="flex border-b h-[80px]" key={index}>
                    <div className="w-[160px] px-4 py-2 border-r font-semibold flex items-center">
                      <div className="w-10/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex items-center flex-1 px-4 py-2">
                      <div className="flex items-center justify-center w-full">
                        <div className="w-6 h-6 bg-[#EBEDF3] rounded shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!isLoading && !isLoadingClient && (
            <>
              {data && data.length > 0 && (
                <>
                  {data.map((member, index) => (
                    <div className="flex border-b h-[80px]" key={index}>
                      <div className="w-[160px] px-4 py-2 border-r font-semibold flex items-center">
                        <div className="line-clamp-2">
                          {member.Member.FullName}
                        </div>
                      </div>
                      <div className="flex items-center justify-center flex-1 px-4 py-2">
                        {member.items && member.items.length > 0 ? (
                          <>
                            {member.items.map((x, i) => (
                              <PickerEditCheck
                                data={x}
                                refetch={refetch}
                                key={i}
                              >
                                {({ open }) => (
                                  <div
                                    className="flex items-start justify-center"
                                    onClick={open}
                                  >
                                    <div className="font-semibold text-success">
                                      Điểm danh lúc
                                      <span className="pl-1">
                                        {moment(x.CreateDate).format("HH:mm")}
                                      </span>
                                    </div>
                                    <PencilIcon className="w-4 ml-1.5 text-success" />
                                  </div>
                                )}
                              </PickerEditCheck>
                            ))}
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-full">
                            <div
                              className="w-6 h-6 bg-[#EBEDF3] rounded shadow-lg"
                              onClick={() => onCheckAttendance(member)}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {(!data || data.length === 0) && (
                <div className="px-5">
                  <NoFound
                    Title="Không có kết quả nào."
                    Desc="Rất tiếc ... Không tìm thấy dữ liệu nào, bạn có thể thay đổi tháng để
                  tìm dữ liệu"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

export default AttendancePage;

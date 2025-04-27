import AdminAPI from "@/api/Admin.api";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import moment from "moment";
import React, { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { PickerClassScheduleFilter } from "./components";
import clsx from "clsx";

let RenderItems = ({ item, onOpenClass, filters }) => {
  let [show, setShow] = useState(false);

  return (
    <div className="mb-3.5 last:mb-0 border shadow rounded">
      <div className="sticky top-0 pl-4 bg-gray-50 py-2.5 flex justify-between pr-1">
        <div>
          <div className="font-semibold text-[15px] text-primary">
            {item.Class.Title}
          </div>
          <div className="font-medium text-gray-700 font-lato">
            Ngày {moment(filters.CrDate).format("DD-MM-YYYY")}
          </div>
        </div>
        <div
          className="flex items-center justify-center w-12"
          onClick={() => setShow(!show)}
        >
          <ListBulletIcon className="text-gray-800 w-7" />
        </div>
      </div>
      {show && (
        <div className="p-4 border-t">
          {item.Items && item.Items.length > 0 && (
            <>
              {item.Items.map((cls, idx) => (
                <div
                  className={clsx(
                    !cls?.ClassInfo && "bg-[#a3a2a2]",
                    cls?.ClassInfo && cls?.className,
                    "text-white rounded mb-2 last:mb-0 p-2"
                  )}
                  key={idx}
                  onClick={() => onOpenClass(cls)}
                >
                  <div className="font-lato font-semibold text-[15px] mb-1">
                    {moment(cls.DateFrom).format("HH:mm")}
                    <span className="px-1">-</span>
                    {moment(cls.DateFrom)
                      .add(cls.Class.Minutes, "minutes")
                      .format("HH:mm")}
                  </div>
                  <div>
                    Tổng số học viên :
                    <span className="pl-1 font-medium font-lato">
                      {cls?.ClassInfo?.Member?.Lists?.length || 0}
                      <span className="px-px">/</span>
                      {cls?.Class?.MemberTotal}
                    </span>
                  </div>
                  <div>
                    HLV :
                    <span className="pl-1">
                      {cls?.ClassInfo?.Teacher?.FullName || "Chưa có"}
                    </span>
                  </div>
                  {cls?.ClassInfo && (
                    <div>
                      Điểm danh đến :
                      <span className="pl-1 font-semibold font-lato">
                        {cls?.ClassInfo?.Member?.Lists?.filter(
                          (x) => x.Status === "DIEM_DANH_DEN"
                        ).length || 0}
                      </span>
                      <span className="px-1">/</span>
                      <span>Vắng : </span>
                      <span className="pl-1 font-semibold font-lato">
                        {cls?.ClassInfo?.Member?.Lists?.filter(
                          (x) => x.Status === "Vắng"
                        ).length || 0}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

function PosClassSchedule({ f7router }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const [filters, setFilters] = useState({
    CrDate: new Date(),
    ClassIDs: null,
    StockID: CrStocks
      ? {
          ...CrStocks,
          label: CrStocks?.Title,
          value: CrStocks?.ID,
        }
      : null,
    isClassOpen: false,
  });

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["PosClassSchedule", filters],
    queryFn: async () => {
      const rsClass = await AdminAPI.getClassSchedule({
        data: {
          StockID: filters?.StockID ? [filters?.StockID?.value] : [],
          To: null,
          From: null,
          Pi: 1,
          Ps: 1000,
        },
        Token: Auth?.token,
      });

      const rsListClass = await AdminAPI.getClassListSchedule({
        data: {
          ClassIDs: [],
          TeachIDs: filters?.TeachIDs ? [filters?.TeachIDs?.value] : [],
          StockID: filters?.StockID ? [filters?.StockID?.value] : [],
          DateStart: null,
          DateEnd: null,
          BeginFrom: moment(filters.CrDate)
            .set({
              hour: "00",
              minute: "00",
              second: "00",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          BeginTo: moment(filters.CrDate)
            .set({
              hour: "23",
              minute: "59",
              second: "59",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          Pi: 1,
          Ps: 1000,
        },
        Token: Auth?.token,
      });

      let Classs = rsClass?.data?.Items || [];
      let Items = rsListClass?.data?.Items;

      let Events = [];
      for (let clss of Classs) {
        if (clss.TimeSlot && clss.TimeSlot.length > 0) {
          for (let day of clss.TimeSlot) {
            let CrIndex = moment(filters.CrDate, "e").day();
            if (CrIndex === day.Index) {
              if (day.Items && day.Items.length > 0) {
                for (let item of day.Items) {
                  let newObj = {
                    Class: clss,
                    Day: day,
                    TimeFrom: item.from,
                    DateFrom:
                      day.Index !== 0
                        ? moment(filters.CrDate, "e")
                            .startOf("week")
                            .isoWeekday(day.Index)
                            .set({
                              hour: moment(item.from, "HH:mm").get("hour"),
                              minute: moment(item.from, "HH:mm").get("minute"),
                              second: moment(item.from, "HH:mm").get("second"),
                            })
                            .toDate()
                        : moment(filters.CrDate, "e")
                            .startOf("week")
                            .isoWeekday(day.Index)
                            .add(7, "day")
                            .set({
                              hour: moment(item.from, "HH:mm").get("hour"),
                              minute: moment(item.from, "HH:mm").get("minute"),
                              second: moment(item.from, "HH:mm").get("second"),
                            })
                            .toDate(),
                  };

                  let index =
                    Items &&
                    Items.findIndex((o) => {
                      return (
                        o.OrderServiceClassID === clss.ID &&
                        moment(o.TimeBegin, "YYYY-MM-DD HH:mm").day() ===
                          day.Index &&
                        moment(o.TimeBegin, "YYYY-MM-DD HH:mm").isBetween(
                          moment(newObj.DateFrom).set({
                            hour: moment(newObj.TimeFrom, "HH:mm").get("hour"),
                            minute: moment(newObj.TimeFrom, "HH:mm").get(
                              "minute"
                            ),
                            second: moment(newObj.TimeFrom, "HH:mm").get(
                              "second"
                            ),
                          }),
                          moment(newObj.DateFrom).set({
                            hour: moment(newObj.TimeFrom, "HH:mm").get("hour"),
                            minute: moment(newObj.TimeFrom, "HH:mm").get(
                              "minute"
                            ),
                            second: moment(newObj.TimeFrom, "HH:mm").get(
                              "second"
                            ),
                          }),
                          null,
                          "[]"
                        )
                      );
                    });
                  if (index > -1) {
                    let { Member } = Items[index];
                    if (Member.Status) {
                      newObj.className = `!bg-[#8951fc]`;
                    } else if (
                      Member?.Lists &&
                      Member?.Lists?.length > 0 &&
                      Member?.Lists?.length === clss.MemberTotal
                    ) {
                      newObj.className = `bg-danger`;
                      newObj.Status = 1;
                    } else {
                      newObj.className = `bg-success`;
                    }
                    newObj.ClassInfo = Items[index];
                  }
                  Events.push(newObj);
                }
              }
            }
          }
        }
      }

      let Result = [];

      for (let event of Events) {
        let index = Result.findIndex((x) => x.Class?.ID === event?.Class?.ID);
        if (index > -1) {
          Result[index].Items = [...Result[index].Items, event].sort(
            (left, right) =>
              moment.utc(left.DateFrom).diff(moment.utc(right.DateFrom))
          );
        } else {
          Result.push({
            Class: event.Class,
            Items: [event],
          });
        }
      }

      if (filters.isClassOpen) {
        Result = Result.map((x) => ({
          ...x,
          Items: x.Items ? x.Items.filter((o) => o.ClassInfo) : [],
        })).filter((x) => x.Items && x.Items.length > 0);
      }
      return Result;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.addEditClassSchedule(body);
      await refetch();
      return rs;
    },
  });

  const recheckMutation = useMutation({
    mutationFn: async (body) => {
      let rsListClass = await AdminAPI.getClassListSchedule(body);
      return rsListClass?.data?.Items || [];
    },
  });

  const onOpenClass = async (ClassOs) => {
    let ClassInfo = null;

    if (ClassOs?.ClassInfo) {
      ClassInfo = ClassOs?.ClassInfo;
    } else {
      let newClassInfo = await new Promise((resolve, reject) => {
        f7.dialog.confirm(
          `Xác nhận tạo lớp lúc ${moment(ClassOs.DateFrom).format(
            "HH:mm DD-MM-YYYY"
          )}`,
          async () => {
            f7.dialog.preloader("Đang khởi tạo ...");
            let rs = await recheckMutation.mutateAsync({
              data: {
                ClassIDs: [],
                TeachIDs: [],
                StockID: filters?.StockID ? [filters?.StockID?.value] : [],
                DateStart: null,
                DateEnd: null,
                BeginFrom: moment(filters.CrDate)
                  .set({
                    hour: "00",
                    minute: "00",
                    second: "00",
                  })
                  .format("YYYY-MM-DD HH:mm:ss"),
                BeginTo: moment(filters.CrDate)
                  .set({
                    hour: "23",
                    minute: "59",
                    second: "59",
                  })
                  .format("YYYY-MM-DD HH:mm:ss"),
                Pi: 1,
                Ps: 1000,
              },
              Token: Auth?.token,
            });

            let index = rs?.findIndex((x) => {
              return (
                ClassOs?.Class?.ID === x?.Class?.ID &&
                moment(ClassOs?.DateFrom)
                  .set({
                    hour: moment(ClassOs.TimeFrom, "HH:mm").get("hour"),
                    minute: moment(ClassOs.TimeFrom, "HH:mm").get("minute"),
                    second: moment(ClassOs.TimeFrom, "HH:mm").get("second"),
                  })
                  .format("DD-MM-YYYY HH:mm") ===
                  moment(x.TimeBegin).format("DD-MM-YYYY HH:mm")
              );
            });

            if (index > -1) {
              ClassInfo = rs[index];
            } else {
              let newObj = {
                ID: 0,
                StockID: ClassOs?.Class?.StockID,
                TimeBegin: ClassOs?.DateFrom
                  ? moment(ClassOs?.DateFrom).format("YYYY-MM-DD HH:mm:ss")
                  : null,
                OrderServiceClassID: ClassOs?.Class?.ID,
                TeacherID: "",
                Member: {
                  Lists: [],
                  Status: "",
                },
                MemberID: 0,
                Desc: "",
              };
              let res = await addMutation.mutateAsync({
                data: {
                  arr: [newObj],
                },
                token: Auth?.token,
              });

              ClassInfo =
                res?.data?.Inserted && res?.data?.Inserted.length > 0
                  ? res?.data?.Inserted[0]
                  : null;
            }

            f7.dialog.close();

            resolve({
              ...ClassInfo,
              Class: ClassOs?.Class,
            });
          }
        );
      });
      ClassInfo = newClassInfo;
    }

    if (ClassInfo) {
      f7router.navigate(
        `/admin/pos/calendar/class-schedule/${
          ClassOs?.Class?.ID
        }/?formState=${JSON.stringify({
          DateFrom: moment(ClassOs?.DateFrom).format("HH:mm DD-MM-YYYY"),
          Class: {
            Title: ClassInfo?.Class?.Title,
            Minutes: ClassInfo?.Class?.Minutes,
            StockID: ClassInfo?.StockID,
          },
        })}`
      );
    }
  };

  return (
    <Page
      className="bg-white"
      name="Pos-class-schedule"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      noToolbar
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
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
        <NavTitle>Lịch lớp học</NavTitle>
        <NavRight className="h-full">
          <Link
            popoverOpen={`.popover-class-filter`}
            noLinkClass
            className="flex items-center justify-center w-12 h-full !text-white"
          >
            <EllipsisVerticalIcon className="w-6" />
          </Link>
          <Popover className={`popover-class-filter w-[170px]`}>
            <div className="flex flex-col py-2">
              <PickerClassScheduleFilter
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
                    className="relative px-4 py-2"
                    noLinkClass
                    popoverClose
                    onClick={open}
                  >
                    <span>Bộ lọc</span>
                  </Link>
                )}
              </PickerClassScheduleFilter>
              <Link
                className="relative px-4 py-2"
                href="/admin/pos/calendar/class-schedule/students/"
                noLinkClass
                popoverClose
              >
                <span>Xem theo học viên</span>
              </Link>
              <Link
                className="relative px-4 py-2"
                href="/admin/pos/calendar/class-schedule/report/"
                noLinkClass
                popoverClose
              >
                <span>Thống kê</span>
              </Link>
              <Link
                className="relative px-4 py-2"
                href="/admin/pos/calendar/class-schedule/request/"
                noLinkClass
                popoverClose
              >
                <span>Danh sách yêu cầu</span>
              </Link>
            </div>
          </Popover>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {isLoading && (
        <div className="p-4">
          {Array(2)
            .fill()
            .map((_, index) => (
              <div
                className="mb-3.5 last:mb-0 border shadow rounded"
                key={index}
              >
                <div className="flex items-center justify-between pl-4 border-b bg-gray-50 h-[46px]">
                  <div className="font-semibold text-[15px] text-primary w-10/12">
                    <div className="w-8/12 h-3 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
                <div className="p-4">
                  {Array(2)
                    .fill()
                    .map((_, i) => (
                      <div
                        className="rounded mb-2 last:mb-0 p-2 bg-[#c6c6c6] h-[85px] animate-pulse"
                        key={i}
                      ></div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
      {!isLoading && (
        <div className="pb-safe-b">
          {data && data.length > 0 && (
            <div className="p-4">
              {data.map((item, index) => (
                <RenderItems
                  key={index}
                  item={item}
                  onOpenClass={onOpenClass}
                  filters={filters}
                />
              ))}
            </div>
          )}
          {(!data || data.length === 0) && (
            <NoFound
              Title="Không có kết quả nào."
              Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
            />
          )}
        </div>
      )}
    </Page>
  );
}

export default PosClassSchedule;

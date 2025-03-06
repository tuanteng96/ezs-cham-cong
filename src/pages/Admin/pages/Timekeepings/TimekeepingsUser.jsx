import React, { Fragment, useEffect, useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  Button,
  f7,
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
  Popover,
  useStore,
} from "framework7-react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "react-query";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import { DatePickerWrap } from "@/partials/forms";
import WorksHelpers from "@/helpers/WorksHelpers";
import { PickerChangeStock } from "./components";
import StringHelpers from "@/helpers/StringHelpers";
import { Controller, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { toast } from "react-toastify";
import PullToRefresh from "react-simple-pull-to-refresh";

function TimekeepingsUser({ f7route }) {
  let { params, query } = f7route;
  //query.FullName
  //query.Month
  //params.MemberID

  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const [filters, setFilters] = useState({
    Month: query?.Month || new Date(),
    StockID: CrStocks?.ID,
    UserID: params?.MemberID,
  });

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      LUONG: 0,
      CONG_CA: 0,
      ID: 0,
    },
  });

  const { isLoading, refetch, data } = useQuery({
    queryKey: ["TimekeepingsSheet", { ...filters, UserID: params?.MemberID }],
    queryFn: async () => {
      const newObj = {
        ...filters,
        From: filters.Month
          ? moment(filters.Month).startOf("month").format("DD/MM/YYYY")
          : "",
        To: filters.Month
          ? moment(filters.Month).endOf("month").format("DD/MM/YYYY")
          : "",
        StockID: filters.StockID ? filters.StockID.ID : "",
        UserID: params?.MemberID,
      };

      const { data } = await AdminAPI.getTimekeepingsSheet({
        data: newObj,
        Token: Auth?.token,
      });
      return data?.list
        ? {
            list: data.list.map((item) => ({
              ...item,
              Dates: item.Dates
                ? item.Dates.map((date) => ({
                    ...date,
                    WorkTrack: date?.WorkTrack
                      ? {
                          ...date?.WorkTrack,
                          Info: date?.WorkTrack?.Info
                            ? {
                                ...date?.WorkTrack?.Info,
                                TimekeepingType:
                                  WorksHelpers.getTimekeepingOption(
                                    date?.WorkTrack?.Info
                                  ).Option,
                                TimekeepingTypeValue:
                                  WorksHelpers.getTimekeepingOption(
                                    date?.WorkTrack?.Info
                                  ).Value,
                                Type: date?.WorkTrack?.Info?.Type
                                  ? {
                                      label:
                                        date?.WorkTrack?.Info?.Type ===
                                        "CA_NHAN"
                                          ? "Việc cá nhân"
                                          : "Việc công ty",
                                      value: date?.WorkTrack?.Info?.Type,
                                    }
                                  : "",
                                Desc: date?.WorkTrack?.Info?.Desc || "",
                                CountWork: date?.WorkTrack?.Info?.CheckOut
                                  ?.WorkToday
                                  ? date?.WorkTrack?.Info?.CheckOut?.WorkToday
                                      ?.Value
                                  : date?.WorkTrack?.Info?.WorkToday?.Value ||
                                    0,
                                CountWorkTime: WorksHelpers.getCountWorkTime({
                                  CheckIn: date?.WorkTrack?.CheckIn,
                                  CheckOut: date?.WorkTrack?.CheckOut,
                                }),
                                Note: date?.WorkTrack?.Info?.Note || "",
                                CheckOut: {
                                  TimekeepingType:
                                    WorksHelpers.getTimekeepingOption(
                                      date?.WorkTrack?.Info?.CheckOut
                                    ).Option,
                                  TimekeepingTypeValue:
                                    WorksHelpers.getTimekeepingOption(
                                      date?.WorkTrack?.Info?.CheckOut
                                    ).Value,
                                  Type: date?.WorkTrack?.Info?.CheckOut?.Type
                                    ? {
                                        label:
                                          date?.WorkTrack?.Info?.CheckOut
                                            ?.Type === "CA_NHAN"
                                            ? "Việc cá nhân"
                                            : "Việc công ty",
                                        value:
                                          date?.WorkTrack?.Info?.CheckOut?.Type,
                                      }
                                    : "",
                                  Desc:
                                    date?.WorkTrack?.Info?.CheckOut?.Desc || "",
                                },
                              }
                            : {
                                TimekeepingType: "",
                                TimekeepingTypeValue: "",
                                Type: "",
                                Desc: "",
                                CountWork: "",
                                Note: "",
                                CheckOut: {
                                  TimekeepingType: "",
                                  TimekeepingTypeValue: "",
                                  Type: "",
                                  Desc: "",
                                },
                              },
                        }
                      : {
                          CheckIn: "",
                          CheckOut: "",
                          Info: {
                            TimekeepingType: "",
                            TimekeepingTypeValue: "",
                            Type: "",
                            Desc: "",
                            CountWork: "",
                            Note: "",
                            CheckOut: {
                              TimekeepingType: "",
                              TimekeepingTypeValue: "",
                              Type: "",
                              Desc: "",
                            },
                          },
                        },
                    isFinish:
                      (item?.End &&
                        item?.End?.Info &&
                        Boolean(item?.End?.Info?.LUONG)) ||
                      false,
                  }))
                : [],
            })),
          }
        : { list: [] };
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data?.list && data.list.length > 0) {
      let { Dates } = data?.list[0];
      let SalaryConfigMons = data?.list[0].SalaryConfigMons[0];

      let TotalPrice = getTotalPrice();
      let TotalCountWork = getTotalCountWork();
      let TotalTimeToHour = getTotalTimeToHour();
      let TotalAllowance = getTotalAllowance();
      if (
        Dates[0].WorkTrack?.Info?.ForDate &&
        Dates[0].WorkTrack?.Info?.LUONG &&
        Dates[0].WorkTrack?.Info?.LUONG !== ""
      ) {
        reset({
          ID: Dates[0].WorkTrack?.ID || 0,
          CreateDate:
            Dates[0].WorkTrack?.Info?.ForDate ||
            moment(Dates[0].Date).format("YYYY-MM-DD"),
          CONG_CA: TotalCountWork,
          THUONG_PHAT: TotalPrice,
          LUONG: Dates[0].WorkTrack?.Info?.LUONG,
        });
      } else if (SalaryConfigMons?.Values?.LUONG) {
        let { Values, DayCount } = SalaryConfigMons;
        let SalaryDay = 0;
        if (Values?.NGAY_CONG) {
          SalaryDay = Values?.LUONG / Values?.NGAY_CONG;
        } else {
          SalaryDay = Values?.LUONG / (DayCount - Values?.NGAY_NGHI);
        }

        reset({
          ...Dates[0].WorkTrack?.Info,
          LUONG: Math.floor(
            TotalCountWork * SalaryDay +
              TotalPrice +
              TotalTimeToHour +
              TotalAllowance
          ),
          CONG_CA: TotalCountWork,
          THUONG_PHAT: TotalPrice,
          ID: Dates[0].WorkTrack?.ID || 0,
          CreateDate: moment(Dates[0].Date).format("YYYY-MM-DD"),
        });
      } else {
        reset({
          LUONG: 0 + TotalPrice + TotalAllowance,
          CONG_CA: TotalCountWork,
          THUONG_PHAT: TotalPrice,
          ID: Dates[0].WorkTrack?.ID || 0,
          CreateDate: moment(Dates[0].Date).format("YYYY-MM-DD"),
        });
      }
    }
  }, [data]);

  const getTotalPrice = () => {
    if (!data?.list || data?.list.length === 0) return 0;

    return data?.list[0].Dates.reduce(
      (n, { WorkTrack }) =>
        n +
        (WorkTrack.Info.TimekeepingTypeValue || 0) +
        (WorkTrack.Info.CheckOut.TimekeepingTypeValue || 0),
      0
    );
  };

  const getTotalCountWork = () => {
    if (!data?.list || data?.list.length === 0) return 0;
    return (
      Math.round(
        data?.list[0].Dates.filter(
          (x) => !x?.WorkTrack?.Info?.WorkToday?.hiddenTime
        ).reduce(
          (n, { WorkTrack }) => n + Number(WorkTrack?.Info?.CountWork || 0),
          0
        ) * 100
      ) / 100
    );
  };

  const getTotalCountWorkTime = () => {
    if (!data?.list || data?.list.length === 0) return 0;
    return (
      Math.round(
        data?.list[0].Dates.reduce(
          (n, { WorkTrack }) => n + Number(WorkTrack?.Info?.CountWorkTime || 0),
          0
        ) * 100
      ) / 100
    );
  };

  const getTotalAllowance = () => {
    if (!data?.list || data?.list.length === 0) return 0;
    let newData = data?.list[0].Dates.filter(
      (x) =>
        x.WorkTrack.Info?.CountWork >=
        (Brand?.Global?.Admin?.phu_cap_ngay_cong || 0.1)
    );
    return (
      newData.length *
      (data?.list[0].SalaryConfigMons[0]?.Values?.TRO_CAP_NGAY || 0)
    );
  };

  const getTotalTimeToHour = () => {
    if (!data?.list || data?.list.length === 0) return 0;
    let newData = data?.list[0].Dates.filter(
      (x) =>
        x?.WorkTrack?.Info?.WorkToday?.hiddenTime &&
        x?.WorkTrack?.CheckIn &&
        x?.WorkTrack?.CheckOut
    );
    let total = 0;
    for (let i of newData) {
      total +=
        i?.WorkTrack?.Info?.WorkToday?.SalaryHours *
        i?.WorkTrack?.Info?.WorkToday?.TotalTime;
    }
    return total;
  };

  const getNoticeHolidays = () => {
    if (!data?.list || data?.list.length === 0) return <></>;
    let newData = data?.list[0].Dates.filter((x) => {
      let date1 = moment(new Date()).format("DD-MM-YYYY");
      let date2 = moment(x.Date, "YYYY-MM-DD").format("DD-MM-YYYY");
      return (
        moment(date1, "DD-MM-YYYY").diff(moment(date2, "DD-MM-YYYY"), "day") >=
        0
      );
    });
    let dataDayOff = newData.filter((x) => !x.WorkTrack.CheckIn);
    let dataT7 = newData.filter(
      (x) => moment(x.Date, "YYYY-MM-DD").format("ddd") === "T7"
    );
    let dataCN = newData.filter(
      (x) => moment(x.Date, "YYYY-MM-DD").format("ddd") === "CN"
    );
    return `Số ngày nghỉ : ${dataDayOff.length} ngày (${dataT7.length} Thứ 7 & ${dataCN.length} CN)`;
  };

  const updateTimeKeepMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.actionInOutTimeKeeping(body);
      await refetch();
      return rs;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang chốt lương ...");
    let { WorkTrack } = data?.list[0].Dates[0];

    let newInfo = WorkTrack?.Info ? { ...WorkTrack?.Info } : {};
    if (newInfo.TimekeepingType) {
      newInfo[newInfo.TimekeepingType.value] = {
        Value: newInfo?.TimekeepingTypeValue
          ? Math.abs(newInfo?.TimekeepingTypeValue)
          : "",
      };
      delete newInfo.TimekeepingType;
    }
    if (newInfo.TimekeepingTypeValue) delete newInfo.TimekeepingTypeValue;
    if (newInfo.CheckOut.TimekeepingType) {
      newInfo.CheckOut[newInfo.CheckOut.TimekeepingType.value] = {
        Value: newInfo.CheckOut?.TimekeepingTypeValue
          ? Math.abs(newInfo.CheckOut?.TimekeepingTypeValue)
          : "",
      };
      delete newInfo.CheckOut.TimekeepingType;
    }
    if (newInfo.CheckOut.TimekeepingTypeValue)
      delete newInfo.CheckOut.TimekeepingTypeValue;
    if (newInfo?.Type) {
      newInfo.Type = newInfo?.Type?.value
        ? newInfo?.Type?.value
        : newInfo?.Type || "";
    }
    if (newInfo?.CheckOut?.Type) {
      newInfo.CheckOut.Type = newInfo?.CheckOut?.Type?.value
        ? newInfo?.CheckOut?.Type?.value
        : newInfo?.CheckOut?.Type || "";
    }

    let newValues = {
      edit: [
        {
          ID: values.ID,
          CreateDate: values.CreateDate,
          UserID: params?.MemberID,
          CheckIn: WorkTrack.CheckIn
            ? moment(WorkTrack.CheckIn).format("YYYY-MM-DD HH:mm:ss")
            : "",
          CheckOut: WorkTrack.CheckOut
            ? moment(WorkTrack.CheckOut).format("YYYY-MM-DD HH:mm:ss")
            : "",
          Info: {
            ...newInfo,
            ForDate: values.CreateDate,
            CONG_CA: values.CONG_CA,
            LUONG: values.LUONG,
            THUONG_PHAT: values.THUONG_PHAT,
          },
        },
      ],
    };
    updateTimeKeepMutation.mutate(
      {
        data: newValues,
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          toast.success("Chốt lương thành công.");
          f7.dialog.close();
        },
        onError: (error) => console.log(error),
      }
    );
  };

  const unLocks = async () => {
    f7.dialog.preloader("Đang chốt lương ...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    let { WorkTrack } = data?.list[0].Dates[0];
    let values = watch();

    let newInfo = WorkTrack?.Info ? { ...WorkTrack?.Info } : {};
    if (newInfo.TimekeepingType) {
      newInfo[newInfo.TimekeepingType.value] = {
        Value: newInfo?.TimekeepingTypeValue
          ? Math.abs(newInfo?.TimekeepingTypeValue)
          : "",
      };
      delete newInfo.TimekeepingType;
    }
    if (newInfo.TimekeepingTypeValue) delete newInfo.TimekeepingTypeValue;
    if (newInfo.CheckOut.TimekeepingType) {
      newInfo.CheckOut[newInfo.CheckOut.TimekeepingType.value] = {
        Value: newInfo.CheckOut?.TimekeepingTypeValue
          ? Math.abs(newInfo.CheckOut?.TimekeepingTypeValue)
          : "",
      };
      delete newInfo.CheckOut.TimekeepingType;
    }
    if (newInfo.CheckOut.TimekeepingTypeValue)
      delete newInfo.CheckOut.TimekeepingTypeValue;
    if (newInfo?.Type) {
      newInfo.Type = newInfo?.Type?.value
        ? newInfo?.Type?.value
        : newInfo?.Type || "";
    }
    if (newInfo?.CheckOut?.Type) {
      newInfo.CheckOut.Type = newInfo?.CheckOut?.Type?.value
        ? newInfo?.CheckOut?.Type?.value
        : newInfo?.CheckOut?.Type || "";
    }
    delete newInfo.LUONG;
    let newValues = {
      edit: [
        {
          ID: values.ID,
          CreateDate: values.CreateDate,
          UserID: params?.MemberID,
          CheckIn: WorkTrack.CheckIn
            ? moment(WorkTrack.CheckIn).format("YYYY-MM-DD HH:mm:ss")
            : "",
          CheckOut: WorkTrack.CheckOut
            ? moment(WorkTrack.CheckOut).format("YYYY-MM-DD HH:mm:ss")
            : "",
          Info: {
            ...newInfo,
            ForDate: values.CreateDate,
            CONG_CA: values.CONG_CA,
            THUONG_PHAT: values.THUONG_PHAT,
          },
        },
      ],
    };

    updateTimeKeepMutation.mutate(
      {
        data: newValues,
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          toast.success("Huỷ lương thành công.");
          f7.dialog.close();
        },
        onError: (error) => console.log(error),
      }
    );
  };

  let LockWage =
    data?.list &&
    data?.list.length > 0 &&
    data?.list[0].Dates[0].WorkTrack?.Info?.LUONG &&
    data?.list[0].Dates[0].WorkTrack?.Info?.ForDate;

  return (
    <Page
      className="!bg-white"
      name="Timekeepings-work-user"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      // ptr
      // onPtrRefresh={(done) => refetch().then(() => done())}
      noSwipeback
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
          <div>{query?.FullName}</div>
          <div className="font-lato text-[12px] tracking-[1px] opacity-90">
            {moment(filters.Month).format("MM/YYYY")}
          </div>
        </NavTitle>
        <NavRight className="h-full">
          <DatePickerWrap
            value={filters.Month}
            format="MM-YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                Month: val,
              }));
            }}
            label="Chọn tháng"
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col h-full pb-safe-b"
      >
        <PullToRefresh
          className="overflow-auto grow ezs-ptr"
          onRefresh={refetch}
        >
          <div className="h-full p-4 overflow-auto">
            {isLoading && (
              <>
                {Array(3)
                  .fill()
                  .map((_, i) => (
                    <div
                      className="border mb-3.5 last:mb-0 p-4 rounded flex items-start"
                      key={i}
                    >
                      <div className="flex-1">
                        <div className="mb-2.5 font-medium text-[15px] text-primary">
                          <div className="w-2/4 h-3.5 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-gray-500">
                          <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-full mb-1"></div>
                          <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12 mb-1"></div>
                          <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </>
            )}
            {data?.list &&
              data?.list.map((user, i) => (
                <Fragment key={i}>
                  <div className="mb-3">{getNoticeHolidays()}</div>
                  {user?.Dates.map((item, index) => (
                    <div
                      className="border rounded mb-3.5 last:mb-0"
                      key={index}
                    >
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <div className="flex justify-between">
                          <div className="text-[15px] font-bold font-lato">
                            {moment(item.Date).format("DD/MM/YYYY")}
                          </div>
                          {item.WorkTrack?.Info?.WorkToday?.Title && (
                            <div className="text-sm capitalize text-muted">
                              {item.WorkTrack?.Info?.WorkToday?.Title} (
                              {item.WorkTrack?.Info?.WorkToday?.TimeFrom ? (
                                <span className="font-lato">
                                  {item.WorkTrack?.Info?.WorkToday?.TimeFrom}
                                  <span className="px-1">-</span>
                                  {item.WorkTrack?.Info?.WorkToday?.TimeTo}
                                </span>
                              ) : (
                                <>Theo giờ</>
                              )}
                              )
                            </div>
                          )}
                        </div>
                        <div>
                          {item.WorkTrack?.StockID ? (
                            <PickerChangeStock user={user} item={item}>
                              {({ open }) => (
                                <div onClick={open}>
                                  {item.WorkTrack?.StockID !== user.StockID ? (
                                    <div className="mt-1 text-sm font-medium cursor-pointer text-danger">
                                      <span className="pr-2">Khác điểm :</span>
                                      {item.WorkTrack?.StockTitle ||
                                        "Không xác định"}
                                    </div>
                                  ) : (
                                    <>
                                      {item.WorkTrack?.CheckIn ? (
                                        <div className="mt-1 text-sm font-medium cursor-pointer text-muted">
                                          Đúng điểm
                                        </div>
                                      ) : (
                                        <></>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </PickerChangeStock>
                          ) : (
                            <></>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="p-4 border-r">
                          <div className="mb-3">
                            <div className="mb-px text-gray-600">Vào</div>
                            <div className="flex items-end justify-between">
                              <div className="font-bold font-lato text-[15px] text-success">
                                {item.WorkTrack.CheckIn
                                  ? moment(item.WorkTrack.CheckIn).format(
                                      "HH:mm:ss"
                                    )
                                  : "--:--:--"}
                              </div>
                              <div className="font-medium">
                                {!item.WorkTrack.Info.TimekeepingType ? (
                                  <></>
                                ) : (
                                  <>
                                    {item.WorkTrack.Info.TimekeepingType
                                      ?.label || ""}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="mb-px text-gray-600">
                              Thưởng / Phạt
                            </div>
                            <div className="font-lato text-[15px] font-bold">
                              {StringHelpers.formatVND(
                                item.WorkTrack.Info.TimekeepingTypeValue
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="mb-px text-gray-600">Lý do</div>
                            <div>
                              {item.WorkTrack.Info.Type?.label || "----"}
                            </div>
                            <div>{item.WorkTrack.Info.Desc}</div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-3">
                            <div className="mb-px text-gray-600">Ra</div>
                            <div className="flex items-end justify-between">
                              <div className="font-bold font-lato text-[15px] text-danger">
                                {item.WorkTrack.CheckOut
                                  ? moment(item.WorkTrack.CheckOut).format(
                                      "HH:mm:ss"
                                    )
                                  : "--:--:--"}
                              </div>
                              <div className="font-medium">
                                {!item.WorkTrack.Info.CheckOut
                                  .TimekeepingType ? (
                                  <></>
                                ) : (
                                  <>
                                    {
                                      item.WorkTrack.Info.CheckOut
                                        .TimekeepingType?.label
                                    }
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="mb-px text-gray-600">
                              Thưởng / Phạt
                            </div>
                            <div className="font-lato text-[15px] font-bold">
                              {StringHelpers.formatVND(
                                item.WorkTrack.Info.CheckOut
                                  ?.TimekeepingTypeValue
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="mb-px text-gray-600">Lý do</div>
                            <div>
                              {item.WorkTrack.Info.CheckOut?.Type?.label ||
                                "----"}
                            </div>
                            <div>{item.WorkTrack.Info.CheckOut?.Desc}</div>
                          </div>
                        </div>
                      </div>
                      {item.WorkTrack.CheckIn || item.WorkTrack.CheckOut ? (
                        <div>
                          <div className="flex justify-between px-4 py-3 border-t">
                            <div>Tổng công</div>
                            <div className="font-lato text-[15px] font-bold">
                              {item.WorkTrack.Info.CountWork}
                            </div>
                          </div>
                          <div className="flex justify-between px-4 py-3 border-t">
                            <div>Số phút làm</div>
                            <div className="font-lato text-[15px] font-bold">
                              {item.WorkTrack.Info.CountWorkTime} (Phút)
                            </div>
                          </div>
                          <div className="flex justify-between px-4 py-3 border-t">
                            <div>Phụ cấp ngày</div>
                            <div className="font-lato text-[15px] font-bold">
                              {item.WorkTrack.Info?.CountWork >=
                              (Brand?.Global?.Admin?.phu_cap_ngay_cong ||
                                0.1) ? (
                                StringHelpers.formatVND(
                                  user?.SalaryConfigMons[0].Values?.TRO_CAP_NGAY
                                )
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                          {item.WorkTrack.Info.Note && (
                            <div className="px-4 py-3 border-t">
                              {item.WorkTrack.Info.Note}
                            </div>
                          )}
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                  ))}
                </Fragment>
              ))}
          </div>
        </PullToRefresh>
        <div className="shadow-2xl">
          <div className="grid grid-cols-1 gap-2 px-4 pt-4">
            <div className="flex justify-between">
              <div className="text-gray-600">Thưởng / Phạt</div>
              <div className="text-[15px] font-lato font-bold">
                {StringHelpers.formatVND(getTotalPrice())}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Số công</div>
              <div className="text-[15px] font-lato font-bold">
                {getTotalCountWork()} ({getTotalCountWorkTime()} phút)
              </div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Phụ cấp ngày</div>
              <div className="text-[15px] font-lato font-bold">
                {StringHelpers.formatVND(getTotalAllowance())}
              </div>
            </div>
          </div>
          <div className="p-4 ">
            {LockWage && <div className="mb-1 text-success">Đã chốt lương</div>}
            <div className="flex gap-3">
              <Controller
                name={`LUONG`}
                control={control}
                render={({ field, fieldState }) => (
                  <div className="relative flex-1">
                    <NumericFormat
                      className={clsx(
                        "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                        fieldState?.invalid
                          ? "border-danger"
                          : "border-[#d5d7da]"
                      )}
                      type="text"
                      autoComplete="off"
                      thousandSeparator={true}
                      placeholder="Nhập lương dự kiến"
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val.floatValue || "");
                      }}
                    />
                    {field.value ? (
                      <div
                        className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                        onClick={() => field.onChange("")}
                      >
                        <XMarkIcon className="w-5" />
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                )}
              />

              <div>
                {LockWage ? (
                  <>
                    <Button
                      type="button"
                      className="px-3 rounded bg-app"
                      fill
                      large
                      preloader
                      popoverOpen={`.popover-timekeeping-user`}
                    >
                      Cập nhật
                      <ChevronUpIcon className="w-5 ml-1" />
                    </Button>
                    <Popover
                      className={clsx("w-[150px]", `popover-timekeeping-user`)}
                    >
                      <div className="flex flex-col py-2">
                        <Link
                          popoverClose
                          className="flex justify-between px-3 py-3.5 font-medium border-b text-primary"
                          noLinkClass
                          onClick={(e) => handleSubmit(onSubmit)(e)}
                        >
                          Lưu thay đổi
                        </Link>
                        <Link
                          popoverClose
                          className="flex justify-between px-3 py-3.5 font-medium text-danger"
                          noLinkClass
                          onClick={() => unLocks()}
                        >
                          Huỷ chốt lương
                        </Link>
                      </div>
                    </Popover>
                  </>
                ) : (
                  <Button
                    type="submit"
                    className="px-3 rounded bg-app"
                    fill
                    large
                    preloader
                    loading={updateTimeKeepMutation.isLoading}
                    disabled={updateTimeKeepMutation.isLoading}
                  >
                    Chốt lương
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Page>
  );
}

export default TimekeepingsUser;

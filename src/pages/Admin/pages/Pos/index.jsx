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
import React, { useEffect, useRef, useState } from "react";
import {
  AdjustmentsVerticalIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import AdminAPI from "@/api/Admin.api";
import moment from "moment";
import { useQuery } from "react-query";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { DatePickerWrap } from "@/partials/forms";
import clsx from "clsx";
import { PickerFilter } from "./components";
import ConfigsAPI from "@/api/Configs.api";
import DateTimeHelpers from "@/helpers/DateTimeHelpers";

const getQueryParams = (queryConfig) => {
  let params = {
    ...queryConfig,
    From: moment(moment(queryConfig.day, "YYYY-MM-DD")),
    To: moment(moment(queryConfig.day, "YYYY-MM-DD")),
    MemberIDs: queryConfig?.MemberIDs
      ? queryConfig?.MemberIDs.map((x) => x.value).toString()
      : "",
    UserIDs: queryConfig?.UserIDs
      ? queryConfig?.UserIDs.map((x) => x.value).toString()
      : "",
    StatusAtHome: queryConfig?.StatusAtHome?.value || "",
    StatusBook: queryConfig?.StatusBook?.value || "",
    StatusMember: queryConfig?.StatusMember?.value || "",
    Tags: queryConfig?.Tags?.value || "",
  };
  switch (queryConfig.view) {
    default:
      params.From = params.From.format("YYYY-MM-DD");
      params.To = params.To.format("YYYY-MM-DD");
  }

  return params;
};

const getStatusClass = (Status, item) => {
  const isAuto =
    item?.Desc && item.Desc.toUpperCase().indexOf("TỰ ĐỘNG ĐẶT LỊCH");
  if (Status === "XAC_NHAN") {
    if (isAuto !== "" && isAuto > -1) return "primary-2";
    return "primary";
  }
  if (Status === "CHUA_XAC_NHAN") {
    return "warning";
  }
  if (Status === "KHACH_KHONG_DEN") {
    return "danger";
  }
  if (Status === "KHACH_DEN") {
    return "info";
  }
  if (Status === "doing") {
    return "success";
  }
  if (Status === "done") {
    return "secondary";
  }
};

const checkStar = (item) => {
  if (item?.Member?.MobilePhone !== "0000000000") return "";
  if (item?.Member?.MobilePhone === "0000000000" && item?.IsNew) return "**";
  else {
    return "*";
  }
};

let Views = [
  { Title: "Xem theo ngày", Key: "timeGridDay" },
  { Title: "Xem theo danh sách", Key: "listWeek" },
  {
    Title: "Theo nhân viên",
    Key: "resourceTimeGridDay",
  },
  {
    Title: "Xem theo phòng",
    Key: "resourceTimelineDay",
  },
];

const viLocales = {
  code: "vi",
  week: {
    dow: 0, // Sunday is the first day of the week.
    doy: 6, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: "Tháng trước",
    next: "Tháng sau",
    today: "Hôm nay",
    month: "Tháng",
    week: "Tuần",
    day: "Ngày",
    list: "Danh sách",
    timeGridWeek: "Tuần",
  },
  weekText: "Sm",
  allDayText: "Cả ngày",
  moreLinkText: "Xem thêm",
  noEventsText: "Không có dữ liệu",
};

function PosAdmin({ f7router }) {
  let CrStocks = useStore("CrStocks");
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let Stocks = useStore("Stocks");

  const getViewCalendar = () => {
    if (Brand?.Global?.Admin?.PosActiveCalendar) {
      let index = Views.findIndex(
        (x) => x.Key === Brand?.Global?.Admin?.PosActiveCalendar
      );
      if (index > -1) {
        return Views[index].Key;
      }
    }
    return "timeGridDay";
  };

  const [filters, setFilters] = useState({
    view: getViewCalendar(),
    day: moment().toDate(),
    StockID: CrStocks?.ID || 0,
    MemberIDs: "",
    UserIDs: "",
    status: [
      "XAC_NHAN",
      "XAC_NHAN_TU_DONG",
      "CHUA_XAC_NHAN",
      ...(!Brand?.Global?.Admin?.isAdminBooks ? ["DANG_THUC_HIEN"] : []),
      ...(Brand?.Global?.Admin?.PosStatus
        ? [...Brand?.Global?.Admin?.PosStatus]
        : []),
    ].toString(),
    StatusAtHome: "",
    StatusBook: "",
    StatusMember: "",
    Token: Auth?.token,
  });

  const [TimeOpen, setTimeOpen] = useState(
    Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00"
  );
  const [TimeClose, setTimeClose] = useState(
    Brand?.Global?.APP?.Working?.TimeClose || "23:59:00"
  );

  const calendarRef = useRef("");

  useEffect(() => {
    let index = Stocks ? Stocks.findIndex((x) => x.ID === CrStocks?.ID) : -1;
    if (index > -1) {
      let StockTimes = Stocks[index].KeySEO;
      if (StockTimes) {
        let TimesObj = DateTimeHelpers.formatTimeOpenClose({
          Text: StockTimes,
          InitialTime: {
            TimeOpen: Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00",
            TimeClose: Brand?.Global?.APP?.Working?.TimeClose || "23:59:00",
          },
          Date: moment(filters.day).format("DD-MM-YYYY"),
        });

        let newTimeOpen = moment(TimesObj.TimeOpen, "HH:mm:ss");
        setTimeOpen(
          moment()
            .set({
              hour: newTimeOpen.get("hour"),
              minute: newTimeOpen.get("minute"),
              second: newTimeOpen.get("second"),
            })
            .subtract(TimesObj?.TimeAdd || 0, "minutes")
            .format("HH:mm:ss")
        );
        let newTimeClose = moment(TimesObj.TimeClose, "HH:mm:ss");
        setTimeClose(
          moment()
            .set({
              hour: newTimeClose.get("hour"),
              minute: newTimeClose.get("minute"),
              second: newTimeClose.get("second"),
            })
            .add(TimesObj?.TimeAdd || 0, "minutes")
            .format("HH:mm:ss")
        );
      } else {
        setTimeOpen(Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00");
        setTimeClose(Brand?.Global?.APP?.Working?.TimeClose || "23:59:00");
      }
    } else {
      setTimeOpen(Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00");
      setTimeClose(Brand?.Global?.APP?.Working?.TimeClose || "23:59:00");
    }
  }, [CrStocks, Stocks, filters.day]);

  useEffect(() => {
    if (calendarRef?.current?.getApi()) {
      setTimeout(() => {
        let calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(filters.view);
      });
    }
  }, [calendarRef, filters.view]);

  useEffect(() => {
    if (calendarRef?.current?.getApi()) {
      let calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(filters.day);
    }
  }, [calendarRef, filters.day]);

  const SettingCalendar = useQuery({
    queryKey: ["SettingCalendar", CrStocks],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`ArticleRel`);
      let rs = {
        Tags: "",
        OriginalServices: [],
      };
      if (data?.data && data?.data.length > 0) {
        const result = JSON.parse(data?.data[0].Value);

        if (result) {
          rs = result;
        }
      }
      return rs;
    },
    initialData: {
      Tags: "",
      OriginalServices: [],
    },
  });

  const CalendarBookings = useQuery({
    queryKey: ["CalendarBookings", filters],
    queryFn: async () => {
      const { data } = await AdminAPI.calendarBookings({
        ...getQueryParams(filters),
      });

      let dataBooks =
        data.books && Array.isArray(data.books)
          ? data.books
              .map((item) => {
                let TreatmentJson = item?.TreatmentJson
                  ? JSON.parse(item?.TreatmentJson)
                  : "";

                return {
                  ...item,
                  start: item.BookDate,
                  end: moment(item.BookDate)
                    .add(item.RootMinutes ?? 60, "minutes")
                    .toDate(),
                  title: item.RootTitles,
                  className: `fc-${getStatusClass(
                    item.Status,
                    item
                  )} shadow-lg rounded !mt-0 !ml-0 !mr-0 px-3 py-1.5 text-white`,
                  resourceIds:
                    filters.view === "resourceTimelineDay"
                      ? [TreatmentJson?.ID || TreatmentJson?.value || 0]
                      : item.UserServices &&
                        Array.isArray(item.UserServices) &&
                        item.UserServices.length > 0
                      ? item.UserServices.map((item) => item.ID)
                      : [0],
                  MemberCurrent: {
                    FullName:
                      item?.IsAnonymous ||
                      item.Member?.MobilePhone === "0000000000"
                        ? item?.FullName
                        : item?.Member?.FullName,
                    MobilePhone:
                      item?.IsAnonymous ||
                      item.Member?.MobilePhone === "0000000000"
                        ? item?.Phone
                        : item?.Member?.MobilePhone,
                  },
                  Star: checkStar(item),
                  isBook: true,
                  MemberPhone: item?.MemberPhone || null,
                };
              })
              .filter((item) => item.Status !== "TU_CHOI")
          : [];
      let dataBooksAuto =
        data.osList && Array.isArray(data.osList)
          ? data.osList.map((item) => ({
              ...item,
              AtHome: false,
              Member: item.member,
              MemberCurrent: {
                FullName: item?.member?.FullName,
                MobilePhone: item?.member?.MobilePhone,
              },
              start: item.os.BookDate,
              end: moment(item.os.BookDate)
                .add(item.os.RootMinutes ?? 60, "minutes")
                .toDate(),
              BookDate: item.os.BookDate,
              title: item.os.Title,
              RootTitles: item.os.ProdService2 || item.os.ProdService,
              className: `fc-${getStatusClass(
                item.os.Status,
                item
              )} shadow-lg rounded !mt-0 !ml-0 !mr-0 p-3 py-1.5 text-white`,
              resourceIds:
                filters.view === "resourceTimelineDay"
                  ? [item?.os?.RoomID || 0]
                  : item.staffs &&
                    Array.isArray(item.staffs) &&
                    item.staffs.length > 0
                  ? item.staffs.map((staf) => staf.ID)
                  : [0],
            }))
          : [];

      let dataOffline = [];

      if (filters.view === "resourceTimeGridDay") {
        dataBooks = dataBooks.filter(
          (x) =>
            dataBooksAuto.findIndex((o) => o?.Member?.ID === x?.Member?.ID) ===
            -1
        );

        dataOffline =
          data?.dayOffs && data?.dayOffs.length > 0
            ? data?.dayOffs.map((item) => ({
                start: item.From,
                end: item.To,
                resourceIds: [item.UserID],
                display: "background",
                extendedProps: {
                  noEvent: true,
                },
                className: ["fc-no-event"],
              }))
            : [];
        if (data?.userOffs && data?.userOffs.length > 0) {
          for (let useroff of data?.userOffs) {
            if (useroff.dayList && useroff.dayList.length > 0) {
              let i = useroff.dayList.findIndex(
                (x) =>
                  moment(x.Day).format("DD-MM-YYYY") ===
                  moment(filters.From).format("DD-MM-YYYY")
              );
              if (i > -1) {
                let { off } = useroff.dayList[i];
                if (off) {
                  if (off.isOff) {
                    dataOffline.push({
                      start: moment(filters.From)
                        .set({
                          hour: moment(TimeOpen, "HH:mm").get("hour"),
                          minute: moment(TimeOpen, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      end: moment(filters.To)
                        .set({
                          hour: moment(TimeClose, "HH:mm").get("hour"),
                          minute: moment(TimeClose, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      resourceIds: [useroff.user.ID],
                      display: "background",
                      extendedProps: {
                        noEvent: true,
                      },
                      className: ["fc-no-event"],
                    });
                  } else {
                    dataOffline.push({
                      start: moment(filters.From)
                        .set({
                          hour: moment(TimeOpen).get("hour"),
                          minute: moment(TimeOpen).get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      end: moment(filters.To)
                        .set({
                          hour: moment(off.TimeFrom, "HH:mm").get("hour"),
                          minute: moment(off.TimeFrom, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      resourceIds: [useroff.user.ID],
                      display: "background",
                      extendedProps: {
                        noEvent: true,
                      },
                      className: ["fc-no-event"],
                    });
                    dataOffline.push({
                      start: moment(filters.From)
                        .set({
                          hour: moment(off.TimeTo, "HH:mm").get("hour"),
                          minute: moment(off.TimeTo, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      end: moment(filters.To)
                        .set({
                          hour: moment(TimeClose, "HH:mm").get("hour"),
                          minute: moment(TimeClose, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      resourceIds: [useroff.user.ID],
                      display: "background",
                      extendedProps: {
                        noEvent: true,
                      },
                      className: ["fc-no-event"],
                    });
                  }
                }
              }
            }
          }
        }
      }

      return {
        data: [...dataBooks, ...dataBooksAuto, ...dataOffline],
      };
    },
  });

  const ResourcesBookings = useQuery({
    queryKey: ["ResourcesBookings", { CrStocks, Auth }],
    queryFn: async () => {
      const { data } = await AdminAPI.listMembersBooking({
        StockID: CrStocks?.ID,
        All: 1,
        Key: "",
        Token: Auth?.token,
      });
      const newData =
        Array.isArray(data?.data) && data?.data.length > 0
          ? data?.data.map((item) => ({
              ...item,
              id: item.id,
              title: item.text,
              order: item?.source?.Order || 0
            }))
          : [];
      return [{ id: 0, title: "Chưa chọn nhân viên", order: 0 }, ...newData];
    },
    //enabled: filters.view === "resourceTimeGridDay",
  });

  const ListRooms = useQuery({
    queryKey: ["ListRoomsBookings", CrStocks],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`room`);
      let rs = [
        {
          RoomTitle: "Room Trống",
          id: 0,
          title: "Room",
        },
      ];
      if (data?.data && data?.data.length > 0) {
        const result = JSON.parse(data?.data[0].Value);

        let indexStock = result.findIndex((x) => x.StockID === CrStocks?.ID);
        if (indexStock > -1 && result[indexStock]) {
          if (
            result[indexStock].ListRooms &&
            result[indexStock].ListRooms.length > 0
          ) {
            for (let Room of result[indexStock].ListRooms) {
              if (Room.Children && Room.Children.length > 0) {
                for (let cls of Room.Children) {
                  rs.push({
                    ...cls,
                    RoomTitle: Room.label,
                    title: cls.label,
                    id: cls.ID,
                  });
                }
              }
            }
          }
        }
      }
      return rs || [];
    },
    //enabled: filters.view === "resourceTimelineDay",
  });

  useEffect(() => {
    const el = calendarRef?.current?.elRef?.current;

    if (!el) return;

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchMoveEnd, { passive: false });

    function handleTouchMove(e) {
      console.log(e);
      //if (!CalendarBookings?.isLoading) CalendarBookings.refetch();
    }

    function handleTouchMoveEnd(e) {
      console.log("end");
    }

    return () => {
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [calendarRef]);

  return (
    <Page
      className="bg-white"
      name="PosAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      // ptr
      // onPtrRefresh={(done) => CalendarBookings.refetch().then(() => done())}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            popoverOpen=".popover-setting-pos"
          >
            <Cog6ToothIcon className="w-6" />
          </Link>
          <Popover className="popover-setting-pos w-[220px]">
            <div className="py-3">
              <div className="flex flex-col pb-2 mb-2 border-b">
                {Views.map((view, index) => (
                  <Link
                    className={clsx(
                      "relative px-4 py-2 flex",
                      filters.view === view.Key && "text-app"
                    )}
                    noLinkClass
                    popoverClose
                    key={index}
                    onClick={() =>
                      setFilters((prevState) => ({
                        ...prevState,
                        view: view.Key,
                      }))
                    }
                  >
                    <span>{view.Title}</span>
                    <EyeIcon
                      className={clsx(
                        "w-5 ml-2",
                        filters.view === view.Key ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </Link>
                ))}
              </div>
              <div className="flex flex-col pb-2 mb-2 border-b">
                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/setting/"
                  popoverClose
                >
                  <span>Cài đặt bảng lịch</span>
                </Link>
                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/locks/"
                  popoverClose
                >
                  <span>Cài đặt khoá lịch</span>
                </Link>
                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/rooms/"
                  popoverClose
                >
                  <span>Cài đặt phòng</span>
                </Link>
              </div>
              <div className="flex flex-col">
                {Brand?.Global?.Admin?.lop_hoc_pt && (
                  <Link
                    className="relative px-4 py-2"
                    noLinkClass
                    href="/admin/pos/calendar/class-schedule/"
                    popoverClose
                  >
                    <span>Lịch lớp học</span>
                  </Link>
                )}

                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/care-schedule/"
                  popoverClose
                >
                  <span>Lịch chăm sóc</span>
                </Link>
              </div>
            </div>
          </Popover>
        </NavLeft>
        <NavTitle>
          <DatePickerWrap
            value={filters.day}
            format="DD/MM/YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                day: val,
              }));
            }}
            label="Chọn ngày"
          >
            {({ open }) => (
              <div
                className="flex items-center justify-center h-full font-medium text-[15px   ]"
                onClick={open}
              >
                {moment(filters.day).format("ddd, [Ngày] DD [T]MM YYYY")}
                <ChevronDownIcon className="w-5 ml-1.5" />
              </div>
            )}
          </DatePickerWrap>
        </NavTitle>
        <NavRight className="h-full">
          <PickerFilter
            initialValues={filters}
            TagsList={
              SettingCalendar?.data?.Tags
                ? SettingCalendar?.data?.Tags.split(",").map((x) => ({
                    label: x,
                    value: x,
                  }))
                : []
            }
            onChange={(values) =>
              setFilters((prevState) => ({ ...prevState, ...values }))
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
      <div className="relative h-full">
        <FullCalendar
          firstDay={1}
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
          themeSystem="unthemed"
          locale={viLocales}
          headerToolbar={false}
          plugins={[
            timeGridPlugin,
            resourceTimeGridPlugin,
            resourceTimelinePlugin,
            scrollGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          initialDate={filters.day}
          initialView={filters.view}
          handleWindowResize={true}
          aspectRatio="3"
          editable={false}
          navLinks={true}
          ref={calendarRef}
          events={CalendarBookings?.data?.data || []}
          resources={
            filters.view === "resourceTimelineDay"
              ? ListRooms?.data || []
              : ResourcesBookings?.data || []
          }
          resourceGroupField="RoomTitle"
          resourceOrder={filters?.view === "resourceTimelineDay" ? "title" : "order,id"}
          views={{
            timeGridDay: {
              allDaySlot: false,
              eventMaxStack: 4,
              slotLabelContent: ({ date, text }) => {
                return (
                  <>
                    <div className="text-[13px] w-full text-center font-medium pt-1 px-[3px]">
                      {moment(date).format("HH:mm")}
                    </div>
                  </>
                );
              },
              dayHeaderContent: ({ date, isToday, ...arg }) => {
                return (
                  <>
                    <div className="mb-1 text-sm">
                      {moment(date).format("ddd")}
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-primary">
                      {moment(date).format("DD")}
                    </div>
                  </>
                );
              },
              dayHeaders: false,
              nowIndicator: true,
              now: moment(new Date()).format("YYYY-MM-DD HH:mm"),
              scrollTime: moment(new Date()).format("HH:mm"),
              slotMinWidth: "45",
              dateClick: ({ date }) => {
                f7.views.main.router.navigate(
                  "/admin/pos/calendar/add/?BookDate=" + date
                );
              },
              slotMinTime: TimeOpen,
              slotMaxTime: TimeClose,
            },
            listWeek: {},
            resourceTimeGridDay: {
              dayMinWidth: 200,
              allDaySlot: false,
              type: "resourceTimeline",
              nowIndicator: true,
              now: moment(new Date()).format("YYYY-MM-DD HH:mm"),
              scrollTime: moment(new Date()).format("HH:mm"),
              resourceAreaWidth: "200px",
              stickyHeaderDates: true,
              slotMinTime: TimeOpen,
              slotMaxTime: TimeClose,
              buttonText: "Nhân viên",
              resourceAreaHeaderContent: () => "Nhân viên",
              resourceLabelContent: ({ resource }) => {
                return (
                  <>
                    <div className="py-1.5 capitalize text-primary">
                      {resource._resource.title}
                    </div>
                  </>
                );
              },
              slotLabelContent: ({ date, text }) => {
                return (
                  <>
                    <div className="text-[13px] w-full text-center font-medium pt-1 px-[3px]">
                      {moment(date).format("HH:mm")}
                    </div>
                  </>
                );
              },
              dateClick: ({ resource, jsEvent, date }) => {
                if (jsEvent.target.classList.contains("fc-no-event")) return;
                if (resource._resource?.id) {
                  f7.views.main.router.navigate(
                    "/admin/pos/calendar/add/?resource=" +
                      JSON.stringify({
                        label: resource._resource?.title,
                        value: resource._resource?.id,
                      }) +
                      "&BookDate=" +
                      date
                  );
                }
              },
            },
            resourceTimelineDay: {
              type: "resourceTimelineDay",
              nowIndicator: true,
              now: moment(new Date()).format("YYYY-MM-DD HH:mm"),
              scrollTime: moment(new Date()).format("HH:mm"),
              resourceAreaWidth: "100px",
              slotMinWidth: 50,
              stickyHeaderDates: true,
              slotMinTime: TimeOpen,
              slotMaxTime: TimeClose,
              buttonText: "Phòng",
              resourceAreaHeaderContent: () => "Phòng",
              slotLabelContent: ({ date, text }) => {
                return (
                  <>
                    <span className="text-primary">
                      {moment(date).format("HH:mm")}
                    </span>
                  </>
                );
              },
            },
          }}
          eventContent={(arg) => {
            const { event, view } = arg;
            const { extendedProps } = event._def;
            let italicEl = document.createElement("div");
            italicEl.classList.add("fc-content");
            
            if (
              typeof extendedProps !== "object" ||
              Object.keys(extendedProps).length > 0
            ) {
              if (view.type !== "listWeek") {
                if (!extendedProps.noEvent) {
                  italicEl.innerHTML = `
              <div class="fc-title">
                <div class="flex">
                  ${
                    extendedProps?.AtHome
                      ? `<div class="mr-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>`
                      : ""
                  }
                  <div class="truncate max-w-2/4 capitalize">
                    ${
                      extendedProps?.Star
                        ? `<span class="pr-[2px]">(${extendedProps?.Star})</span>`
                        : ""
                    }
                    ${
                      extendedProps?.MemberCurrent?.FullName ||
                      "Chưa xác định tên"
                    }
                  </div>
                  <div class="px-[3px]">-</div>
                  <div class="truncate">${
                    extendedProps?.MemberCurrent?.MobilePhone ||
                    "Chưa xác định số"
                  }</div>
                </div>
                <div class="flex items-center">
                  <div>
                    ${moment(extendedProps?.BookDate).format("HH:mm")}
                  </div>
                  <div class="px-[3px]">-</div>
                  <div class="truncate capitalize pr-1">${
                    extendedProps.RootTitles || "Chưa chọn dịch vụ"
                  }</div>
                  <div class="flex">
                    (<span>${extendedProps?.BookCount?.Done || 0}</span>
                    <span class="px2">/</span>
                    <span>${extendedProps?.BookCount?.Total || 0}</span>)
                  </div>
                </div>
              </div>`;
                }
              } else {
                italicEl.innerHTML = `<div class="fc-title">
                    <div><span class="fullname">${
                      extendedProps?.AtHome
                        ? `<i class="fas fa-home font-size-xs"></i>`
                        : ""
                    } ${
                  extendedProps?.Star ? `(${extendedProps?.Star})` : ""
                } ${
                  extendedProps?.MemberCurrent?.FullName || "Chưa xác định tên"
                }</span><span class="d-none d-md-inline"> - ${
                  extendedProps?.MemberCurrent?.MobilePhone ||
                  "Chưa xác định số"
                }</span> 
              <div class="flex${filters.view === "listWeek" ? " flex-col" : ""}">
                <div class="${filters.view !== "listWeek" ? 'truncate ' : ''}capitalize">${
                  extendedProps.RootTitles || "Chưa chọn dịch vụ"
                }</div>
                ${
                  filters.view === "listWeek" ? `<span class="${!extendedProps?.isBook && "d-none"} pl-1">(${
                  extendedProps?.BookCount?.Done || 0
                }/${extendedProps?.BookCount?.Total || 0})</span>` : `<span class="${!extendedProps?.isBook && "d-none"} pl-1">- ${
                  extendedProps?.BookCount?.Done || 0
                }/${extendedProps?.BookCount?.Total || 0}</span>`
                }
              
              </div>
            </div>
            </div>`;
              }
            } else {
              italicEl.innerHTML = `<div>Chưa có lịch.</div>`;
            }
            let arrayOfDomNodes = [italicEl];
            return {
              domNodes: arrayOfDomNodes,
            };
          }}
          eventClick={({ event, el }) => {
            const { _def } = event;
            const { extendedProps } = _def;

            if (extendedProps?.os) {
              f7.views.main.router.navigate(
                "/admin/pos/calendar/os/?formState=" +
                  encodeURIComponent(
                    JSON.stringify({
                      Os: {
                        ID: extendedProps.os?.ID,
                        MemberID: extendedProps.os?.MemberID || "",
                        ProdService: extendedProps.os?.ProdService || "",
                        ProdService2: extendedProps.os?.ProdService2 || "",
                        Title: extendedProps.os?.Title || "",
                      },
                    })
                  )
              );
            } else {
              if (!extendedProps.noEvent) {
                f7.views.main.router.navigate(
                  "/admin/pos/calendar/add/?formState=" +
                    encodeURIComponent(
                      JSON.stringify({
                        ...extendedProps,
                        Member: {
                          FullName: extendedProps?.Member?.FullName,
                          MobilePhone: extendedProps.Member?.MobilePhone,
                          ID: extendedProps.Member?.ID,
                        },
                        Roots: extendedProps.Roots
                          ? extendedProps.Roots.map((x) => ({
                              Title: x.Title,
                              ID: x.ID,
                            }))
                          : [],
                      })
                    )
                );
              }
            }
          }}
          //   eventDidMount={(el) => {
          //     console.log(el);
          //   }}
          datesSet={({ view, start, ...arg }) => {}}
        />

        <div
          role="status"
          className={clsx(
            "absolute left-0 flex items-center justify-center w-full transition h-full top-0 z-10 bg-white/50",
            !CalendarBookings.isLoading &&
              !CalendarBookings.isRefetching &&
              "hidden"
          )}
        >
          <svg
            aria-hidden="true"
            className="w-8 h-8 mr-2 text-gray-300 animate-spin dark:text-gray-600 fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="fill-muted"
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </Page>
  );
}

export default PosAdmin;

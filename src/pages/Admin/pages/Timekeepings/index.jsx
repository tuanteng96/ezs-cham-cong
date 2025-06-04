import React, { useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  f7,
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
  Popover,
  Toolbar,
  useStore,
} from "framework7-react";
import {
  AdjustmentsVerticalIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ChevronLeftIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import {
  PickerChangeStock,
  PickerFilter,
  PickerJobType,
  PickerMachine,
  PickerTimekeeping,
} from "./components";
import { useMutation, useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import WorksHelpers from "@/helpers/WorksHelpers";
import moment from "moment";
import clsx from "clsx";
import { toast } from "react-toastify";

function Timekeepings({ f7route }) {
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const CrStocks = useStore("CrStocks");

  const [filters, setFilters] = useState({
    StockID: CrStocks
      ? { ...CrStocks, label: CrStocks?.Title, value: CrStocks?.ID }
      : "",
    Key: "",
    UserID: "",
    CrDate: new Date(),
  });
  const [ActiveIndex, setActiveIndex] = useState(0);

  const { isLoading, isFetching, refetch, data } = useQuery({
    queryKey: ["TimekeepingsSheet", filters],
    queryFn: async () => {
      const newObj = {
        From: filters.CrDate ? moment(filters.CrDate).format("DD/MM/YYYY") : "",
        To: filters.CrDate ? moment(filters.CrDate).format("DD/MM/YYYY") : "",
        StockID: filters.StockID ? filters.StockID.value : "",
        Key: filters.UserID ? filters.UserID?.value : "",
        //UserID: filters.UserID ? filters.UserID?.value : ''
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
                                  WorksHelpers.getTimekeepingType(
                                    date?.WorkTrack?.Info
                                  ).Option,
                                TimekeepingTypeValue:
                                  WorksHelpers.getTimekeepingType(
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
                                Note: date?.WorkTrack?.Info?.Note || "",
                                CheckOut: {
                                  TimekeepingType:
                                    WorksHelpers.getTimekeepingType(
                                      date?.WorkTrack?.Info?.CheckOut
                                    ).Option,
                                  TimekeepingTypeValue:
                                    WorksHelpers.getTimekeepingType(
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
    //enabled: Boolean(filters.StockID && filters.From && filters.To),
    keepPreviousData: true,
  });

  const resetMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.resetPwdMember(body);
      await refetch();
      return data;
    },
  });

  const onResetPwd = (user) => {
    f7.dialog.confirm(
      "Mật khẩu sẽ tự động thay đổi về 1234.",
      "Reset mật khẩu",
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        resetMutation.mutate(
          {
            data: {
              reset: [
                {
                  UserName: user.UserName,
                  Password: "1234",
                },
              ],
            },
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success("Reset mật khẩu thành công");
            },
          }
        );
      }
    );
  };

  return (
    <Page
      className="!bg-white"
      name="Timekeepings"
      //noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
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
        <NavTitle>
          Chấm công ngày {moment(filters.CrDate).format("DD/MM")}
        </NavTitle>
        <NavRight className="h-full">
          <PickerFilter
            initialValues={filters}
            onChange={(values) => setFilters(values)}
          >
            {({ open }) => (
              <Link
                onClick={open}
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </Link>
            )}
          </PickerFilter>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="p-4">
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
          data.list.map((user, index) => (
            <PickerTimekeeping user={user} filters={filters} key={index}>
              {({ open: opens }) => (
                <div className="border rounded mb-3.5 last:mb-0">
                  <div className="flex bg-gray-200 border-b">
                    <Link
                      href={`/admin/timekeepings/${user?.UserID}/?FullName=${user?.FullName}&Month=${filters.CrDate}`}
                      className="flex-1 py-3.5 pl-4 flex-col items-start"
                    >
                      <div className="mb-px text-base font-medium text-primary">
                        {user?.FullName}{" "}
                        <span className="pl-1 font-normal text-gray-500 text-[15px]">
                          ({user?.UserName})
                        </span>
                      </div>
                      {/* <div className="text-gray-500">{user?.UserName}</div> */}
                    </Link>
                    <Link
                      noLinkClass
                      className="flex items-center justify-center w-12"
                      popoverOpen={`.popover-sheet-${user.UserID}`}
                    >
                      <EllipsisHorizontalIcon className="w-6" />
                    </Link>
                    <Popover
                      className={clsx(
                        "w-[220px]",
                        `popover-sheet-${user.UserID}`
                      )}
                    >
                      <div className="flex flex-col py-2">
                        <Link
                          popoverClose
                          className="flex justify-between px-3 py-2.5 font-medium"
                          noLinkClass
                          onClick={opens}
                        >
                          Chấm công, chỉnh sửa
                        </Link>
                        <Link
                          href={`/admin/timekeepings/${user?.UserID}/?FullName=${user?.FullName}&Month=${filters.CrDate}`}
                          popoverClose
                          className="flex justify-between px-3 py-2.5 font-medium"
                          noLinkClass
                        >
                          Xem chấm công tháng
                        </Link>
                        <PickerJobType user={user}>
                          {({ open }) => (
                            <Link
                              popoverClose
                              className="flex justify-between px-3 py-2.5 font-medium"
                              noLinkClass
                              onClick={open}
                            >
                              Loại công ca / lương giờ
                            </Link>
                          )}
                        </PickerJobType>
                        <PickerMachine user={user}>
                          {({ open }) => (
                            <Link
                              popoverClose
                              className="flex justify-between px-3 py-2.5 font-medium"
                              noLinkClass
                              onClick={open}
                            >
                              Đổi điện thoại chấm công
                            </Link>
                          )}
                        </PickerMachine>

                        <Link
                          popoverClose
                          className="flex justify-between px-3 py-2.5 font-medium"
                          noLinkClass
                          onClick={() => onResetPwd(user)}
                        >
                          Đổi mật khẩu
                        </Link>
                      </div>
                    </Popover>
                  </div>
                  {user.Dates &&
                    user.Dates.map((item, i) => (
                      <div className="p-4" key={i} onClick={opens}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 pr-4">
                            <div>
                              {item.WorkTrack?.StockID && (
                                <PickerChangeStock user={user} item={item}>
                                  {({ open }) => (
                                    <div
                                      className="mb-px"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        open();
                                      }}
                                    >
                                      {item.WorkTrack?.StockID !==
                                      user.StockID ? (
                                        <div className="flex items-center text-sm opacity-75 cursor-pointer">
                                          <span className="pr-1">Tại</span>
                                          {item.WorkTrack?.StockTitle ||
                                            "Không xác định"}
                                          <ExclamationTriangleIcon className="w-5 ml-1.5 text-danger" />
                                        </div>
                                      ) : (
                                        <>
                                          {item.WorkTrack?.CheckIn ? (
                                            <div className="flex items-center text-sm opacity-75 cursor-pointer">
                                              <span className="pr-1">Tại</span>
                                              {item.WorkTrack?.StockTitle ||
                                                "Không xác định"}
                                            </div>
                                          ) : (
                                            <></>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </PickerChangeStock>
                              )}
                              {item.WorkTrack?.Info?.WorkToday?.Title && (
                                <div className="text-sm capitalize text-muted">
                                  {item.WorkTrack?.Info?.WorkToday?.Title} (
                                  {item.WorkTrack?.Info?.WorkToday?.TimeFrom ? (
                                    <span className="font-lato">
                                      {
                                        item.WorkTrack?.Info?.WorkToday
                                          ?.TimeFrom
                                      }
                                      <span className="px-1">-</span>
                                      {item.WorkTrack?.Info?.WorkToday?.TimeTo}
                                    </span>
                                  ) : (
                                    <>Theo giờ</>
                                  )}
                                  )
                                </div>
                              )}
                              {!item.WorkTrack?.StockID ? (
                                <div className="text-muted">Chưa chấm công</div>
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                          <div className="w-12 text-center">
                            <div className="text-base font-semibold text-success font-lato">
                              {item?.WorkTrack?.CheckIn
                                ? moment(item?.WorkTrack?.CheckIn).format(
                                    "HH:mm"
                                  )
                                : "--:--"}
                            </div>
                            <div className="text-base font-semibold text-danger font-lato">
                              {item?.WorkTrack?.CheckOut
                                ? moment(item?.WorkTrack?.CheckOut).format(
                                    "HH:mm"
                                  )
                                : "--:--"}
                            </div>
                          </div>
                        </div>
                        {/* <div className="flex justify-between" onClick={opens}>
                          <div>
                            <div className="text-muted">Vào làm</div>
                            <div className="text-base font-semibold text-success font-lato">
                              {item?.WorkTrack?.CheckIn
                                ? moment(item?.WorkTrack?.CheckIn).format(
                                    "HH:mm"
                                  )
                                : "--:--"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted">Ra về</div>
                            <div className="text-base font-semibold text-danger font-lato">
                              {item?.WorkTrack?.CheckOut
                                ? moment(item?.WorkTrack?.CheckOut).format(
                                    "HH:mm"
                                  )
                                : "--:--"}
                            </div>
                          </div>
                        </div> */}
                        {/* {item.WorkTrack?.StockID && (
                          <PickerChangeStock user={user} item={item}>
                            {({ open }) => (
                              <div
                                className="pt-2 mt-3 border-t border-dashed"
                                onClick={open}
                              >
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
                        )}
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
                        )} */}
                      </div>
                    ))}
                </div>
              )}
            </PickerTimekeeping>
          ))}
      </div>
      <Popover
        className="popover-timekeepings-settings w-[160px]"
        onPopoverOpen={() => setActiveIndex(4)}
        onPopoverClosed={() => setActiveIndex(0)}
      >
        <div className="flex flex-col py-2">
          <Link
            href="/admin/timekeepings/shift/"
            popoverClose
            className="py-2.5 px-3.5 font-medium"
            noLinkClass
          >
            Ca làm việc
          </Link>
          <Link
            href="/admin/timekeepings/punishment/"
            className="py-2.5 px-3.5 font-medium"
            popoverClose
            noLinkClass
          >
            Thưởng phạt
          </Link>
          <Link
            href="/admin/timekeepings/wifi-location/"
            className="py-2.5 px-3.5 font-medium"
            popoverClose
            noLinkClass
          >
            {Brand?.Global?.Admin?.an_cai_dai_dinh_vi
              ? "Wifi chấm công"
              : "Định vị - Wifi"}
          </Link>
        </div>
      </Popover>
      <Toolbar
        className="shadow-lg before:hidden"
        inner={false}
        bottom
        style={{ "--f7-toolbar-bg-color": "#fff" }}
      >
        <div className="grid h-full grid-cols-5 overflow-auto no-scrollbar">
          {[
            {
              Title: "Theo ngày",
              Path: "",
              Icon: <CalendarIcon className="w-6" />,
            },
            {
              Title: "Theo Tháng",
              Path: "/admin/timekeepings/monthly/",
              Icon: <CalendarDaysIcon className="w-6" />,
            },
            {
              Title: "Lịch nghỉ",
              Path: "/admin/timekeepings/take-break/",
              Icon: <ListBulletIcon className="w-6" />,
            },
            {
              Title: "Lịch dự kiến",
              Path: "/admin/timekeepings/work/",
              Icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z"
                  />
                </svg>
              ),
            },
            {
              Title: "Cài đặt",
              Path: ".popover-timekeepings-settings",
              Type: "popover",
              Icon: <Cog6ToothIcon className="w-6" />,
            },
          ].map((item, index) => (
            <Link
              key={index}
              className={clsx(
                "cursor-pointer h-[48px]",
                ActiveIndex === index ? "!text-app" : "!text-[#202244]"
              )}
              noLinkClass
              href={!item.Type ? item.Path : "#"}
              popoverOpen={item.Type ? item.Path : null}
            >
              <div
                className={clsx(
                  "flex flex-col items-center justify-center h-full pt-1",
                  ActiveIndex === index ? "text-app" : "text-gray-700"
                )}
              >
                {item.Icon}
                <span className="text-[10px] mt-px leading-4">
                  {item.Title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Toolbar>
    </Page>
  );
}

export default Timekeepings;

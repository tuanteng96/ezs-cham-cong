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
  useStore,
} from "framework7-react";
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
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
    key: "",
    CrDate: new Date(),
  });

  const { isLoading, isFetching, refetch, data } = useQuery({
    queryKey: ["TimekeepingsSheet", filters],
    queryFn: async () => {
      const newObj = {
        ...filters,
        From: filters.CrDate ? moment(filters.CrDate).format("DD/MM/YYYY") : "",
        To: filters.CrDate ? moment(filters.CrDate).format("DD/MM/YYYY") : "",
        StockID: filters.StockID ? filters.StockID.ID : "",
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
      noToolbar
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
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            popoverOpen=".popover-timekeepings"
          >
            <EllipsisVerticalIcon className="w-6" />
          </Link>
        </NavRight>
        <Popover className="popover-timekeepings w-[230px]">
          <div>
            <div className="flex flex-col py-2 border-b">
              <PickerFilter
                initialValues={filters}
                onChange={(values) => setFilters(values)}
              >
                {({ open }) => (
                  <Link
                    popoverClose
                    className="py-2.5 px-3.5 font-medium"
                    noLinkClass
                    onClick={open}
                  >
                    Bộ lọc
                  </Link>
                )}
              </PickerFilter>
            </div>
            <div className="flex flex-col py-2 border-b">
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
            <div className="flex flex-col py-2">
              <Link
                href="/admin/timekeepings/take-break/"
                popoverClose
                className="py-2.5 px-3.5 font-medium"
                noLinkClass
              >
                Xem danh sách ngày nghỉ
              </Link>
              <Link
                href="/admin/timekeepings/monthly/"
                className="py-2.5 px-3.5 font-medium"
                popoverClose
                noLinkClass
              >
                Xem chấm công tháng
              </Link>
              <Link
                href="/admin/timekeepings/work/"
                className="py-2.5 px-3.5 font-medium"
                popoverClose
                noLinkClass
              >
                Xem lịch làm việc
              </Link>
            </div>
          </div>
        </Popover>
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
                  <div className="flex border-b bg-gray-50">
                    <Link
                      href={`/admin/timekeepings/${user?.UserID}/?FullName=${user?.FullName}&Month=${filters.CrDate}`}
                      className="flex-1 py-3.5 pl-4 flex-col items-start"
                    >
                      <div className="mb-px font-medium text-[15px] text-primary">
                        {user?.FullName}
                      </div>
                      <div className="text-gray-500">{user?.UserName}</div>
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
                        "w-[150px]",
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
                          Chấm công
                        </Link>
                        <PickerJobType user={user}>
                          {({ open }) => (
                            <Link
                              popoverClose
                              className="flex justify-between px-3 py-2.5 font-medium"
                              noLinkClass
                              onClick={open}
                            >
                              Loại công ca
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
                              Mã máy
                            </Link>
                          )}
                        </PickerMachine>

                        <Link
                          popoverClose
                          className="flex justify-between px-3 py-2.5 font-medium text-danger"
                          noLinkClass
                          onClick={() => onResetPwd(user)}
                        >
                          Reset mật khẩu
                        </Link>
                      </div>
                    </Popover>
                  </div>
                  {user.Dates &&
                    user.Dates.map((item, i) => (
                      <div className="p-4" key={i}>
                        <div className="flex justify-between" onClick={opens}>
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
                        </div>
                        {item.WorkTrack?.StockID && (
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
                        )}
                      </div>
                    ))}
                </div>
              )}
            </PickerTimekeeping>
          ))}
      </div>
    </Page>
  );
}

export default Timekeepings;

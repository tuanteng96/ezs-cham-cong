import React, { useRef, useState } from "react";
import { Link, Page, f7, useStore } from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import moment from "moment";
import { TopBars } from "./components";
import { useQuery, useQueryClient } from "react-query";
import WorkTrackAPI from "../../api/WorkTrack.api";
import PullToRefresh from "react-simple-pull-to-refresh";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import { SwipeButton } from "swipe-button";
import { PickerCheckInOut } from "@/components";
import { DatePickerWrap } from "@/partials/forms";
import clsx from "clsx";
import { useCheckInOut } from "@/hooks";
import AssetsHelpers from "@/helpers/AssetsHelpers";

function HomePage(props) {
  let Auth = useStore("Auth");

  const calendarInline = useRef(null);

  const [filters, setFilters] = useState({
    UserIDs: [Auth?.ID],
    Date: new Date(),
  });
  const [updatedKey, setUpdatedKey] = useState(new Date().getTime());

  const queryClient = useQueryClient();

  let { CheckIn, CheckOut, CheckInStorage, CheckOutStorage } = useCheckInOut();

  const { data, refetch } = useQuery({
    queryKey: ["TimekeepingHome", filters],
    queryFn: async () => {
      let newFilters = {
        UserIDs: filters.UserIDs,
        From: moment(filters.Date).format("YYYY-MM-DD"),
        To: moment(filters.Date).format("YYYY-MM-DD"),
      };
      let { data } = await WorkTrackAPI.List(newFilters);

      let { List } =
        (data.list[0]?.Users &&
          data.list[0]?.Users.length > 0 &&
          data.list[0]?.Users[0]) ||
        null;

      let indexCheckIn = List && List.findIndex((obj) => obj.CheckIn);
      let indexCheckOut = List && List.findIndex((obj) => obj.CheckOut);

      return {
        CheckIn: indexCheckIn > -1 ? List[indexCheckIn] : null,
        CheckOut: indexCheckOut > -1 ? List[indexCheckOut] : null,
      };
    },
    enabled: Boolean(Auth && Auth?.ID && filters.Date),
  });

  const onPageInit = () => {
    const $ = f7.$;
    // Inline with custom toolbar
    const monthNames = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];
    calendarInline.current = f7.calendar.create({
      containerEl: "#calendar-inline-container",
      value: [filters.Date || new Date()],
      renderToolbar() {
        return `
          <div class="calendar-custom-toolbar border-b">
            <div class="flex justify-between h-11 items-center">
              <div class="left w-12 h-full flex items-center justify-center link icon-only">
                <i class="icon icon-back !leading-[24px] after:text-xs after:text-muted"></i>
              </div>
              <div class="center text-[15px] font-medium capitalize"></div>
              <div class="right w-12 h-full flex items-center justify-center link icon-only">
                <i class="icon icon-forward !leading-[24px] after:text-xs after:text-muted"></i>
              </div>
            </div>
          </div>
        `.trim();
      },
      on: {
        init(c) {
          $(".calendar-custom-toolbar .center").text(
            `${moment().format("dddd, [Ngày] DD [T]MM, YYYY")}`
          );
          $(".calendar-custom-toolbar .left.link").on("click", () => {
            calendarInline.current.prevMonth();
          });
          $(".calendar-custom-toolbar .right.link").on("click", () => {
            calendarInline.current.nextMonth();
          });
        },
        monthYearChangeStart(c) {
          $(".calendar-custom-toolbar .center").text(
            `${monthNames[c.currentMonth]}, ${c.currentYear}`
          );
        },
        calendarChange(calendar, value) {
          let date = value ? value[0] : new Date();
          setFilters((prevState) => ({
            ...prevState,
            Date: value ? value[0] : new Date(),
          }));
          $(".calendar-custom-toolbar .center").text(
            `${moment(date).format("dddd, [Ngày] DD [T]MM, YYYY")}`
          );
        },
      },
    });
  };

  const onPageBeforeRemove = () => {
    calendarInline.current.destroy();
  };

  const handleSuccess = () => {
    console.log("Swipe action completed!");
  };

  return (
    <Page
      className="bg-[#eef3ff]"
      noSwipeback
      noNavbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      // onPageInit={onPageInit}
      // onPageBeforeRemove={onPageBeforeRemove}
    >
      <div className="relative h-full overflow-hidden">
        <div className="relative -top-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 420.44 292.72"
          >
            <defs>
              <style
                dangerouslySetInnerHTML={{
                  __html: ".clip-path{clip-path:url(#clip-path);}",
                }}
              />
              <clipPath id="clip-path">
                <path
                  className="fill-none"
                  d="M0,0H420.44a0,0,0,0,1,0,0V267.83a24.89,24.89,0,0,1-24.89,24.89H24.91A24.91,24.91,0,0,1,0,267.8V0A0,0,0,0,1,0,0Z"
                />
              </clipPath>
            </defs>
            <g id="OBJECTS">
              <g>
                <path
                  className="fill-app"
                  d="M0,0H420.44a0,0,0,0,1,0,0V267.83a24.89,24.89,0,0,1-24.89,24.89H24.91A24.91,24.91,0,0,1,0,267.8V0A0,0,0,0,1,0,0Z"
                />
                <path
                  className="fill-[#f5b040]"
                  d="M196-53.6c40.73,126.8,134.83,235.5,254.5,294-1.06-91.85-6.07-184.08-7.13-275.94-.06-5.91-.38-12.46-4.5-16.7-2.69-2.76-6.54-4-10.25-5.05-75.56-21-157.66,9.92-234-8C192.54-62.52,198-56.39,196-53.6Z"
                />
              </g>
            </g>
          </svg>
        </div>

        <div className="absolute top-0 left-0 flex flex-col w-full h-full">
          <div className="pt-safe-t">
            <TopBars {...props} />
          </div>
          <div className="overflow-auto grow no-scrollbar">
            <div className="px-4">
              <div className="bg-white rounded-lg">
                <div className="relative flex items-center justify-between p-4 border-b">
                  <div className="font-medium capitalize">
                    {moment(filters.Date).format(
                      "dddd, [Ngày] DD [T] MM, YYYY"
                    )}
                  </div>
                  <DatePickerWrap
                    value={filters.Date}
                    format="DD/MM/YYYY"
                    onChange={(val) => {
                      setFilters((prevState) => ({
                        ...prevState,
                        Date: val,
                      }));
                    }}
                    label="Chọn ngày"
                  >
                    {({ open }) => (
                      <div
                        onClick={open}
                        className="absolute flex items-center justify-center w-10 h-10 right-1 top-2/4 -translate-y-2/4"
                      >
                        <CalendarDaysIcon className="w-6" />
                      </div>
                    )}
                  </DatePickerWrap>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div className="relative px-3 py-2 overflow-hidden bg-white border rounded box-checkin">
                    <div className="text-gray-600">Vào làm</div>
                    <div className="text-lg font-bold text-success">
                      {Auth?.ServerTime &&
                      moment(filters.Date).format("DD-MM-YYYY") ===
                        moment(Auth?.ServerTime).format("DD-MM-YYYY") ? (
                        <>
                          {CheckIn?.CheckIn
                            ? moment(
                                CheckIn?.CheckIn,
                                "YYYY-MM-DD HH:mm"
                              ).format("HH:mm")
                            : "--:--"}
                        </>
                      ) : (
                        <>
                          {data?.CheckIn
                            ? moment(data.CheckIn.CheckIn).format("HH:mm")
                            : "--:--"}
                        </>
                      )}
                    </div>
                    <ArrowLeftOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-success" />
                  </div>
                  <div className="relative px-3 py-2 bg-white border rounded">
                    <div className="text-gray-600">Ra về</div>
                    <div className="text-lg font-bold text-danger">
                      {Auth?.ServerTime &&
                      moment(filters.Date).format("DD-MM-YYYY") ===
                        moment(Auth?.ServerTime).format("DD-MM-YYYY") ? (
                        <>
                          {CheckOut?.CheckOut
                            ? moment(
                                CheckOut?.CheckOut,
                                "YYYY-MM-DD HH:mm"
                              ).format("HH:mm")
                            : "--:--"}
                        </>
                      ) : (
                        <>
                          {data?.CheckOut
                            ? moment(data.CheckOut.CheckOut).format("HH:mm")
                            : "--:--"}
                        </>
                      )}
                    </div>
                    <ArrowRightOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-danger" />
                  </div>
                </div>
                {(!CheckIn || !CheckOut) && (
                  <PickerCheckInOut
                    onError={() => {
                      setUpdatedKey(new Date().getTime());
                    }}
                    onSuccess={() => {
                      setUpdatedKey(new Date().getTime());
                    }}
                  >
                    {({ onCheckInOut, onSyncInOut }) => (
                      <div className="w-full px-4 pb-4">
                        {!CheckInStorage && !CheckOutStorage ? (
                          <SwipeButton.Root
                            className={clsx(
                              !CheckIn ? "sw-success" : "sw-danger"
                            )}
                            onSuccess={() => onCheckInOut()}
                            key={updatedKey}
                          >
                            <SwipeButton.Rail>
                              <div
                                className={clsx(
                                  "slider__shimmer__text font-lato text-[15px]",
                                  !CheckIn?.CheckIn
                                    ? "text-success"
                                    : "text-danger"
                                )}
                              >
                                {(!CheckIn?.CheckIn
                                  ? "Vuốt phải chấm công vào làm"
                                  : "Vuốt phải chấm công ra về"
                                )
                                  .split(" ")
                                  .map((text, index) => (
                                    <span
                                      className="px-[2px]"
                                      key={index}
                                      style={{
                                        "--i": index + 1,
                                      }}
                                    >
                                      {text}
                                    </span>
                                  ))}
                              </div>
                              <div className="slider__shimmer"></div>
                            </SwipeButton.Rail>
                            <SwipeButton.Overlay>
                              Vuốt sang bên phải →
                            </SwipeButton.Overlay>
                            <SwipeButton.Slider>
                              <ChevronRightIcon className="w-6" />
                            </SwipeButton.Slider>
                          </SwipeButton.Root>
                        ) : (
                          <SwipeButton.Root
                            className="sw-warning"
                            onSuccess={() => onSyncInOut()}
                            key={updatedKey}
                          >
                            <SwipeButton.Rail>
                              <div
                                className={clsx(
                                  "slider__shimmer__text font-lato text-[15px] text-warning"
                                )}
                              >
                                {"Vuốt phải đồng bộ dữ liệu"
                                  .split(" ")
                                  .map((text, index) => (
                                    <span
                                      className="px-[2px]"
                                      key={index}
                                      style={{
                                        "--i": index + 1,
                                      }}
                                    >
                                      {text}
                                    </span>
                                  ))}
                              </div>
                              <div className="slider__shimmer"></div>
                            </SwipeButton.Rail>
                            <SwipeButton.Overlay>
                              Vuốt sang bên phải →
                            </SwipeButton.Overlay>
                            <SwipeButton.Slider>
                              <ChevronRightIcon className="w-6" />
                            </SwipeButton.Slider>
                          </SwipeButton.Root>
                        )}
                      </div>
                    )}
                  </PickerCheckInOut>
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3.5 mb-4 last:mb-0 w-full">
                <Link
                  noLinkClass
                  href="/timekeeping/"
                  className="relative p-4 overflow-hidden text-white rounded-lg bg-info"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info-light text-info">
                    <MagnifyingGlassPlusIcon className="w-6" />
                  </div>
                  <div className="mt-4 font-medium">Tra cứu chấm công</div>
                  <div className="absolute pointer-events-none -top-2 -right-2">
                    <img
                      className="w-[120px]"
                      src={AssetsHelpers.toAbsoluteUrlCore(
                        "/AppCoreV2/images/card-image.png",
                        ""
                      )}
                    />
                  </div>
                </Link>

                <Link
                  noLinkClass
                  href="/take-break/"
                  className="relative p-4 overflow-hidden text-white rounded-lg bg-danger"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-danger-light text-danger">
                    <CalendarDaysIcon className="w-6" />
                  </div>
                  <div className="mt-4 font-medium">Lịch nghỉ, Xin nghỉ</div>
                  <div className="absolute pointer-events-none -top-2 -right-2">
                    <img
                      className="w-[120px]"
                      src={AssetsHelpers.toAbsoluteUrlCore(
                        "/AppCoreV2/images/card-image.png",
                        ""
                      )}
                    />
                  </div>
                </Link>

                <Link
                  noLinkClass
                  href="/statistical/"
                  className="relative p-4 overflow-hidden text-white rounded-lg bg-primary"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light text-primary">
                    <ChartBarIcon className="w-6" />
                  </div>
                  <div className="mt-4 font-medium">Bảng lương tháng</div>
                  <div className="absolute pointer-events-none -top-2 -right-2">
                    <img
                      className="w-[120px]"
                      src={AssetsHelpers.toAbsoluteUrlCore(
                        "/AppCoreV2/images/card-image.png",
                        ""
                      )}
                    />
                  </div>
                </Link>

                <Link
                  noLinkClass
                  href="/statistical/day/"
                  className="relative p-4 overflow-hidden text-white rounded-lg bg-warning"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-light text-warning">
                    <PresentationChartLineIcon className="w-6" />
                  </div>
                  <div className="mt-4 font-medium">Bảng lương ngày</div>
                  <div className="absolute pointer-events-none -top-2 -right-2">
                    <img
                      className="w-[120px]"
                      src={AssetsHelpers.toAbsoluteUrlCore(
                        "/AppCoreV2/images/card-image.png",
                        ""
                      )}
                    />
                  </div>
                </Link>
              </div>

              {Auth.Info?.Groups && Auth.Info?.Groups.length > 0 && (
                <>
                  {Auth.Info?.Groups.findIndex((x) =>
                    x.Title.toUpperCase().includes("SERVICE")
                  ) > -1 && (
                    <Link
                      noLinkClass
                      href="/technicians/"
                      className="flex flex-col items-center p-4 mb-4 text-center rounded-lg last:mb-0 bg-[#fef5e5]"
                    >
                      <div className="mb-1 font-semibold uppercase">
                        Dành cho kỹ thuật viên
                      </div>
                      <div className="font-light text-gray-700">
                        Danh sách dịch vụ đã & đã thực hiện, đặt lịch do mình
                        phụ trách.
                      </div>
                    </Link>
                  )}
                  {Auth.Info?.Groups.findIndex((x) =>
                    x.Title.toUpperCase().includes("GIÁO VIÊN")
                  ) > -1 && (
                    <Link
                      noLinkClass
                      href="/courses/"
                      className="flex flex-col items-center p-4 mb-4 text-center rounded-lg last:mb-0 bg-[#fef5e5]"
                    >
                      <div className="mb-1 font-semibold uppercase">
                        Dành cho giáo viên
                      </div>
                      <div className="font-light text-gray-700">
                        Danh sách các lớp đào tạo spa / thẩm mỹ viện do bạn quản
                        lý
                      </div>
                    </Link>
                  )}
                  {Auth.Info?.Groups.findIndex((x) =>
                    x.Title.toUpperCase().includes("HUẤN LUYỆN VIÊN")
                  ) > -1 && (
                    <Link
                      noLinkClass
                      href="/osclass/"
                      className="flex flex-col items-center p-4 mb-4 text-center rounded-lg last:mb-0 bg-[#fef5e5]"
                    >
                      <div className="mb-1 font-semibold uppercase">
                        Dành cho huấn luyện viên
                      </div>
                      <div className="font-light text-gray-700">
                        Danh sách các lớp tập do bạn quản lý ( điểm danh, thống
                        kê )
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default HomePage;

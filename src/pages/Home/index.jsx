import React, { useRef, useState } from "react";
import { Page, f7, useStore } from "framework7-react";
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

function HomePage(props) {
  let Auth = useStore("Auth");

  const calendarInline = useRef(null);
  const [filters, setFilters] = useState({
    UserIDs: [Auth?.ID],
    Date: null,
  });

  const queryClient = useQueryClient();

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
              <div class="center text-[15px] font-medium"></div>
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
            `${monthNames[c.currentMonth]}, ${c.currentYear}`
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
          setFilters((prevState) => ({
            ...prevState,
            Date: value ? value[0] : new Date(),
          }));
        },
      },
    });
  };

  const onPageBeforeRemove = () => {
    calendarInline.current.destroy();
  };

  return (
    <Page
      className="bg-white"
      noSwipeback
      noNavbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      onPageInit={onPageInit}
      onPageBeforeRemove={onPageBeforeRemove}
    >
      <div className="relative h-full">
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

        <div className="absolute top-0 left-0 flex flex-col w-full h-full overflow-auto">
          <div className="pt-safe-t">
            <TopBars {...props} />
          </div>
          <PullToRefresh
            className="flex-grow ezs-ptr ezs-ptr-white"
            onRefresh={() =>
              Promise.all([queryClient.invalidateQueries(["Auth"]), refetch()])
            }
          >
            <div className="px-4 pb-4">
              <div className="mb-4 bg-white rounded">
                <div id="calendar-inline-container" />
              </div>
              <div>
                <div className="mb-2 font-medium capitalize">
                  {moment(filters.Date).format("dddd, [Ngày] DD MMMM, YYYY")}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative px-3 py-2 bg-white border rounded">
                    <div>Vào làm</div>
                    <div className="text-lg font-bold text-success">
                      {data?.CheckIn
                        ? moment(data.CheckIn.CheckIn).format("HH:mm")
                        : "--:--"}
                    </div>
                    <ArrowLeftOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-success" />
                  </div>
                  <div className="relative px-3 py-2 bg-white border rounded">
                    <div>Ra về</div>
                    <div className="text-lg font-bold text-danger">
                      {data?.CheckOut
                        ? moment(data.CheckOut.CheckOut).format("HH:mm")
                        : "--:--"}
                    </div>
                    <ArrowRightOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-danger" />
                  </div>
                </div>
                {/* {(!CheckIn || !CheckOut) && (
                  <div className="flex items-center px-4 py-2 mb-4 text-xs text-white rounded bg-warning">
                    <ExclamationTriangleIcon className="w-5" />
                    <span className="pl-2">
                      Bạn chưa chấm công {!CheckIn ? "vào làm" : "ra về"} ngày
                      hôm nay
                      <span className="pl-1">
                        {moment().format("DD/MM/YYYY")}
                      </span>
                    </span>
                  </div>
                )} */}
              </div>
            </div>
          </PullToRefresh>
        </div>
      </div>
    </Page>
  );
}

export default HomePage;

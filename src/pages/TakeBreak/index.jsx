import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import React, { useState } from "react";
import PromHelpers from "../../helpers/PromHelpers";
import moment from "moment";
import { DatePickerWrap } from "../../partials/forms";
import { PickerTakeBreak } from "./components";
import { useQuery } from "react-query";
import WorkTrackAPI from "../../api/WorkTrack.api";
import NoFound from "../../components/NoFound";

function TakeBreakPage(props) {
  let Auth = useStore("Auth");

  const [filters, setFilters] = useState({
    From: moment().startOf("month").toDate(),
    To: moment().endOf("month").toDate(),
    StockID: Auth?.StockID,
    Key: Auth?.ID,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["TakeBreakList", filters],
    queryFn: async () => {
      let newFilters = {
        ...filters,
        From: moment(filters.From).format("DD-MM-YYYY"),
        To: moment(filters.To).format("DD-MM-YYYY"),
      };
      let { data } = await WorkTrackAPI.listTakeBreak(newFilters);
      return data?.list && data?.list.length > 0
        ? data?.list[0].Dates.filter((x) => x.WorkOffs && x.WorkOffs.length > 0)
        : [];
    },
    enabled: Boolean(Auth && Auth?.ID),
  });

  return (
    <Page
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <DatePickerWrap
            value={filters.From}
            format="MM/YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                From: moment(val).startOf("month").toDate(),
                To: moment(val).endOf("month").toDate(),
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
        </NavLeft>
        <NavTitle>Xin nghỉ tháng {moment(filters.From).format("M")}</NavTitle>
        <NavRight className="h-full">
          <PickerTakeBreak>
            {({ open }) => (
              <div
                className="flex items-center justify-center w-12 h-full"
                onClick={open}
              >
                <PlusIcon className="w-6" />
              </div>
            )}
          </PickerTakeBreak>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>

      {/* <div className="fixed w-full z-[-1]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 610.61">
          <g id="Layer_2" data-name="Layer 2">
            <path
              className="fill-app"
              d="M750,100V0H0V215.35H17.2c36.15,1,85.18,9,131.3,38.34,87.72,55.73,130.25,238.85,292.39,323.77,101.35,53.09,224.51,37.74,309.11-13V169.82h-.24V100Z"
            />
          </g>
        </svg>
      </div> */}
      <div className="p-4">
        {isLoading && (
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

        {!isLoading && (
          <>
            {data &&
              data.length > 0 &&
              data.map((item, index) => (
                <div
                  className="p-4 mb-4 bg-white rounded last:mb-0"
                  key={index}
                >
                  <div className="flex items-center justify-between pb-3.5 mb-5 border-b">
                    <div className="font-medium capitalize">
                      {moment(item.Date).format("ddd, [Ngày] ll")}
                    </div>
                  </div>
                  <div>
                    {item.WorkOffs &&
                      item.WorkOffs.map((work, i) => (
                        <div className="relative mb-6 last:mb-0" key={i}>
                          <div className="flex pb-5 relative before:content-[''] before:absolute before:h-full before:border-l before:z-1 before:left-[5px] before:border-dashed">
                            <div className="z-10 w-[11px] h-[11px] bg-white border rounded-full border-success"></div>
                            <div className="relative flex-1 pl-3">
                              <div className="absolute top-[-5px] l-3 text-muted">
                                Xin nghỉ từ
                              </div>
                              <div className="pt-5 font-semibold capitalize">
                                {moment(work.From).format("HH:mm ddd, ll")}
                              </div>
                            </div>
                          </div>
                          <div className="flex pb-5 relative before:content-[''] before:absolute before:h-full before:border-l before:z-1 before:left-[5px] before:border-dashed">
                            <div className="z-10 w-[11px] h-[11px] bg-white border rounded-full border-danger"></div>
                            <div className="relative flex-1 pl-3">
                              <div className="absolute top-[-5px] l-3 text-muted">
                                Đến
                              </div>
                              <div className="pt-5 font-semibold capitalize">
                                {moment(work.From).format("HH:mm ddd, ll")}
                              </div>
                            </div>
                          </div>
                          <div className="flex">
                            <div className="z-10 w-[11px] h-[11px] bg-white border rounded-full border-gray-500"></div>
                            <div className="relative flex-1 pl-3">
                              <div className="absolute top-[-5px] l-3 text-muted">
                                Lý do
                              </div>
                              <div className="pt-5 font-medium">
                                {work.Desc}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            {(!data || data.length === 0) && (
              <NoFound
                Title="Không có kết quả nào."
                Desc="Rất tiếc ... Không tìm thấy dữ liệu nào, bạn có thể thay đổi tháng để
                  tìm dữ liệu"
              />
            )}
          </>
        )}
      </div>
    </Page>
  );
}

export default TakeBreakPage;

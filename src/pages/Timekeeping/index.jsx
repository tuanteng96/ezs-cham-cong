import {
  AdjustmentsVerticalIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { NavLeft, NavRight, NavTitle, Navbar, Page, useStore } from "framework7-react";
import React, { useState } from "react";
import PromHelpers from "../../helpers/PromHelpers";
import moment from "moment";
import WorkTrackAPI from "../../api/WorkTrack.api";
import { useQuery } from "react-query";
import { DatePickerWrap } from "../../partials/forms";
import { PickerTimeKeep } from "./components";
import NoFound from "../../components/NoFound";
import { PickerActionFilter } from "../../components";

function Timekeeping({ f7router }) {
  let Auth = useStore("Auth");

  const [filters, setFilters] = useState({
    UserIDs: [Auth?.ID],
    From: moment().startOf("month").toDate(),
    To: moment().endOf("month").toDate(),
    Type: 1,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["TimekeepingList", filters],
    queryFn: async () => {
      let newFilters = {
        UserIDs: filters.UserIDs,
        From: moment(filters.From).format("YYYY-MM-DD"),
        To: moment(filters.To).format("YYYY-MM-DD"),
      };

      let { data } = await WorkTrackAPI.List(newFilters);

      return data?.list && data?.list.length > 0
        ? data?.list.filter((x) => {
            if (filters.Type) {
              return filters.Type === 1
                ? x.Users[0]?.List.length > 0
                : x.Users[0]?.List.length === 0;
            }
            return x;
          })
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
          <PickerActionFilter
            options={[
              { Title: "Tất cả", value: "" },
              { Title: "Đã chấm công", value: 1 },
              { Title: "Chưa chấm công", value: 2 },
            ]}
            label={`Bảng công tháng ${moment(filters.From).format("M")}`}
            option={filters.Type}
            onChange={(val) =>
              setFilters((prevState) => ({
                ...prevState,
                Type: val.value,
              }))
            }
          >
            {({ open }) => (
              <div
                className="flex items-center justify-center w-12 h-full"
                onClick={open}
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </div>
            )}
          </PickerActionFilter>
        </NavLeft>
        <NavTitle>Bảng công tháng {moment(filters.From).format("M")}</NavTitle>
        <NavRight className="h-full">
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
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="p-4">
        {isLoading && (
          <>
            {Array(4)
              .fill()
              .map((_, index) => (
                <div
                  className="p-4 mb-4 bg-white rounded last:mb-0"
                  key={index}
                >
                  <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b font-medium">
                    <div className="capitalize">
                      <div className="w-48 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <ChevronRightIcon className="w-4 text-muted" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-muted">Vào làm</div>
                      <div className="text-lg font-semibold text-success">
                        <div className="h-3 mt-1.5 bg-gray-200 rounded w-14 animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Ra về</div>
                      <div className="text-lg font-semibold text-danger">
                        <div className="h-3 mt-1.5 bg-gray-200 rounded w-14 animate-pulse"></div>
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
              data.map((item, index) => (
                <div className="mb-4 bg-white rounded last:mb-0" key={index}>
                  <PickerTimeKeep item={item}>
                    {({ open }) => (
                      <div className="p-4" onClick={open}>
                        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b font-medium">
                          <div className="capitalize">
                            {moment(item.Date).format("ddd, [Ngày] ll")}
                          </div>
                          <div>
                            <ChevronRightIcon className="w-4 text-muted" />
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div>
                            <div className="text-muted">Vào làm</div>
                            <div className="text-lg font-semibold text-success">
                              {item.Users[0].List[0]?.CheckIn
                                ? moment(item.Users[0].List[0]?.CheckIn).format(
                                    "HH:mm"
                                  )
                                : "--:--"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted">Ra về</div>
                            <div className="text-lg font-semibold text-danger">
                              {item.Users[0].List[0]?.CheckOut
                                ? moment(
                                    item.Users[0].List[0]?.CheckOut
                                  ).format("HH:mm")
                                : "--:--"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </PickerTimeKeep>
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

export default Timekeeping;

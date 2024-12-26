import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import React, { useState } from "react";
import PromHelpers from "../../helpers/PromHelpers";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ExclamationCircleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "react-query";
import StatisticalAPI from "../../api/Statistical.api";
import moment from "moment";
import StringHelpers from "../../helpers/StringHelpers";
import ArrayHelpers from "../../helpers/ArrayHelpers";
import { DatePickerWrap } from "../../partials/forms";
import clsx from "clsx";
import WorkTrackAPI from "@/api/WorkTrack.api";
import { PickerTimeKeep } from "../Timekeeping/components";

function StatisticalDay({ f7router }) {
  const Auth = useStore("Auth");
  const Stocks = useStore("Stocks");
  const { Global } = useStore("Brand");

  const [filters, setFilters] = useState({
    Date: new Date(),
    UserID: Auth?.ID,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["StatisticalDay", filters],
    queryFn: async () => {
      let newFilters = {
        ...filters,
        Date: moment(filters.Date).format("YYYY/MM/DD"),
      };
      let { data } = await StatisticalAPI.getUserSalaryDay(newFilters);
      let { data: Timekeeping } = await WorkTrackAPI.List({
        UserIDs: [filters.UserID],
        From: moment(filters.Date).format("YYYY-MM-DD"),
        To: moment(filters.Date).format("YYYY-MM-DD"),
      });

      return data?.list && data?.list.length > 0
        ? {
            ...data?.list[0],
            Timekeeping: Timekeeping?.list ? Timekeeping?.list[0] : null,
          }
        : null;
    },
    enabled: Boolean(Auth && Auth?.ID),
  });

  const getStocksAdv = (StockID) => {
    let index = Stocks?.findIndex((x) => x.ID === StockID);
    if (index > -1) {
      return Stocks[index].Title;
    }
    return "Chưa xác định";
  };

  return (
    <Page
      name="Statistical"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
      noToolbar
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="!justify-center w-12 h-full">
          <Link
            back
            noLinkClass
            className="!text-white h-full flex item-center justify-center"
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>{moment(filters.Date).format("DD-MM-YYYY")}</NavTitle>
        <NavRight className="h-full">
          <DatePickerWrap
            value={filters.Date}
            format="DD/MM/YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                Date: val,
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
      <div>
        {isLoading && (
          <>
            {Array(3)
              .fill()
              .map((_, i) => (
                <div className="bg-white animate-pulse" role="status" key={i}>
                  <div className="bg-white mb-1.5">
                    <div className="flex justify-center py-3 font-bold text-center uppercase border-b">
                      <div className="w-2/4 h-3 bg-gray-200 rounded-full"></div>
                    </div>
                    <div>
                      {Array(3)
                        .fill()
                        .map((_, index) => (
                          <div
                            className="grid grid-cols-5 font-medium border-b"
                            key={index}
                          >
                            <div className="px-4 py-2.5 border-r flex items-center h-[41px] col-span-3">
                              <div className="h-2.5 bg-gray-200 rounded-full w-2/4"></div>
                            </div>
                            <div className="px-4 py-2.5 h-[41px] flex justify-end items-center col-span-2">
                              <div className="h-2.5 bg-gray-200 rounded-full w-2/4"></div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-5">
                      <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                        <div className="h-2.5 bg-gray-200 rounded-full w-2/4"></div>
                      </div>
                      <div className="px-4 py-2.5 font-semibold flex justify-end items-center col-span-2">
                        <div className="h-2.5 bg-gray-200 rounded-full w-2/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}
        {!isLoading && data && (
          <>
            <PickerTimeKeep item={data?.Timekeeping}>
              {({ open }) => (
                <div className="bg-white mb-1.5" onClick={open}>
                  <div className="flex justify-center py-3 font-bold text-center uppercase border-b">
                    Chấm công
                    <ExclamationCircleIcon className="w-5 ml-2 text-warning" />
                  </div>
                  <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                    <div className="px-4 py-2.5 border-r col-span-3">
                      Hạng mục
                    </div>
                    <div className="px-4 py-2.5 text-right col-span-2">
                      Giá trị
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-5 font-medium border-b">
                      <div className="px-4 py-2.5 border-r font-light col-span-3">
                        Vào
                      </div>
                      <div className="px-4 py-2.5 text-right col-span-2 font-medium text-success">
                        {data?.Timekeeping.Users[0].List[0]?.CheckIn
                          ? moment(
                              data?.Timekeeping.Users[0].List[0]?.CheckIn
                            ).format("HH:mm")
                          : "--:--"}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 font-medium border-b">
                      <div className="px-4 py-2.5 border-r font-light col-span-3">
                        Ra
                      </div>
                      <div className="px-4 py-2.5 text-right col-span-2 font-medium text-danger">
                        {data?.Timekeeping.Users[0].List[0]?.CheckOut
                          ? moment(
                              data?.Timekeeping.Users[0].List[0]?.CheckOut
                            ).format("HH:mm")
                          : "--:--"}
                      </div>
                    </div>
                    {data?.Timekeeping.Users[0].List[0]?.CheckIn && (
                      <div className="grid grid-cols-5 font-medium border-b">
                        <div className="px-4 py-2.5 border-r font-light col-span-3">
                          Cơ sở
                        </div>
                        <div className="px-4 py-2.5 text-right col-span-2 font-medium">
                          {Auth.StockID ===
                            data?.Timekeeping.Users[0].List[0].StockID && (
                            <span>{Auth?.StockInfo?.Title}</span>
                          )}
                          {Auth.StockID !==
                            data?.Timekeeping.Users[0].List[0].StockID && (
                            <span className="text-danger">
                              Khác điểm :
                              <span className="pl-1">
                                {data?.Timekeeping.Users[0].List[0]
                                  ?.StockTitle ||
                                  getStocksAdv(
                                    data?.Timekeeping.Users[0].List[0].StockID
                                  )}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </PickerTimeKeep>
            <div className="bg-white mb-1.5">
              <div className="py-3 font-bold text-center uppercase border-b">
                Cộng tiền
                {data?.Bonus?.length > 0 && (
                  <span className="pl-1">({data?.Bonus?.length})</span>
                )}
              </div>
              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>

              <div>
                {data?.Bonus.map((item, index) => (
                  <div
                    className="grid grid-cols-5 font-medium border-b"
                    key={index}
                  >
                    <div className="px-4 py-2.5 border-r font-light col-span-3">
                      {item.Desc || "Thưởng"} - (
                      {moment(item.CreateDate).format("llll")} )
                    </div>
                    <div className="px-4 py-2.5 text-right col-span-2">
                      {StringHelpers.formatVND(item.Value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5">
                <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                  Tổng
                </div>
                <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                  {StringHelpers.formatVND(
                    ArrayHelpers.sumTotal(data?.Bonus, "Value")
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white mb-1.5">
              <div className="py-3 font-bold text-center uppercase border-b">
                Trừ tiền
                {data?.PHAT?.length > 0 && (
                  <span className="pl-1">({data?.PHAT?.length})</span>
                )}
              </div>
              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>

              <div>
                {data?.PHAT.map((item, index) => (
                  <div
                    className="grid grid-cols-5 font-medium border-b"
                    key={index}
                  >
                    <div className="px-4 py-2.5 border-r font-light col-span-3">
                      {item.Desc || "Phạt"} - (
                      {moment(item.CreateDate).format("llll")} )
                    </div>
                    <div className="px-4 py-2.5 text-right col-span-2">
                      {StringHelpers.formatVND(item.Value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5">
                <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                  Tổng
                </div>
                <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                  {StringHelpers.formatVND(
                    ArrayHelpers.sumTotal(data?.PHAT, "Value")
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white mb-1.5">
              <div className="py-3 font-bold text-center uppercase border-b">
                Lương dịch vụ
                {data?.SalaryServices?.length > 0 && (
                  <span className="pl-1">({data?.SalaryServices?.length})</span>
                )}
              </div>
              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>

              <div>
                {data?.SalaryServices.map((item, index) => (
                  <div
                    className="grid grid-cols-5 font-medium border-b"
                    key={index}
                  >
                    <div className="px-4 py-2.5 border-r font-light col-span-3">
                      <span
                        className={clsx(
                          "pr-1 font-medium",
                          item.OSStatus === "done"
                            ? "text-success"
                            : "text-warning"
                        )}
                      >
                        {item.OSStatus === "done"
                          ? "Hoàn thành"
                          : "Đang thực hiện"}
                      </span>
                      - {item.ProdTitle}
                      <span className="px-1">
                        ({" "}
                        {item.ConvertTitle || item.Root2Title || item.RootTitle}{" "}
                        )
                      </span>
                      - {moment(item.CreateDate).format("llll")}
                      <div>
                        {item?.Member?.FullName}
                        {!Global?.APP?.Staff?.hidePhoneMember &&
                          ` - ${item?.Member?.MobilePhone}`}
                      </div>
                    </div>
                    <div className="px-4 py-2.5 text-right col-span-2">
                      {StringHelpers.formatVND(item.Value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5">
                <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                  Tổng
                </div>
                <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                  {StringHelpers.formatVND(
                    ArrayHelpers.sumTotal(data?.SalaryServices, "Value")
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white mb-1.5">
              <div className="py-3 font-bold text-center uppercase border-b">
                Hoa hồng bán hàng
                {data?.BonusSales?.length > 0 && (
                  <span className="pl-1">({data?.BonusSales?.length})</span>
                )}
              </div>
              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>

              <div>
                {data?.BonusSales.map((item, index) => (
                  <div
                    className="grid grid-cols-5 font-medium border-b"
                    key={index}
                  >
                    <div className="px-4 py-2.5 border-r font-light col-span-3">
                      Hoa hồng - ( {moment(item.CreateDate).format("llll")})
                      <div>{item.ProdTitle}</div>
                    </div>
                    <div className="px-4 py-2.5 text-right col-span-2">
                      {StringHelpers.formatVND(item.Value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5">
                <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                  Tổng
                </div>
                <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                  {StringHelpers.formatVND(
                    ArrayHelpers.sumTotal(data?.BonusSales, "Value")
                  )}
                </div>
              </div>
            </div>

            {(data.DOANH_SO.length > 0 || data?.KpiTourResult?.Value > 0) && (
              <div className="bg-white mb-1.5">
                <div className="py-3 font-bold text-center uppercase border-b">
                  KPI
                  {data?.DOANH_SO?.length > 0 && (
                    <span className="pl-1">({data.DOANH_SO.length})</span>
                  )}
                </div>
                <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                  <div className="px-4 py-2.5 border-r col-span-3">
                    Hạng mục
                  </div>
                  <div className="px-4 py-2.5 text-right col-span-2">
                    Giá trị
                  </div>
                </div>

                <div>
                  {data?.DOANH_SO.map((item, index) => (
                    <div
                      className="grid grid-cols-5 font-medium border-b"
                      key={index}
                    >
                      <div className="px-4 py-2.5 border-r font-light col-span-3">
                        {item.Desc || "Doanh số"} - ({" "}
                        {moment(item.CreateDate).format("llll")} )
                        <div>{item.ProdTitle}</div>
                      </div>
                      <div className="px-4 py-2.5 text-right col-span-2">
                        {StringHelpers.formatVND(item.Value)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5">
                  <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                    Tổng doanh số
                  </div>
                  <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                    {StringHelpers.formatVND(
                      ArrayHelpers.sumTotal(data?.DOANH_SO, "Value")
                    )}
                  </div>
                </div>

                {data?.Kpi2Result?.ItemList &&
                  data?.Kpi2Result?.ItemList.length > 0 &&
                  data?.Kpi2Result?.ItemList.map((item, index) => (
                    <div
                      className="grid grid-cols-5 font-medium border-t"
                      key={index}
                    >
                      <div className="px-4 py-2.5 border-r font-light col-span-3">
                        <div>{item.CachTinh}</div>
                        <div>{item.Dieukien}</div>
                      </div>
                      <div className="px-4 py-2.5 text-right col-span-2">
                        {StringHelpers.formatVND(item.BonusValue)}
                      </div>
                    </div>
                  ))}

                {data?.THUONG_HOA_HONG_DOANH_SO &&
                  data?.THUONG_HOA_HONG_DOANH_SO?.ApplyList &&
                  data?.THUONG_HOA_HONG_DOANH_SO?.ApplyList.map(
                    (appy, index) => (
                      <div
                        className="grid grid-cols-5 font-medium border-t"
                        key={index}
                      >
                        <div className="px-4 py-2.5 border-r font-light col-span-3">
                          {appy.Type === 0
                            ? "KPI Chung"
                            : `KPI nhóm ${appy.Type}`}
                        </div>
                        <div className="px-4 py-2.5 text-right col-span-2">
                          {StringHelpers.formatVND(appy.Value)}
                        </div>
                      </div>
                    )
                  )}

                {data?.KpiTourResult?.KpiTour?.Condts &&
                  data?.KpiTourResult?.KpiTour?.Condts.length > 0 && (
                    <div className="grid grid-cols-5 font-medium border-t">
                      <div className="px-4 py-2.5 border-r font-light col-span-3">
                        KPI lương Tour <br />{" "}
                        {data?.KpiTourResult?.KpiTour?.Condts &&
                          data?.KpiTourResult?.KpiTour?.Condts.length > 0 && (
                            <>
                              {data?.KpiTourResult?.KpiTour?.Condts.map(
                                (x) => `${x.From} - ${x.To} : ${x.CalValue}`
                              ).join(", ")}
                            </>
                          )}
                      </div>
                      <div className="px-4 py-2.5 text-right col-span-2">
                        {StringHelpers.formatVND(data?.KpiTourResult?.Value)}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="bg-white mb-1.5">
              <div className="py-3 font-bold text-center uppercase border-b">
                Tạm ứng
                {data?.TAM_UNG?.length > 0 && (
                  <span className="pl-1">({data?.TAM_UNG?.length})</span>
                )}
              </div>
              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>

              <div>
                {data?.TAM_UNG.map((item, index) => (
                  <div
                    className="grid grid-cols-5 font-medium border-b"
                    key={index}
                  >
                    <div className="px-4 py-2.5 border-r font-light col-span-3">
                      {item.Desc || "Tạm ứng"} - ({" "}
                      {moment(item.CreateDate).format("llll")} )
                    </div>
                    <div className="px-4 py-2.5 text-right col-span-2">
                      {StringHelpers.formatVND(Math.abs(item.Value))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5">
                <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                  Tổng
                </div>
                <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                  {StringHelpers.formatVND(
                    Math.abs(ArrayHelpers.sumTotal(data?.TAM_UNG, "Value"))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white">
              <div className="py-3 font-bold text-center uppercase border-b">
                Hoàn ứng
                {data?.THU_HOAN_UNG?.length > 0 && (
                  <span className="pl-1">({data?.THU_HOAN_UNG?.length})</span>
                )}
              </div>
              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>

              <div>
                {data?.THU_HOAN_UNG.map((item, index) => (
                  <div
                    className="grid grid-cols-5 font-medium border-b"
                    key={index}
                  >
                    <div className="px-4 py-2.5 border-r font-light col-span-3">
                      {item.Desc || "Hoàn ứng"} - ({" "}
                      {moment(item.CreateDate).format("llll")} )
                    </div>
                    <div className="px-4 py-2.5 text-right col-span-2">
                      {StringHelpers.formatVND(Math.abs(item.Value))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5">
                <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                  Tổng
                </div>
                <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                  {StringHelpers.formatVND(
                    Math.abs(ArrayHelpers.sumTotal(data?.THU_HOAN_UNG, "Value"))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}

export default StatisticalDay;

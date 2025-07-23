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
} from "@heroicons/react/24/outline";
import { useQuery } from "react-query";
import StatisticalAPI from "../../api/Statistical.api";
import moment from "moment";
import StringHelpers from "../../helpers/StringHelpers";
import ArrayHelpers from "../../helpers/ArrayHelpers";
import { DatePickerWrap } from "../../partials/forms";
import clsx from "clsx";
import PickerStatistical from "./components/PickerStatistical";

function Statistical({ f7router }) {
  const Auth = useStore("Auth");
  const { Global } = useStore("Brand");
  const [filters, setFilters] = useState({
    mon: new Date(),
    userid: Auth?.ID,
  });
  let [SwitchOf, setSwitchOf] = useState({
    Sales: false,
    Rose: false,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Statistical", filters],
    queryFn: async () => {
      let newFilters = {
        ...filters,
        mon: moment(filters.mon).format("MM/YYYY"),
      };
      let { data } = await StatisticalAPI.getUserSalary(newFilters);
      return data?.data;
    },
    enabled: Boolean(Auth && Auth?.ID),
  });

  const SalaryTotal = () => {
    let value = 0; //luong du kien
    if (!data) return value;

    value += data.CHAM_CONG_TINH_LUONG
      ? data.LUONG_CHAM_CONG || 0
      : data.LUONG_CO_BAN || 0;

    value += ArrayHelpers.sumTotal(
      data.SalaryServices && data.SalaryServices.filter((z) => !z.IsPending),
      "Value"
    );
    value += ArrayHelpers.sumTotal(data.BonusSales, "Value");
    value += ArrayHelpers.sumTotal(data.Bonus, "Value");
    value -= ArrayHelpers.sumTotal(data.NGAY_NGHI, "Value");
    value -= ArrayHelpers.sumTotal(data.PHAT, "Value");

    value += data.PHU_CAP;
    value += data?.THUONG_HOA_HONG_DOANH_SO?.Value || 0;

    value += data?.KpiTourResult?.Value || 0;
    value += data?.Kpi2Result?.Value || 0;

    return value;
  };

  const getValueConfig = (dataConfig, nameConfig) => {
    if (!dataConfig) return 0;
    const index = dataConfig.findIndex((item) => item.Name === nameConfig);
    if (index > -1) {
      return dataConfig[index].Value;
    }
    return 0;
  };

  const getBonusWrap = ({ Items, Key }) => {
    if (Key === "SourceID" && !SwitchOf.Rose) {
      return Items;
    }
    if (Key === "OrderID" && !SwitchOf.Sales) {
      return Items;
    }
    let newArr = [];
    for (let item of Items) {
      let indexDay = newArr.findIndex(
        (x) =>
          moment(x.CreateDate).format("DD-MM-YYYY") ===
            moment(item.CreateDate).format("DD-MM-YYYY") && item[Key] === x[Key]
      );
      if (indexDay > -1) {
        newArr[indexDay].Value += item.Value;
        newArr[indexDay].ProdTitle = [
          ...newArr[indexDay].ProdTitles,
          item.ProdTitle,
        ].join(", ");
        newArr[indexDay].ProdTitles = [
          ...newArr[indexDay].ProdTitles,
          item.ProdTitle,
        ];
      } else {
        let obj = {
          ...item,
          CreateDate: item.CreateDate,
          Value: item.Value,
          ProdTitle: item.ProdTitle,
          ProdTitles: [item.ProdTitle],
        };
        newArr.push(obj);
      }
    }
    return newArr;
  };

  return (
    <Page
      name="Statistical"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
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
        <NavTitle>Thống kê  ({moment(filters.mon).format("MM-YYYY")})</NavTitle>
        <NavRight className="!justify-center w-12 h-full">
          <DatePickerWrap
            value={filters.mon}
            format="MM/YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                mon: val,
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
      <div className="pb-1.5">
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
            {!data?.TY_LE_GIU_LUONG ||
            (data?.CHI_GIU_LUONG &&
              data?.CHI_GIU_LUONG.length > 0 &&
              ArrayHelpers.sumTotal(data?.THU_GIU_LUONG, "Value") ===
                ArrayHelpers.sumTotal(data?.CHI_GIU_LUONG, "Value")) ? (
              <></>
            ) : (
              <div className="grid grid-cols-5 bg-white mb-1.5">
                <div className="col-span-3 px-4 py-4 font-semibold border-r text-danger">
                  Đã giữ lương {data?.THU_GIU_LUONG.length} tháng
                </div>
                <PickerStatistical
                  render={
                    <div>
                      <div className="px-4 mt-6 mb-5">
                        <div className="text-xl font-semibold text-center">
                          Chi tiết giữ lương
                        </div>
                      </div>
                      <div>
                        <div className="grid grid-cols-5 font-medium text-gray-400 border-t border-b">
                          <div className="px-4 py-2.5 border-r col-span-3">
                            Hạng mục
                          </div>
                          <div className="px-4 py-2.5 text-right col-span-2">
                            Giá trị
                          </div>
                        </div>

                        <div>
                          {data.THU_GIU_LUONG &&
                            data.THU_GIU_LUONG.map((item, index) => (
                              <div
                                className="grid grid-cols-5 font-medium border-b"
                                key={index}
                              >
                                <div className="px-4 py-2.5 border-r font-light col-span-3">
                                  {item.Desc} - Tháng {item.Rel}
                                </div>
                                <div className="px-4 py-2.5 text-right col-span-2">
                                  {StringHelpers.formatVND(item.Value)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  }
                >
                  {({ open }) => (
                    <div
                      className="px-4 py-2.5 font-semibold text-danger flex items-center justify-end col-span-2"
                      onClick={open}
                    >
                      <span>
                        {StringHelpers.formatVND(
                          ArrayHelpers.sumTotal(data?.THU_GIU_LUONG, "Value")
                        )}
                      </span>
                      <ExclamationCircleIcon className="w-5 mb-1 ml-2 text-warning" />
                    </div>
                  )}
                </PickerStatistical>
              </div>
            )}
            {(data?.CHI_LUONG && data.CHI_LUONG.length > 0) ||
            (data?.CHI_LUONG_TAT_CA && data?.CHI_LUONG_TAT_CA.length > 0) ? (
              <div className="mb-1.5 bg-white">
                <div className="py-3 font-bold text-center uppercase border-b">
                  Đã trả lương
                </div>
                {data?.CHI_LUONG_TAT_CA.map((o, idx) => (
                  <div className="grid grid-cols-5" key={idx}>
                    <div className="px-4 py-2.5 font-semibold border-r col-span-3">
                      Đã trả lần {idx + 1}
                    </div>
                    <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                      {StringHelpers.formatVND(o.Value)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-1.5 bg-white">
                <div className="py-3 font-bold text-center uppercase border-b">
                  Chưa trả lương
                </div>
                <div className="grid grid-cols-5">
                  <div className="px-4 py-2.5 font-semibold uppercase border-r col-span-3">
                    Dự kiến
                  </div>
                  <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                    {StringHelpers.formatVND(SalaryTotal())}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white mb-1.5">
              <PickerStatistical
                render={
                  <div>
                    <div className="px-4 mt-6 mb-5">
                      <div className="text-xl font-semibold text-center">
                        Lương chính sách
                      </div>
                    </div>
                    <div>
                      <div className="grid grid-cols-2 font-medium text-gray-400 border-t border-b">
                        <div className="px-4 py-2.5 border-r">Hạng mục</div>
                        <div className="px-4 py-2.5 text-right">Giá trị</div>
                      </div>

                      <div>
                        <div className="grid grid-cols-2 font-medium border-b">
                          <div className="px-4 py-2.5 border-r font-light">
                            Lương cơ bản
                          </div>
                          <div className="px-4 py-2.5 text-right">
                            {StringHelpers.formatVND(data.LUONG_CO_BAN_THANG)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 font-medium border-b">
                          <div className="px-4 py-2.5 border-r font-light">
                            Ngày công yêu cầu
                          </div>
                          <div className="px-4 py-2.5 text-right">
                            {data.NGAY_CONG}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 font-medium border-b">
                          <div className="px-4 py-2.5 border-r font-light">
                            Ngày nghỉ cho phép
                          </div>
                          <div className="px-4 py-2.5 text-right">
                            {getValueConfig(data.UserSalaryConfig, "NGAY_PHEP")}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 font-medium">
                          <div className="px-4 py-2.5 border-r font-light">
                            Phụ cấp
                          </div>
                          <div className="px-4 py-2.5 text-right">
                            {StringHelpers.formatVND(data.PHU_CAP)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              >
                {({ open }) => (
                  <div
                    className="py-2.5 font-bold text-center uppercase border-b flex justify-center"
                    onClick={open}
                  >
                    Lương theo chấm công
                    <ExclamationCircleIcon className="w-5 ml-2 text-warning" />
                  </div>
                )}
              </PickerStatistical>

              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>
              <div>
                <div className="grid grid-cols-5 font-medium border-b">
                  <div className="px-4 py-2.5 border-r font-light col-span-3">
                    Lương cơ bản
                  </div>
                  <div className="px-4 py-2.5 text-right col-span-2">
                    {StringHelpers.formatVND(data.LUONG_CO_BAN)}
                  </div>
                </div>
                <div className="grid grid-cols-5 font-medium border-b">
                  <div className="px-4 py-2.5 border-r font-light col-span-3">
                    Phụ cấp
                  </div>
                  <div className="px-4 py-2.5 text-right col-span-2">
                    {StringHelpers.formatVND(data.PHU_CAP)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5">
                <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                  Tổng
                </div>
                <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                  {StringHelpers.formatVND(
                    data.LUONG_CO_BAN -
                      ArrayHelpers.sumTotal(data?.NGAY_NGHI, "Value") +
                      data.PHU_CAP
                  )}
                </div>
              </div>
            </div>

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
              <div className="relative py-3 pl-4 font-bold uppercase border-b">
                Hoa hồng bán hàng
                {data?.BonusSales?.length > 0 && (
                  <span className="pl-1">({data?.BonusSales?.length})</span>
                )}
                <label className="absolute inline-flex items-center cursor-pointer right-4 top-[13px]">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={SwitchOf.Rose}
                    onChange={(e) =>
                      setSwitchOf((prevState) => ({
                        ...prevState,
                        Rose: e.target.checked,
                      }))
                    }
                  />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-primary" />
                </label>
              </div>
              <div className="grid grid-cols-5 font-medium text-gray-400 border-b">
                <div className="px-4 py-2.5 border-r col-span-3">Hạng mục</div>
                <div className="px-4 py-2.5 text-right col-span-2">Giá trị</div>
              </div>

              <div>
                {getBonusWrap({
                  Items: data?.BonusSales || [],
                  Key: "SourceID",
                }).map((item, index) => (
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

            {(data?.CHI_LUONG && data.CHI_LUONG.length > 0) ||
            (data?.CHI_LUONG_TAT_CA && data?.CHI_LUONG_TAT_CA.length > 0) ? (
              <></>
            ) : (
              <>
                {(data.DOANH_SO.length > 0 ||
                  data?.KpiTourResult?.Value > 0) && (
                  <div className="bg-white mb-1.5">
                    <div className="relative py-3 pl-4 font-bold uppercase border-b">
                      KPI
                      {data?.DOANH_SO?.length > 0 && (
                        <span className="pl-1">({data.DOANH_SO.length})</span>
                      )}
                      <label className="absolute inline-flex items-center cursor-pointer right-4 top-[13px]">
                        <input
                          type="checkbox"
                          checked={SwitchOf.Sales}
                          onChange={(e) =>
                            setSwitchOf((prevState) => ({
                              ...prevState,
                              Sales: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-primary" />
                      </label>
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
                      {getBonusWrap({
                        Items: data?.DOANH_SO || [],
                        Key: "OrderID",
                      }).map((item, index) => (
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
                              data?.KpiTourResult?.KpiTour?.Condts.length >
                                0 && (
                                <>
                                  {data?.KpiTourResult?.KpiTour?.Condts.map(
                                    (x) => `${x.From} - ${x.To} : ${x.CalValue}`
                                  ).join(", ")}
                                </>
                              )}
                          </div>
                          <div className="px-4 py-2.5 text-right col-span-2">
                            {StringHelpers.formatVND(
                              data?.KpiTourResult?.Value
                            )}
                          </div>
                        </div>
                      )}
                    {Global?.Admin?.kpi2 ? (
                      <div className="grid grid-cols-5 border-t">
                        <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                          Tổng *
                        </div>
                        <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                          {StringHelpers.formatVND(
                            (data?.Kpi2Result?.Value || 0) +
                              (data?.KpiTourResult?.Value || 0)
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 border-t">
                        <div className="px-4 py-2.5 text-sm font-semibold uppercase border-r col-span-3">
                          Tổng *
                        </div>
                        <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                          {StringHelpers.formatVND(
                            ArrayHelpers.sumTotal(
                              data?.THUONG_HOA_HONG_DOANH_SO?.ApplyList,
                              "Value"
                            ) + (data?.KpiTourResult?.Value || 0)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
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

            <div className="bg-white mb-1.5">
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

            {data && data?.CHI_LUONG.length === 0 && (
              <div className="bg-white">
                <div className="py-3 font-bold text-center uppercase border-b">
                  Lương của bạn
                </div>
                <div className="grid grid-cols-5 border-b">
                  <div className="px-4 py-2.5 text-sm font-semibold border-r col-span-3">
                    Dự kiến
                  </div>
                  <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                    {StringHelpers.formatVND(SalaryTotal())}
                  </div>
                </div>
                <div className="grid grid-cols-5 border-b">
                  <div className="px-4 py-2.5 text-sm font-semibold border-r col-span-3">
                    Giữ lương
                  </div>
                  <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                    {StringHelpers.formatVND(
                      data.TY_LE_GIU_LUONG > 100
                        ? data.TY_LE_GIU_LUONG
                        : Math.ceil(
                            (SalaryTotal() / 100) * data.TY_LE_GIU_LUONG
                          )
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-5 border-b">
                  <div className="px-4 py-2.5 text-sm font-semibold border-r col-span-3">
                    Tạm ứng còn lại
                  </div>
                  <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                    {StringHelpers.formatVND(Math.abs(data.TON_TAM_UNG))}
                  </div>
                </div>
                <div className="grid grid-cols-5">
                  <div className="px-4 py-2.5 text-sm font-semibold border-r col-span-3">
                    Lương thực nhận
                  </div>
                  <div className="px-4 py-2.5 font-semibold text-right text-danger col-span-2">
                    {StringHelpers.formatVND(
                      SalaryTotal() -
                        (data.TY_LE_GIU_LUONG > 100
                          ? data.TY_LE_GIU_LUONG
                          : Math.ceil(
                              (SalaryTotal() / 100) * data.TY_LE_GIU_LUONG
                            )) +
                        data.TON_TAM_UNG
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

export default Statistical;

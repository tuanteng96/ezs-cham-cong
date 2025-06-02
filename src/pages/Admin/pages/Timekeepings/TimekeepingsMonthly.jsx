import React, { useRef, useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
  useStore,
} from "framework7-react";
import {
  AdjustmentsVerticalIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { PickerFilterMonthly } from "./components";
import { useInfiniteQuery } from "react-query";
import NoFound from "@/components/NoFound";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import StringHelpers from "@/helpers/StringHelpers";
import clsx from "clsx";

const ItemRender = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border mb-3.5 last:mb-0 rounded">
      <div
        className={clsx(
          "px-4 py-3.5 flex justify-between transition-all",
          isOpen && "bg-gray-50"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          <div className="text-base font-medium text-primary">
            {item?.User?.FullName}
          </div>
          <div className="mt-px">
            Số công
            <span className="pl-1 text-[15px] font-bold font-lato">
              {item?.TrackValue?.WorkQty}
            </span>
            , Tổng lương
            <span className="pl-1.5 text-[15px] font-bold font-lato">
              {StringHelpers.formatVND(
                item?.TrackValue?.WorkQty * item.NGAY_LUONG_CO_BAN -
                  (item.TrackValue.DI_MUON + item.TrackValue.VE_SOM) +
                  (item.TrackValue.DI_SOM + item.TrackValue.VE_MUON) +
                  (item?.TrackValue?.WorkQtyAllowance || 0) *
                    (item?.TrackValue?.Config?.Values?.TRO_CAP_NGAY || 0)
              )}
            </span>
          </div>
        </div>
        <div className="flex justify-end w-8">
          <ChevronDownIcon
            className={clsx(
              "w-6 text-gray-400 transition-all",
              isOpen && "rotate-[180deg]"
            )}
          />
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t">
          <div className="flex justify-between pb-3 mb-3 border-b border-dashed last:mb-0 last:pb-0 last:border-0">
            <div className="text-[#222]">Số công</div>
            <div className="font-semibold font-lato w-[110px] text-right">
              {item?.TrackValue?.WorkQty}
            </div>
          </div>
          <div className="flex justify-between pb-3 mb-3 border-b border-dashed last:mb-0 last:pb-0 last:border-0">
            <div className="flex-1 text-[#222]">Phụ câp ngày</div>
            <div className="font-semibold font-lato w-[110px] text-right">
              {StringHelpers.formatVND(
                (item?.TrackValue?.WorkQtyAllowance || 0) *
                  (item?.TrackValue?.Config?.Values?.TRO_CAP_NGAY || 0)
              )}
            </div>
          </div>
          <div className="flex justify-between pb-3 mb-3 border-b border-dashed last:mb-0 last:pb-0 last:border-0">
            <div className="flex-1 text-[#222]">Tổng lương chấm công</div>
            <div className="font-semibold font-lato w-[110px] text-right">
              {StringHelpers.formatVND(
                item?.TrackValue?.WorkQty * item?.NGAY_LUONG_CO_BAN
              )}
            </div>
          </div>
          <div className="pb-3 mb-3 border-b border-dashed last:mb-0 last:pb-0 last:border-0">
            <div className="flex justify-between mb-3">
              <div className="flex-1 text-[#222]">
                Tổng phạt (Đi muộn, về sớm)
              </div>
              <div className="font-semibold font-lato w-[110px] text-right">
                {item?.TrackValue.DI_MUON + item?.TrackValue.VE_SOM > 0
                  ? `-${StringHelpers.formatVND(
                      item?.TrackValue.DI_MUON + item?.TrackValue.VE_SOM
                    )}`
                  : StringHelpers.formatVND(
                      item?.TrackValue.DI_MUON + item?.TrackValue.VE_SOM
                    )}
              </div>
            </div>
            <div className="pl-5">
              <div className="flex justify-between mb-3">
                <div className="flex-1 text-gray-500">
                  Số lần đi muộn việc cá nhân
                </div>
                <div className="font-semibold font-lato w-[50px] text-right">
                  {item?.TrackValue.SO_LAN_DI_MUON_CN}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="flex-1 text-gray-500">
                  Số lần về sớm việc cá nhân
                </div>
                <div className="font-semibold font-lato w-[50px] text-right">
                  {item?.TrackValue.SO_LAN_VE_SOM_CN}
                </div>
              </div>
            </div>
          </div>

          <div className="pb-3 mb-3 border-b border-dashed last:mb-0 last:pb-0 last:border-0">
            <div className="flex justify-between mb-3">
              <div className="flex-1 text-[#222]">Tổng Tăng ca, Thêm giờ</div>
              <div className="font-semibold font-lato w-[110px] text-right">
                {StringHelpers.formatVND(
                  item?.TrackValue.DI_SOM + item?.TrackValue.VE_MUON
                )}
              </div>
            </div>
            <div className="pl-5">
              <div className="flex justify-between mb-3">
                <div className="flex-1 text-gray-500">
                  Số lần đi sớm việc công ty
                </div>
                <div className="font-semibold font-lato w-[50px] text-right">
                  {item?.TrackValue.SO_LAN_DI_SOM_CTY}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="flex-1 text-gray-500">
                  Số lần về muộn việc công ty
                </div>
                <div className="font-semibold font-lato w-[50px] text-right">
                  {item?.TrackValue.SO_LAN_VE_MUON_CTY}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between pb-3 mb-3 border-b border-dashed last:mb-0 last:pb-0 last:border-0">
            <div className="flex-1 text-[#222]">Tổng lương</div>
            <div className="text-base font-bold font-lato text-success w-[110px] text-right">
              {StringHelpers.formatVND(
                item?.TrackValue?.WorkQty * item.NGAY_LUONG_CO_BAN -
                  (item.TrackValue.DI_MUON + item.TrackValue.VE_SOM) +
                  (item.TrackValue.DI_SOM + item.TrackValue.VE_MUON) +
                  (item?.TrackValue?.WorkQtyAllowance || 0) *
                    (item?.TrackValue?.Config?.Values?.TRO_CAP_NGAY || 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TimekeepingsMonthly({ f7route }) {
  const allowInfinite = useRef(true);

  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");

  const [filters, setFilters] = useState({
    mon: new Date(),
    pi: 1,
    ps: 12,
    stockid: CrStocks
      ? { ...CrStocks, value: CrStocks?.ID, label: CrStocks.Title }
      : "",
  });

  const { data, isLoading, isFetchingNextPage, refetch, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["TimeKeepinsgMonthly", filters],
      queryFn: async ({ pageParam = 1 }) => {
        const { data } = await AdminAPI.getTimekeepingsMonthly({
          data: {
            ...filters,
            pi: pageParam,
            ps: 12,
            mon: moment(filters.mon).format("MM/YYYY"),
            stockid: filters?.stockid?.value || "",
          },
          Token: Auth.token,
        });

        return {
          ...data,
          pi: pageParam,
        };
      },
      getNextPageParam: (lastPage, pages) => {
        return lastPage.pi === lastPage.pcount ? undefined : lastPage.pi + 1;
      },
      keepPreviousData: true,
    });

  const Lists = ArrayHelpers.useInfiniteQuery(data?.pages, "list");

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      className="!bg-white"
      name="Timekeepings-monthly"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={isFetchingNextPage}
      onInfinite={loadMore}
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
        <NavTitle>Xem chấm công tháng</NavTitle>
        <NavRight className="h-full">
          <PickerFilterMonthly
            initialValues={filters}
            onChange={(val) =>
              setFilters((prevState) => ({
                ...prevState,
                mon: val?.mon,
                stockid: val?.stockid,
              }))
            }
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
          </PickerFilterMonthly>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div>
        {isLoading && (
          <div className="p-4">
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
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                    </div>
                  </div>
                  <Link
                    noLinkClass
                    className="flex items-baseline justify-end w-12 h-12 opacity-50"
                  >
                    <EllipsisHorizontalIcon className="w-6" />
                  </Link>
                </div>
              ))}
          </div>
        )}
        {!isLoading && (
          <div>
            {Lists && Lists.length > 0 && (
              <div className="p-4">
                {Lists.map((item, index) => (
                  <ItemRender item={item} key={index} />
                ))}
              </div>
            )}
            {(!Lists || Lists.length === 0) && (
              <div className="px-4">
                <NoFound
                  Title="Chưa cài đặt ca làm việc."
                  Desc="Chưa có cài đặt ca làm việc. Vui lòng thêm mới ca làm việc ?"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

export default TimekeepingsMonthly;

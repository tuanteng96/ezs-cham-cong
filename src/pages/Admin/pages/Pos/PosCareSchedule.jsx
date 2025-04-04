import AdminAPI from "@/api/Admin.api";
import NoFound from "@/components/NoFound";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import PromHelpers from "@/helpers/PromHelpers";
import {
  AdjustmentsVerticalIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import moment from "moment";
import React, { useRef, useState } from "react";
import { useInfiniteQuery } from "react-query";
import { PickerCareScheduleFilter } from "./components";

const RenderItem = ({ item }) => {
  let [show, setShow] = useState(false);
  return (
    <div className="mb-3.5 last:mb-0 border shadow rounded">
      <div
        className="flex items-center justify-between pl-4 border-b bg-gray-50 h-[46px]"
        onClick={() => setShow(!show)}
      >
        <div className="font-semibold text-[15px] font-lato">
          {moment(item.CreateDate).format("HH:mm DD-MM-YYYY")}
        </div>
        <div className="flex items-center justify-center w-12 text-gray-700 h-11">
          <EllipsisVerticalIcon className="w-6" />
        </div>
      </div>
      <div className="flex justify-between px-4 py-3 border-b">
        <div className="text-gray-600 w-[100px]">Cơ sở</div>
        <div className="flex-1 font-medium text-right">{item.StockTitle}</div>
      </div>
      <div className="flex justify-between px-4 py-3 border-b">
        <div className="text-gray-600 w-[100px]">Ngày chăm sóc</div>
        <div className="flex-1 font-medium text-right">{moment(item.SendDate).format("DD-MM-YYYY")}</div>
      </div>
      <div className="flex justify-between px-4 py-3 border-b">
        <div className="text-gray-600 w-[100px]">ID Khách hàng</div>
        <div className="flex-1 font-medium text-right">{item.MemberID}</div>
      </div>
      <div className="flex justify-between px-4 py-3 border-b">
        <div className="text-gray-600 w-[100px]">Khách hàng</div>
        <div className="flex-1 font-medium text-right">{item.FullName}</div>
      </div>
      <div className="flex justify-between px-4 py-3 border-b">
        <div className="text-gray-600 w-[100px]">Số điện thoại</div>
        <div className="flex-1 font-medium text-right">{item.MobilePhone}</div>
      </div>
      {show && (
        <>
          <div className="px-4 py-3 border-b">
            <div className="mb-1 text-gray-600">Dịch vụ</div>
            <div className="font-medium">{item.OrderTitle}</div>
          </div>
          <div className="p-4">
            <div className="mb-1 text-gray-600">Tiêu đề gửi / Nội dung gửi</div>
            <div>
              <div className="font-medium">{item.Title}</div>
              <div>{item.Content}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function PosCareSchedule(props) {
  const allowInfinite = useRef(true);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const [filters, setFilters] = useState({
    MemberIDs: [],
    StockID: [CrStocks?.ID],
    DateStart: new Date(),
    DateEnd: new Date(),
    Pi: 1,
    Ps: 15,
  });

  const CareScheduleQuery = useInfiniteQuery({
    queryKey: ["PosCareSchedule", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await AdminAPI.getCareSchedule({
        data: {
          ...filters,
          StockID: [CrStocks?.ID],
          DateStart: moment(filters.DateStart).format("YYYY-MM-DD"),
          DateEnd: moment(filters.DateEnd).format("YYYY-MM-DD"),
          Pi: pageParam,
          Ps: 20,
          MemberIDs: filters.MemberIDs?.value
            ? [filters?.MemberIDs?.value]
            : [],
        },
        Token: Auth?.token,
      });
      return data?.data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.Pi === lastPage.PCount ? undefined : lastPage.Pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    CareScheduleQuery?.data?.pages,
    "Items"
  );

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    CareScheduleQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      className="bg-white"
      name="Pos-care-schedule"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      noToolbar
      ptr
      onPtrRefresh={(done) => CareScheduleQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={CareScheduleQuery.isLoading}
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
        <NavTitle>Lịch chăm sóc</NavTitle>
        <NavRight className="h-full">
          <PickerCareScheduleFilter
            filters={filters}
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                ...val,
              }));
            }}
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
          </PickerCareScheduleFilter>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {Lists && Lists.length > 0 && (
        <div className="p-4">
          {Lists.map((item, index) => (
            <RenderItem item={item} key={index} />
          ))}
        </div>
      )}
      {(!Lists || Lists.length === 0) && (
        <NoFound
          Title="Không có kết quả nào."
          Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
        />
      )}
    </Page>
  );
}

export default PosCareSchedule;

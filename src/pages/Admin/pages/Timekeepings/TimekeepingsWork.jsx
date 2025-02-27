import React, {
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { PickerFilterMonthly } from "./components";
import { useInfiniteQuery, useQuery } from "react-query";
import NoFound from "@/components/NoFound";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import StringHelpers from "@/helpers/StringHelpers";
import clsx from "clsx";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  ScrollMenu,
  VisibilityContext,
  getItemsPos,
  slidingWindow,
} from "react-horizontal-scrolling-menu";
import { useDrag } from "@/hooks";
import { DatePickerWrap } from "@/partials/forms";

function ItemDate({ itemId, selected, onClick, item }) {
  const visibility = useContext(VisibilityContext);
  const isVisible = visibility.useIsVisible(itemId, true);

  return (
    <div
      onClick={() => onClick(visibility)} // NOTE: for center items
      role="button"
      tabIndex={0}
      className={clsx(
        "w-14 rounded-lg h-16 flex items-center justify-center transition-all",
        selected ? "bg-primary text-white shadow-3xl" : "bg-[#f7f8fb]"
      )}
    >
      <div className="text-center">
        <div className="text-base font-bold font-lato">
          {moment(item.Date).format("DD")}
        </div>
        <div className="text-xs opacity-70">
          Thg {moment(item.Date).format("M")}
        </div>
      </div>
    </div>
  );
}

function TimekeepingsWork({ f7route }) {
  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");

  const dragState = useRef(new useDrag());
  const swiperRef = useRef();
  const apiRef = useRef();

  const [selected, setSelected] = useState(Number(moment().format("DD")) - 1);

  const [filters, setFilters] = useState({
    Month: new Date(),
    StockID: CrStocks?.ID,
  });

  const { isLoading, data, refetch } = useQuery({
    queryKey: ["TimeKeepinsgWork", filters],
    queryFn: async () => {
      const newObj = {
        ...filters,
        mon: filters.Month ? moment(filters.Month).format("MM/YYYY") : "",
      };
      const { data } = await AdminAPI.getTimekeepingsWork({
        data: newObj,
        Token: Auth?.token,
      });
      return {
        ...data,
        days: data.days
          ? data.days
              .map((x) => ({
                ...x,
                Users: x.Users
                  ? x.Users.filter(
                      (u) =>
                        WorksHelpers.getTimeWork({
                          WorkTimeSetting: u.WorkTimeSetting,
                          CA_LAM_VIEC: data.calamviecconfig,
                          INDEX_NGAY:
                            Number(moment(x.Date).day()) === 0
                              ? 6
                              : Number(moment(x.Date).day()) - 1,
                        }) ||
                        (u.WorkTrack && u.WorkTrack?.CheckIn)
                    ).map((u) => {
                      let is = 1;
                      if (
                        moment().format("DD-MM-YYYY") ===
                        moment(x.Date).format("DD-MM-YYYY")
                      ) {
                        is = 1;
                      } else if (moment().isBefore(moment(x.Date), "D")) {
                        is = 2;
                      } else {
                        is = 0;
                      }
                      return {
                        ...u,
                        is,
                      };
                    })
                  : [],
              }))
              .map((x) => {
                if (
                  moment().format("DD-MM-YYYY") ===
                  moment(x.Date).format("DD-MM-YYYY")
                ) {
                  return {
                    ...x,
                  };
                } else if (moment().isBefore(moment(x.Date), "D")) {
                  return {
                    ...x,
                  };
                } else {
                  return {
                    ...x,
                    Users: x.Users
                      ? x.Users.filter(
                          (u) => u.WorkTrack && u.WorkTrack.CheckIn
                        )
                      : [],
                  };
                }
              })
          : [],
      };
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    if (apiRef) {
      function getSelected() {
        let elSelect = apiRef?.current?.getItemById(selected);
        if (elSelect) {
          apiRef?.current?.scrollToItem(
            apiRef?.current?.getItemById(selected),
            "smooth",
            "center",
            "nearest"
          );
        } else {
          setTimeout(() => getSelected(), 50);
        }
      }
      getSelected();
    }
  }, [apiRef, filters]);

  const handleDrag =
    ({ scrollContainer }) =>
    (ev) =>
      dragState.current.dragMove(ev, (posDiff) => {
        if (scrollContainer.current) {
          scrollContainer.current.scrollLeft += posDiff;
        }
      });

  const handleItemClick =
    (itemId) =>
    ({ getItemById, scrollToItem }) => {
      if (dragState.current.dragging) {
        return false;
      }
      //setSelected(itemId);
      swiperRef?.current?.swiper?.slideTo(itemId);
      scrollToItem(getItemById(itemId), "smooth", "center", "nearest");
    };

  return (
    <Page
      className="!bg-white"
      name="Timekeepings-work"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
      noSwipeback
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
        <NavTitle>Xem lịch làm việc</NavTitle>
        <NavRight className="h-full">
          <DatePickerWrap
            value={filters.Month}
            format="MM-YYYY"
            onChange={(val) => {
              if (
                moment().format("MM/YYYY") === moment(val).format("MM/YYYY")
              ) {
                swiperRef?.current?.swiper?.slideTo(
                  Number(moment().format("DD")) - 1
                );
                setSelected(Number(moment().format("DD")) - 1);
              } else {
                swiperRef?.current?.swiper?.slideTo(0);
                setSelected(0);
              }
              setFilters((prevState) => ({
                ...prevState,
                Month: val,
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
      <div className="flex flex-col h-full">
        {isLoading && (
          <>
            <div className="flex gap-3 py-3.5 px-4">
              {Array(5)
                .fill()
                .map((_, i) => (
                  <div
                    className="flex items-center justify-center h-16 transition-all bg-gray-200 rounded-lg w-14 animate-pulse"
                    key={i}
                  ></div>
                ))}
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              {Array(2)
                .fill()
                .map((_, i) => (
                  <div
                    className="flex items-center justify-center w-full h-24 transition-all bg-gray-100 rounded-lg animate-pulse"
                    key={i}
                  ></div>
                ))}
            </div>
          </>
        )}
        {!isLoading && (
          <>
            <div className="h-[92px]">
              <div className="px-4" onMouseLeave={dragState.current.dragStop}>
                <ScrollMenu
                  // LeftArrow={LeftArrow}
                  // RightArrow={RightArrow}
                  //onWheel={onWheel}
                  onMouseDown={() => dragState.current.dragStart}
                  onMouseUp={({ getItemById, scrollToItem, items }) =>
                    () => {
                      // NOTE: for center items
                      dragState.current.dragStop();
                      const { center } = getItemsPos(items.getVisible());
                      scrollToItem(getItemById(center), "smooth", "center");
                    }}
                  onMouseMove={handleDrag}
                  scrollContainerClassName="gap-3 py-3.5 no-scrollbar"
                  apiRef={apiRef}
                >
                  {data?.days &&
                    data.days.map((item, index) => (
                      <ItemDate
                        item={item}
                        itemId={index}
                        key={index}
                        onClick={handleItemClick(index)}
                        selected={index === selected}
                      />
                    ))}
                </ScrollMenu>
              </div>
            </div>
            <Swiper
              className="w-full h-[calc(100%-108px)]"
              spaceBetween={50}
              slidesPerView={1}
              initialSlide={selected}
              ref={swiperRef}
              onActiveIndexChange={(swiperCore) => {
                setSelected(swiperCore.activeIndex);
              }}
            >
              {data?.days &&
                data.days.map((item, index) => (
                  <SwiperSlide key={index}>
                    <div className="h-full p-4 overflow-auto">
                      {item.Users &&
                        item.Users.map((user, i) => (
                          <div
                            className="mb-2.5 last:mb-0 bg-[#9a9a9a] rounded-sm text-white p-2.5 cursor-pointer"
                            key={i}
                          >
                            <div>{user.User?.FullName}</div>
                            {user.is === 0 && user?.WorkTrack?.CheckIn && (
                              <div className="mt-1.5 last:mt-0">
                                <span className="pr-1.5">Chấm công</span>
                                {user?.WorkTrack?.CheckIn
                                  ? moment(user?.WorkTrack?.CheckIn).format(
                                      "HH:mm"
                                    )
                                  : "--:--"}
                                <span className="px-2">-</span>
                                {user?.WorkTrack?.CheckOut
                                  ? moment(user?.WorkTrack?.CheckOut).format(
                                      "HH:mm"
                                    )
                                  : "--:--"}
                              </div>
                            )}
                            {user.is === 1 && (
                              <>
                                <div className="mb-1.5">
                                  {WorksHelpers.getTimeWork({
                                    WorkTimeSetting: user.WorkTimeSetting,
                                    CA_LAM_VIEC: data.calamviecconfig,
                                    INDEX_NGAY:
                                      Number(moment(item.Date).day()) === 0
                                        ? 6
                                        : Number(moment(item.Date).day()) - 1,
                                  })}
                                </div>
                                {user?.WorkTrack?.CheckIn && (
                                  <div className="p-2 mb-2 text-white rounded-sm cursor-pointer last:mb-0 bg-success">
                                    <span className="pr-1.5">Chấm công</span>
                                    {user?.WorkTrack?.CheckIn
                                      ? moment(user?.WorkTrack?.CheckIn).format(
                                          "HH:mm"
                                        )
                                      : "--:--"}
                                    <span className="px-2">-</span>
                                    {user?.WorkTrack?.CheckOut
                                      ? moment(
                                          user?.WorkTrack?.CheckOut
                                        ).format("HH:mm")
                                      : "--:--"}
                                  </div>
                                )}
                              </>
                            )}
                            {user.is === 2 && (
                              <div>
                                {WorksHelpers.getTimeWork({
                                  WorkTimeSetting: user.WorkTimeSetting,
                                  CA_LAM_VIEC: data.calamviecconfig,
                                  INDEX_NGAY:
                                    Number(moment(item.Date).day()) === 0
                                      ? 6
                                      : Number(moment(item.Date).day()) - 1,
                                })}
                              </div>
                            )}
                            {user.Offs && user.Offs.length > 0 && (
                              <div className="mt-1">
                                {user.Offs.map((off, i) => (
                                  <div
                                    div
                                    className="mb-1.5 last:mb-0 bg-danger rounded-sm text-white p-2 cursor-pointer"
                                    key={i}
                                  >
                                    <div>
                                      <span className="pr-1.5">Nghỉ từ</span>
                                      {moment(off.From).format("HH:mm")}
                                      <span className="px-1.5">-</span>
                                      {moment(off.To).format("HH:mm")}
                                    </div>
                                    {off.Desc && <div>Lý do : {off.Desc}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      {item.Users &&
                        item.Users.filter((x) => !x.WorkTimeSetting).map(
                          (user, i) => (
                            <Fragment key={i}>
                              {user.Offs &&
                                user.Offs.map((off, i) => (
                                  <div
                                    div
                                    className="mb-1.5 last:mb-0 bg-danger rounded-sm text-white p-2 cursor-pointer"
                                    key={i}
                                  >
                                    <div>{user.User?.FullName}</div>
                                    <div>
                                      {moment(off.From).format("HH:mm")}
                                      <span className="px-1.5">-</span>
                                      {moment(off.To).format("HH:mm")}
                                    </div>
                                    {off.Desc && <div>{off.Desc}</div>}
                                  </div>
                                ))}
                            </Fragment>
                          )
                        )}
                      {(!item?.Users || item?.Users?.length === 0) && (
                        <div className="flex items-center justify-center min-h-full">
                          Chưa có lịch làm việc ?
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                ))}
            </Swiper>
          </>
        )}
      </div>
    </Page>
  );
}

export default TimekeepingsWork;

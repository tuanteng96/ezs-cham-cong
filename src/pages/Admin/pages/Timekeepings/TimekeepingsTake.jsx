import React, { useRef, useState } from "react";
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
import { useInfiniteQuery, useMutation } from "react-query";
import NoFound from "@/components/NoFound";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import clsx from "clsx";
import { toast } from "react-toastify";
import { PickerFilterTake, PickerTake } from "./components";

function TimekeepingsTake({ f7route }) {
  const allowInfinite = useRef(true);

  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");

  const [filters, setFilters] = useState({
    filter: {
      From: new Date(),
      To: new Date(),
      StockID: CrStocks
        ? { ...CrStocks, value: CrStocks?.ID, label: CrStocks.Title }
        : "",
      UserIDs: "",
    },
    pi: 1,
    ps: 12,
  });

  const { data, isLoading, isFetchingNextPage, refetch, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["TimekeepingsTake", filters],
      queryFn: async ({ pageParam = 1 }) => {
        const { data } = await AdminAPI.getTimekeepingsTakeBreak({
          data: {
            ...filters,
            pi: pageParam,
            filter: {
              ...filters.filter,
              From: filters.filter?.From
                ? moment(filters.filter?.From).format("YYYY-MM-DD")
                : "",
              To: filters.filter?.To
                ? moment(filters.filter?.To).format("YYYY-MM-DD")
                : "",
              StockID: filters.filter?.StockID?.value || "",
              UserIDs: filters.filter?.UserIDs
                ? [filters.filter?.UserIDs?.value]
                : "",
            },
          },
          Token: Auth.token,
        });

        return {
          ...data,
        };
      },
      getNextPageParam: (lastPage, pages) => {
        return lastPage.pi === lastPage.pcount ? undefined : lastPage.pi + 1;
      },
      keepPreviousData: true,
    });

  const Lists = ArrayHelpers.useInfiniteQuery(data?.pages, "list");

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.actionTimekeepingsTakeBreak(body);
      await refetch();
      return rs;
    },
  });

  const onDelete = (item) => {
    const dataPost = {
      delete: [item.ID],
    };

    f7.dialog.confirm("Xác nhận xoá lịch xin nghỉ ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      deleteMutation.mutate(
        {
          data: dataPost,
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            toast.success("Xoá thành công.");
            f7.dialog.close();
          },
        }
      );
    });
  };

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
      name="Timekeepings-take"
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
        <NavTitle>Danh sách xin nghỉ</NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            popoverOpen=".popover-timekeeping-take"
          >
            <EllipsisVerticalIcon className="w-6" />
          </Link>
          <Popover className="popover-timekeeping-take w-[180px]">
            <div className="flex flex-col py-1.5">
              <PickerFilterTake
                initialValues={filters}
                onChange={(val) => {
                  setFilters((prevState) => ({
                    ...prevState,
                    filter: val,
                  }));
                }}
              >
                {({ open }) => (
                  <Link
                    onClick={open}
                    className="py-3 px-3.5 font-medium border-b"
                    popoverClose
                    noLinkClass
                  >
                    Bộ lọc
                  </Link>
                )}
              </PickerFilterTake>

              <PickerTake>
                {({ open }) => (
                  <Link
                    onClick={open}
                    popoverClose
                    className="py-3 px-3.5 font-medium text-success"
                    noLinkClass
                  >
                    Thêm mới lịch nghỉ
                  </Link>
                )}
              </PickerTake>
            </div>
          </Popover>
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
                  <div className="border mb-3.5 last:mb-0 rounded" key={index}>
                    <div className="flex justify-between border-b bg-gray-50">
                      <div className="font-medium text-[15px] text-primary py-3.5 pl-4 flex-1">
                        {item?.User?.FullName}
                      </div>
                      <Link
                        className="flex items-center justify-center w-12"
                        popoverOpen={`.popover-timekeeping-${item.ID}`}
                      >
                        <EllipsisHorizontalIcon className="w-6" />
                      </Link>
                      <Popover
                        className={clsx(
                          `popover-timekeeping-${item.ID}`,
                          "w-[120px]"
                        )}
                      >
                        <div className="flex flex-col py-1.5">
                          <PickerTake initialValues={item}>
                            {({ open }) => (
                              <Link
                                onClick={open}
                                className="py-3 px-3.5 font-medium border-b"
                                popoverClose
                                noLinkClass
                              >
                                Chỉnh sửa
                              </Link>
                            )}
                          </PickerTake>

                          <Link
                            popoverClose
                            className="py-3 px-3.5 font-medium text-danger"
                            noLinkClass
                            onClick={() => onDelete(item)}
                          >
                            Xoá
                          </Link>
                        </div>
                      </Popover>
                    </div>
                    <div className="p-4">
                      <div className="mb-2.5 last:mb-0">
                        <div className="mb-px text-gray-500">
                          Thời gian nghỉ (Bắt đầu - Kết thúc)
                        </div>
                        <div className="font-lato font-semibold text-[15px]">
                          {moment(item.From).format("HH:mm DD/MM/YYYY")}
                          <span className="px-2">-</span>
                          {moment(item.To).format("HH:mm DD/MM/YYYY")}
                        </div>
                      </div>
                      {item?.Desc && (
                        <div className="mb-2.5 last:mb-0">
                          <div className="mb-px text-gray-500">Lý do</div>
                          <div className="font-medium">{item?.Desc}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(!Lists || Lists.length === 0) && (
              <div className="px-4">
                <NoFound
                  Title="Chưa có lịch xin nghỉ."
                  Desc="Lịch xin nghỉ trong khoảng thời gian này trống ?"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

export default TimekeepingsTake;

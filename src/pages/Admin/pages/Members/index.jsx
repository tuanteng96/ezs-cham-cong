import React, { useRef, useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  f7,
  Input,
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
  Popover,
  Subnavbar,
  useStore,
} from "framework7-react";
import {
  AdjustmentsVerticalIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import AdminAPI from "@/api/Admin.api";
import { useInfiniteQuery, useMutation } from "react-query";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import NoFound from "@/components/NoFound";
import clsx from "clsx";
import { PickerFilter, PickerRating, PickerShare } from "./components";
import { toast } from "react-toastify";
import PickerChangePassword from "./components/PickerChangePassword";

function MembersAdmin(props) {
  const allowInfinite = useRef(true);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const [filters, setFilters] = useState({
    Key: "",
    Pi: 1,
    Ps: 12,
    GroupIDs: [],
    Levels: [],
    Status: [
      {
        value: 0,
        label: "Hoạt động",
      },
    ],
    StockIDs: CrStocks
      ? {
          label: CrStocks?.Title,
          value: CrStocks?.ID,
        }
      : null,
    Order: "[Order]",
  });

  const MembersQuery = useInfiniteQuery({
    queryKey: ["MembersLists", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await AdminAPI.listMembers({
        data: {
          ...filters,
          Pi: pageParam,
          StockIDs: filters?.StockIDs ? [filters?.StockIDs?.value] : [],
          GroupIDs: filters.GroupIDs
            ? filters.GroupIDs.map((x) => x.value)
            : [],
          Status: filters.Status ? filters.Status.map((x) => x.value) : [],
        },
        Token: Auth.token,
      });
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.Pi === lastPage.Pcount ? undefined : lastPage.Pi + 1,
    keepPreviousData: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let result = await AdminAPI.updateMembers(body);
      await MembersQuery.refetch();
      return result;
    },
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    MembersQuery?.data?.pages,
    "Items"
  );

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;
    MembersQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  const onDisable = (item) => {
    f7.dialog.confirm(
      `Xác nhận ${
        !item?.Disabled ? "vô hiệu hoá tài" : "mở lại tài khoản"
      } khoản nhân viên này ?`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        updateMutation.mutate(
          {
            data: {
              updates: [
                {
                  UserID: item.ID,
                  Disabled: !item.Disabled,
                },
              ],
            },
            Token: Auth?.token,
            StockID: CrStocks?.ID,
          },
          {
            onSuccess: () => {
              toast.success("Thực hiện thành công.");
              f7.dialog.close();
            },
          }
        );
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="MembersAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => MembersQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={MembersQuery.isFetchingNextPage}
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
        <NavTitle>Quản lý nhân viên</NavTitle>
        <NavRight className="h-full">
          {/* <Link
            href="/admin/members/add"
            noLinkClass
            className="!text-white flex item-center justify-center bg-success text-[14px] h-8 px-2 rounded items-center"
          >
            Thêm mới
          </Link> */}
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            href="/admin/members/add"
          >
            <PlusIcon className="w-6" />
          </Link>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>

        <Subnavbar className="[&>div]:px-0 shadow-lg">
          <div className="relative w-full">
            <Input
              className="[&_input]:border-0 [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14"
              type="text"
              placeholder="Tìm kiếm nhân viên ..."
              value={filters.Key}
              clearButton={false}
              onInput={(e) => {
                setFilters((prevState) => ({
                  ...prevState,
                  Key: e.target.value,
                }));
              }}
            />
            <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
              <MagnifyingGlassIcon className="w-6 text-gray-500" />
            </div>
            <PickerFilter
              initialValues={filters}
              onChange={(val) =>
                setFilters((prevState) => ({
                  ...prevState,
                  ...val,
                }))
              }
            >
              {({ open }) => (
                <div
                  className="absolute top-0 right-0 flex items-center justify-center h-full px-4 rounded"
                  onClick={open}
                >
                  <AdjustmentsVerticalIcon className="w-6 text-black" />
                </div>
              )}
            </PickerFilter>
          </div>
        </Subnavbar>
      </Navbar>
      <div className="p-4">
        {MembersQuery.isLoading && (
          <>
            {Array(2)
              .fill()
              .map((_, index) => (
                <div
                  className="mb-4 overflow-hidden rounded shadow last:mb-0"
                  key={index}
                >
                  <div className="relative px-4 py-3 bg-gray-100 border-b">
                    <div className="w-8/12 h-3.5 bg-gray-200 rounded-full animate-pulse mb-1.5"></div>
                    <div className="w-5/12 h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="p-4">
                    <div className="w-full h-2.5 bg-gray-200 rounded-full animate-pulse mb-1.5"></div>
                    <div className="w-5/12 h-2.5 bg-gray-200 rounded-full animate-pulse mb-3.5"></div>
                    <div className="w-8/12 h-2.5 bg-gray-200 rounded-full animate-pulse mb-1.5"></div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full animate-pulse mb-1.5"></div>
                    <div className="w-5/12 h-2.5 bg-gray-200 rounded-full animate-pulse mb-3.5"></div>
                    <div className="w-8/12 h-2.5 bg-gray-200 rounded-full animate-pulse mb-1.5"></div>
                    <div className="w-11/12 h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
          </>
        )}

        {!MembersQuery.isLoading && (
          <>
            {Lists && Lists.length > 0 && (
              <>
                {Lists.map((item, index) => (
                  <div
                    className="mb-4 overflow-hidden rounded shadow last:mb-0"
                    key={index}
                  >
                    <div>
                      <div className="relative flex justify-between px-4 py-2.5 border-b bg-gray-100">
                        <div>
                          <div>
                            <span className="font-medium">
                              {item?.FullName}
                            </span>
                            <span
                              className={clsx(
                                "pl-1",
                                !item?.Disabled ? "text-success" : "text-danger"
                              )}
                            >
                              - {!item?.Disabled ? "Hoạt động" : "Đã nghỉ"}
                            </span>
                          </div>
                          <div className="mt-1 text-muted2 text-[14px] font-number flex items-start">
                            <span>#{item?.ID}</span>
                            <span>- {item?.UserName}</span>
                            <div className="px-1">/</div>
                            <div>
                              <PickerRating initialValues={item}>
                                {({ open }) => (
                                  <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={open}
                                  >
                                    {[1, 2, 3, 4, 5].map((x, i) => (
                                      <svg
                                        key={i}
                                        className={clsx(
                                          "w-[18px]",
                                          item?.AverRate < x
                                            ? "text-gray-300"
                                            : "text-warning"
                                        )}
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="currentColor"
                                        viewBox="0 0 22 20"
                                      >
                                        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                                      </svg>
                                    ))}
                                  </div>
                                )}
                              </PickerRating>
                            </div>
                            <div className="px-1">/</div>
                            <span>
                              {item?.SoCaYeuCau === null ||
                              item?.SoCaYeuCau === ""
                                ? "Chưa xác định"
                                : item?.SoCaYeuCau}
                            </span>
                          </div>
                        </div>
                        <Link
                          popoverOpen={`.popover-members-${item.ID}`}
                          noLinkClass
                          className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                        >
                          <EllipsisVerticalIcon className="w-6" />
                        </Link>
                        <Popover
                          className={clsx(
                            "w-[200px]",
                            `popover-members-${item.ID}`
                          )}
                        >
                          <div className="flex flex-col py-1.5">
                            <PickerShare initialValues={item}>
                              {({ open }) => (
                                <Link
                                  popoverClose
                                  className="flex justify-between p-3 font-medium border-b last:border-0"
                                  noLinkClass
                                  onClick={open}
                                >
                                  Thông tin đăng nhập
                                </Link>
                              )}
                            </PickerShare>

                            <Link
                              href={`/admin/members/${item.ID}?FullName=${item?.FullName}&UserName=${item?.UserName}`}
                              popoverClose
                              className="flex justify-between p-3 font-medium border-b last:border-0"
                              noLinkClass
                            >
                              Chỉnh sửa thông tin
                            </Link>
                            <PickerChangePassword item={item}>
                              {({ open }) => (
                                <Link
                                  popoverClose
                                  className="flex justify-between p-3 font-medium border-b last:border-0"
                                  noLinkClass
                                  onClick={open}
                                >
                                  Đổi mật khẩu
                                </Link>
                              )}
                            </PickerChangePassword>
                            <Link
                              popoverClose
                              className="flex justify-between p-3 font-medium border-b last:border-0 text-danger"
                              noLinkClass
                              onClick={() => onDisable(item)}
                            >
                              {!item?.Disabled
                                ? "Vô hiệu hoá tài khoản"
                                : "Mở lại tài khoản"}
                            </Link>
                          </div>
                        </Popover>
                      </div>
                      <div className="p-4">
                        <div className="mb-4 last:mb-0">
                          <div className="mb-1 text-sm text-muted2">Nhóm</div>
                          <div className="flex flex-wrap gap-1.5 font-medium">
                            {item?.GroupList && item?.GroupList.length > 0 ? (
                              item?.GroupList.map((x) => ({
                                ...x,
                                label: `${x.TitleStock || x.GroupTitle} - ${
                                  x.StockTitle || "Hệ thống"
                                }`,
                              })).map((item, i) => (
                                <div
                                  className="rounded bg-[#e2f0ff] text-primary font-number px-2.5 py-[2px] text-[13px] font-medium"
                                  key={i}
                                >
                                  {item?.label}
                                </div>
                              ))
                            ) : (
                              <>Chưa xác định</>
                            )}
                          </div>
                        </div>
                        {/* <div className="mb-4 last:mb-0">
                          <div className="mb-1 text-sm text-muted2">
                            Trạng thái
                          </div>
                          <div
                            className={clsx(
                              "font-medium",
                              !item?.Disabled ? "text-success" : "text-danger"
                            )}
                          >
                            {!item?.Disabled ? "Hoạt động" : "Đã nghỉ"}
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {(!Lists || Lists.length === 0) && (
              <div className="flex items-center justify-center h-full">
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                />
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

export default MembersAdmin;

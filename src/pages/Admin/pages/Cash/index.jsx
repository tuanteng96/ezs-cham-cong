import {
  Link,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import React, { useRef, useState } from "react";
import {
  AdjustmentsVerticalIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import { useInfiniteQuery, useMutation, useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import NoFound from "@/components/NoFound";
import clsx from "clsx";
import StringHelpers from "@/helpers/StringHelpers";
import InfiniteScroll from "react-infinite-scroll-component";
import moment from "moment";
import { useDebounce } from "@/hooks";
import {
  PickerCashAddEdit,
  PickerCashView,
  PickerCashViewTotal,
  PickerEditSplit,
  PickerFilter,
} from "./components";
import { toast } from "react-toastify";
import XML from "@/xml";
import { PickerSheet } from "@/partials/components/Sheet";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function CashAdmin({ f7router }) {
  let elRef = useRef();

  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock, tong_hop_cash, thu_chi_cash } =
    RolesHelpers.useRoles({
      nameRoles: ["adminTools_byStock", "tong_hop_cash", "thu_chi_cash"],
      auth: Auth,
      CrStocks,
    });

  const [filters, setFilters] = useState({
    Key: "",
    Dir: 0,
    InOut: "",
    tag: "",
    MethodID: "",
    pi: 1,
    ps: 20,
    From: new Date(),
    To: new Date(),
    Type: "Hôm nay",
    Advanced: 1,
    sort: "[CreateDate] desc",
    CustomType: "",
  });

  const debouncedKey = useDebounce(filters, 500);

  const CashQuery = useInfiniteQuery({
    queryKey: [
      "CashList",
      {
        debouncedKey: debouncedKey,
        StockID: CrStocks?.ID,
      },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await AdminAPI.listCashs({
        params: {
          cmd: "get",
          "(filter)Dir": filters.Dir,
          "(filter)InOut": filters.InOut,
          "(filter)tag":
            filters.tag && filters.tag.length > 0
              ? filters.tag.map((x) => x.value).toString()
              : XML.TagCash.filter((x) =>
                  filters.Advanced === 2 ? true : x.Basic
                )
                  .map((x) => x.value)
                  .toString(),
          "(filter)StockID": CrStocks?.ID || "",
          "(filter)MethodID": filters.MethodID?.value || "",
          "(filter)CustomType": filters.CustomType
            ? filters.CustomType.map((x) => x.value).toString()
            : "",
          "(filter)key": filters.Key,
          "(filter)from": moment(filters.From).format("DD-MM-YYYY"),
          "(filter)to": moment(filters.To).format("DD-MM-YYYY"),
          sort: filters.sort,
          pi: pageParam,
          ps: filters.ps,
        },
        Token: Auth.token,
      });

      return data?.data || null;
    },
    onSuccess: () => {
      f7.dialog.close();
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.deleteCashs(body);
      await CashQuery.refetch();
      return data;
    },
  });

  const Lists = ArrayHelpers.useInfiniteQuery(CashQuery?.data?.pages, "list");

  const getTypeBanks = (item) => {
    let str = [];
    if (item.GroupCash > 0) str.push("TM");
    if (item.GroupEBank > 0) str.push("CK");
    if (item.GroupCardBank > 0) str.push("QT");
    if (!str || str.length === 0) str.push("TM");
    return str.join("/");
  };

  const getMethodBanks = (item) => {
    let str = [];
    if (item.MethodID === 1) str.push("TM");
    if (item.MethodID === 2) str.push("CK");
    if (item.MethodID === 3) str.push("QT");
    if (!str || str.length === 0) str.push("TM");
    return str.join("/");
  };

  const onDelete = (item) => {
    f7.dialog.confirm(
      `Bạn có chắc chắn muốn xoá khoản ${item.CashType} này ?`,
      () => {
        f7.dialog.preloader("Đang thực hiện...");

        let bodyFormData = new FormData();
        bodyFormData.append("ID", item.ID);

        deleteMutation.mutate(
          {
            data: bodyFormData,
            Token: Auth.token,
          },
          {
            onSuccess: (data) => {
              f7.dialog.close();
              toast.success(`Xoá khoản ${item.CashType} thành công.`);
            },
          }
        );
      }
    );
  };

  const getDesc = (item) => {
    switch (item.SysTagID) {
      case 2034:
        return `Thu bán hàng </br>(ĐH <span class="text-primary">#${item.SourceID}</span>)`;
      case 2059:
        return `Trả tiền giữ lương </br>(NV ${item.ReceiverName || ""})`;
      case 2058:
        return `Thu tiền giữ lương </br>(NV ${item.ReceiverName || ""})`;
      case 2040:
        return `Trả lương </br>(NV ${item.ReceiverName || ""} - ${
          item?.Rel || ""
        })`;
      case 2044:
        return `Thu hoàn ứng </br>(NV ${item.ReceiverName || ""})`;
      case 2052:
        return `Chi tạm ứng </br>(NV ${item.ReceiverName || ""})`;
      case 2050:
        return `Chi nhập hàng </br>(ĐN <span class="text-primary">#${item.SourceID}</span>)`;
      case 2038:
        return `Chi trả tiền rút ví </br>(NV <span class="text-primary">#${item.RefMemberID})</span>`;
      case 2042:
        return `Thu tiền xuất hàng </br>(ĐX <span class="text-primary">#${item.SourceID}</span>)`;
      case 2037:
        return `Thu tiền nạp ví </br>(NV <span class="text-primary">#${item.RefMemberID}</span>)`;
      default:
        return item.Desc || "";
    }
  };

  return (
    <Page
      className="bg-[var(--f7-page-bg-color)]"
      name="OrderAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavTitle>Sổ quỹ / Thu chi</NavTitle>
        <NavRight className="h-full">
          <PickerFilter
            initialValues={filters}
            onChange={(values) => {
              f7.dialog.preloader("Đang thực hiện ...");
              if(JSON.stringify(filters) === JSON.stringify(values)) {
                CashQuery.refetch()
              }
              else {
                setFilters((prevState) => ({ ...prevState, ...values }));
              }
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
          </PickerFilter>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>

      <div
        className={clsx(
          "flex flex-col h-full overflow-hidden relative transition-[padding] duration-300 ease-in-out",
          Brand?.Global?.EZSIDVersion ? "pt-[67px]" : "pt-0"
        )}
      >
        {Brand?.Global?.EZSIDVersion ? (
          <div
            className={clsx(
              "bg-white min-h-[67px] h-[67px] absolute top-0 left-0 w-full transition grid grid-cols-3 rounded-b-xl"
            )}
          >
            <PickerCashViewTotal
              Title="Tổng thu"
              Items={[
                {
                  Title: "Tiền mặt",
                  Value:
                    CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Thu_TM
                      : 0,
                },
                {
                  Title: "Chuyển khoản",
                  Value:
                    CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Thu_CK
                      : 0,
                },
                {
                  Title: "Quẹt thẻ",
                  Value:
                    CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Thu_QT
                      : 0,
                },
              ]}
            >
              {({ open }) => (
                <div
                  className="flex flex-col items-center justify-center h-full text-center border-r last:border-0"
                  onClick={open}
                >
                  {CashQuery?.isLoading && (
                    <div className="w-16 h-4 bg-gray-200 animate-pulse rounded-xl"></div>
                  )}
                  {!CashQuery?.isLoading && (
                    <div className="text-base font-bold font-lato text-success">
                      {StringHelpers.formatVNDPositive(
                        CashQuery?.data?.pages &&
                          CashQuery?.data?.pages.length > 0
                          ? CashQuery?.data?.pages[0]?.Sum?.Thu
                          : 0
                      )}
                    </div>
                  )}
                  <div className="flex mt-px text-gray-500">Tổng Thu</div>
                </div>
              )}
            </PickerCashViewTotal>

            <PickerCashViewTotal
              Title="Tổng chi"
              Items={[
                {
                  Title: "Tiền mặt",
                  Value: Math.abs(
                    CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Chi_TM
                      : 0
                  ),
                },
                {
                  Title: "Chuyển khoản",
                  Value: Math.abs(
                    CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Chi_CK
                      : 0
                  ),
                },
                {
                  Title: "Quẹt thẻ",
                  Value: Math.abs(
                    CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Chi_QT
                      : 0
                  ),
                },
              ]}
            >
              {({ open }) => (
                <div
                  className="flex flex-col items-center justify-center h-full text-center border-r last:border-0"
                  onClick={open}
                >
                  {CashQuery?.isLoading && (
                    <div className="w-16 h-4 bg-gray-200 animate-pulse rounded-xl"></div>
                  )}
                  {!CashQuery?.isLoading && (
                    <div className="text-base font-bold font-lato text-danger">
                      {StringHelpers.formatVNDPositive(
                        CashQuery?.data?.pages &&
                          CashQuery?.data?.pages.length > 0
                          ? CashQuery?.data?.pages[0]?.Sum?.Chi
                          : 0
                      )}
                    </div>
                  )}
                  <div className="flex mt-px text-gray-500">Tổng Chi</div>
                </div>
              )}
            </PickerCashViewTotal>
            <PickerCashViewTotal
              Title="Tổng tồn"
              Items={[
                {
                  Title: "Tiền mặt",
                  Value:
                    (CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Thu_TM
                      : 0) -
                    Math.abs(
                      CashQuery?.data?.pages &&
                        CashQuery?.data?.pages.length > 0
                        ? CashQuery?.data?.pages[0]?.Sum?.Chi_TM
                        : 0
                    ),
                },
                {
                  Title: "Chuyển khoản",
                  Value:
                    (CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Thu_CK
                      : 0) -
                    Math.abs(
                      CashQuery?.data?.pages &&
                        CashQuery?.data?.pages.length > 0
                        ? CashQuery?.data?.pages[0]?.Sum?.Chi_CK
                        : 0
                    ),
                },
                {
                  Title: "Quẹt thẻ",
                  Value:
                    (CashQuery?.data?.pages && CashQuery?.data?.pages.length > 0
                      ? CashQuery?.data?.pages[0]?.Sum?.Thu_QT
                      : 0) -
                    Math.abs(
                      CashQuery?.data?.pages &&
                        CashQuery?.data?.pages.length > 0
                        ? CashQuery?.data?.pages[0]?.Sum?.Chi_QT
                        : 0
                    ),
                },
              ]}
            >
              {({ open }) => (
                <div
                  className="flex flex-col items-center justify-center h-full text-center border-r last:border-0"
                  onClick={open}
                >
                  {CashQuery?.isLoading && (
                    <div className="w-16 h-4 bg-gray-200 animate-pulse rounded-xl"></div>
                  )}
                  {!CashQuery?.isLoading && (
                    <div className="text-base font-bold font-lato">
                      {StringHelpers.formatVNDPositive(
                        Math.abs(
                          CashQuery?.data?.pages &&
                            CashQuery?.data?.pages.length > 0
                            ? CashQuery?.data?.pages[0]?.Sum?.Thu
                            : 0
                        ) -
                          Math.abs(
                            CashQuery?.data?.pages &&
                              CashQuery?.data?.pages.length > 0
                              ? CashQuery?.data?.pages[0]?.Sum?.Chi
                              : 0
                          )
                      )}
                    </div>
                  )}
                  <div className="flex mt-px text-gray-500">Tổng tồn</div>
                </div>
              )}
            </PickerCashViewTotal>
          </div>
        ) : (
          <></>
        )}

        <div
          id="scrollableDivOrders"
          className="overflow-auto grow"
          ref={elRef}
        >
          <InfiniteScroll
            dataLength={Lists.length}
            next={CashQuery.fetchNextPage}
            hasMore={CashQuery.hasNextPage}
            loader={
              CashQuery.isLoading ? null : (
                <>
                  {Lists && Lists.length > 0 && (
                    <div className="flex justify-center ezs-ptr">
                      <div className="lds-ellipsis">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    </div>
                  )}
                </>
              )
            }
            scrollableTarget="scrollableDivOrders"
            refreshFunction={CashQuery.refetch}
            pullDownToRefresh
            pullDownToRefreshThreshold={50}
            pullDownToRefreshContent={
              <div className="flex justify-center ezs-ptr">
                <div className="lds-ellipsis">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            }
            releaseToRefreshContent={
              <div className="flex justify-center ezs-ptr">
                <div className="lds-ellipsis">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            }
          >
            <div className="p-4">
              {CashQuery.isLoading && (
                <>
                  {Array(2)
                    .fill()
                    .map((_, index) => (
                      <div
                        className="flex flex-col p-4 mb-3.5 bg-white rounded-lg animate-pulse"
                        key={index}
                      >
                        <div className="flex justify-between pb-2.5 mb-2.5 border-b">
                          <div className="w-32 h-4 bg-gray-200 rounded"></div>
                          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        </div>

                        <div className="flex justify-between pb-2.5 mb-2.5 border-b">
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </div>

                        <div className="flex justify-between pb-2.5 mb-2.5 border-b">
                          <div className="w-16 h-4 bg-gray-200 rounded"></div>
                          <div className="w-24 h-5 bg-gray-200 rounded"></div>
                        </div>

                        <div className="flex justify-between">
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </div>
                      </div>
                    ))}
                </>
              )}
              {!CashQuery.isLoading && (
                <>
                  {Lists && Lists.length > 0 && (
                    <>
                      {Lists.map((item, index) => (
                        <PickerSheet
                          key={index}
                          Title="Bạn muốn thực hiện ?"
                          Options={[
                            {
                              Title: "Xem chi tiết",
                              component: ({
                                children,
                                close,
                                setHideForChild,
                              }) => (
                                <PickerCashView
                                  item={item}
                                  TitleTotal={
                                    item?.CashType === "Thu"
                                      ? `Tiền thu (${getTypeBanks(item)})`
                                      : `Tiền chi (${getMethodBanks(item)})`
                                  }
                                  onOpen={() => setHideForChild(true)}
                                  onClose={() => {
                                    setHideForChild(false);
                                    close();
                                  }}
                                >
                                  {({ open }) => (
                                    <div
                                      className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                      onClick={() => {
                                        open();
                                      }}
                                    >
                                      {children}
                                    </div>
                                  )}
                                </PickerCashView>
                              ),
                            },
                            {
                              Title:
                                item.GroupIDValue &&
                                item.GroupIDValue.length > 1 &&
                                !(
                                  adminTools_byStock?.hasRight ||
                                  (thu_chi_cash?.hasRight &&
                                    moment().format("DD-MM-YYYY") ===
                                      moment(item.CreateDate).format(
                                        "DD-MM-YYYY"
                                      ))
                                )
                                  ? "Chi tiết thanh toán"
                                  : "Chỉnh sửa",
                              component: ({
                                children,
                                close,
                                setHideForChild,
                              }) =>
                                item.GroupIDValue &&
                                item.GroupIDValue.length > 1 ? (
                                  <PickerEditSplit
                                    item={item}
                                    onOpen={() => setHideForChild(true)}
                                    onClose={() => {
                                      setHideForChild(false);
                                      close();
                                    }}
                                  >
                                    {({ open }) => (
                                      <div
                                        className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                        onClick={() => {
                                          open();
                                        }}
                                      >
                                        {children}
                                      </div>
                                    )}
                                  </PickerEditSplit>
                                ) : (
                                  <PickerCashAddEdit
                                    onOpen={() => setHideForChild(true)}
                                    onClose={() => {
                                      setHideForChild(false);
                                      close();
                                    }}
                                    initialValues={item}
                                  >
                                    {({ open }) => (
                                      <div
                                        className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                        onClick={open}
                                      >
                                        {children}
                                      </div>
                                    )}
                                  </PickerCashAddEdit>
                                ),
                              hidden:
                                !item.GroupIDValue ||
                                (item.GroupIDValue &&
                                  item.GroupIDValue.length === 1)
                                  ? !(
                                      adminTools_byStock?.hasRight ||
                                      (thu_chi_cash?.hasRight &&
                                        moment().format("DD-MM-YYYY") ===
                                          moment(item.CreateDate).format(
                                            "DD-MM-YYYY"
                                          ))
                                    )
                                  : false,
                            },
                            {
                              Title: "Xoá khoản " + item?.CashType,
                              className:
                                "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer text-danger",
                              onClick: (e) => {
                                onDelete(item);
                              },
                              hidden:
                                (item.GroupIDValue &&
                                  item.GroupIDValue.length > 1) ||
                                !(
                                  adminTools_byStock?.hasRight ||
                                  (thu_chi_cash?.hasRight &&
                                    moment().format("DD-MM-YYYY") ===
                                      moment(item.CreateDate).format(
                                        "DD-MM-YYYY"
                                      ))
                                ),
                            },
                          ].filter((x) => !x.hidden)}
                          Close={{
                            Title: "Đóng",
                          }}
                        >
                          {({ open }) => (
                            <div
                              onClick={open}
                              className="flex flex-col p-4 mb-3.5 bg-white rounded-lg last:mb-0"
                            >
                              <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0 items-center">
                                <div className="text-gray-500">
                                  {item?.CashType === "Thu"
                                    ? `Tiền thu (${getTypeBanks(item)})`
                                    : `Tiền chi (${getMethodBanks(item)})`}
                                </div>
                                <div className="flex justify-end w-12 text-gray-500">
                                  <div
                                    className={clsx(
                                      "font-bold font-lato text-base",
                                      item?.CashType === "Thu" &&
                                        item.SysTagID !== 2040
                                        ? "text-black"
                                        : "text-danger"
                                    )}
                                  >
                                    {StringHelpers.formatVNDPositive(
                                      item?.CashType === "Thu"
                                        ? item.GroupEBank +
                                            item.GroupCardBank +
                                            item.GroupCash || item?.Value
                                        : item?.Value
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between gap-2 pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0">
                                <div className="w-1/3 text-gray-500">
                                  {moment().year() ===
                                  moment(item.CreateDate).year()
                                    ? moment(item.CreateDate).format("DD/MM")
                                    : moment(item.CreateDate).format(
                                        "DD/MM/YYYY"
                                      )}
                                </div>
                                <div
                                  className="flex-1 text-right"
                                  dangerouslySetInnerHTML={{
                                    __html: getDesc(item),
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </PickerSheet>
                      ))}
                    </>
                  )}
                  {(!Lists || Lists.length === 0) && (
                    <NoFound
                      Title="Không có kết quả nào."
                      Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                    />
                  )}
                </>
              )}
            </div>
          </InfiniteScroll>
        </div>
      </div>
    </Page>
  );
}

export default CashAdmin;

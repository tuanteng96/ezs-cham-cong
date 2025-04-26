import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Panel,
  Subnavbar,
  Toolbar,
  f7,
  useStore,
} from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  AdjustmentsVerticalIcon,
  CheckIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import ProdsAPI from "@/api/Prods.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import NoFound from "@/components/NoFound";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import clsx from "clsx";
import Dom7 from "dom7";
import { MenuSubNavbar, PickerPriceProdAdd } from "./components";
import InfiniteScroll from "react-infinite-scroll-component";

const getNameType = (type) => {
  switch (type) {
    case "DV":
      return "Dịch vụ";
    case "SP":
      return "Sản phẩm";
    case "NVL":
      return "Nguyên vật liệu";
    case "TT":
      return "Thẻ tiền";
    case "NH":
      return "Nhãn hàng";
    default:
      return "Phụ phí";
  }
};

function PosAddProd({ f7route, f7router }) {
  const queryClient = useQueryClient();

  let filtersState = f7route?.query?.filters
    ? JSON.parse(f7route?.query?.filters)
    : null;
  let prevState = f7route?.query?.prevState
    ? JSON.parse(f7route?.query?.prevState)
    : null;

  const [selected, setSelected] = useState([]);

  let { id } = f7route.params;

  let elRef = useRef();

  let CrStocks = useStore("CrStocks");
  let Auth = useStore("Auth");

  const [filters, setFilters] = useState({
    pi: 1,
    key: "",
    cateid: Number(filtersState?.cateid) || 0,
    ps: 8,
    stockid: CrStocks?.ID || "",
    getid: 1,
    includeCate: false,
  });

  const [Active, setActive] = useState(null);

  const CheckIn = useQuery({
    queryKey: ["GetCheckIn", { ID: id }],
    queryFn: async () => {
      let bodyFormData = new FormData();
      bodyFormData.append("cmd", "getcheck");
      bodyFormData.append("ids", id);

      let { data } = await AdminAPI.getCheckIn({
        data: bodyFormData,
        Token: Auth.token,
        StockID: CrStocks?.ID,
      });
      return data && data.length > 0 && !data[0]?.CheckOutTime ? data[0] : null;
    },
  });

  const ProdsQuery = useInfiniteQuery({
    queryKey: ["ProdsQuery", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await ProdsAPI.getProds({
        data: {
          ...filters,
          pi: pageParam,
        },
        Token: Auth.token,
      });

      const { data: stocks } = await ProdsAPI.getProdsStocks({
        data: {
          DynamicIDs: data?.lst ? data?.lst.map((x) => x.DynamicID) : [],
        },
        Token: Auth.token,
        StockID: CrStocks?.ID,
      });

      let newLst = [];
      if (data?.lst && data.lst.length > 0) {
        for (let item of data.lst) {
          let obj = {
            ...item,
            Qty: 0,
          };
          let index = stocks.findIndex((x) => x.DynamicID);
          if (index > -1) {
            obj.stockCount = stocks[index].stockCount;
          }
          newLst.push(obj);
        }
      }

      return {
        ...data,
        lst: newLst,
      };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pcount ? undefined : lastPage.pi + 1,
    keepPreviousData: true,
    onSettled: () => f7.dialog.close(),
  });

  const ProdsCateQuery = useQuery({
    queryKey: ["ProdsCateQuery"],
    queryFn: async () => {
      const { data } = await ProdsAPI.getProdsCategories();
      let result = [
        {
          ID: 0,
          Title: "Tất cả",
          Active: [0],
        },
      ];
      if (data) {
        for (let key in data) {
          let obj = {
            ...data[key][0],
            Title: getNameType(key),
            Children: data[key].filter((x, index) => index !== 0),
            Active: data[key].map((x) => x.ID),
          };
          result.push(obj);
        }
      }
      return result || [];
    },
  });

  useEffect(() => {
    if (filtersState?.cateid) {
      let index =
        ProdsCateQuery.data &&
        ProdsCateQuery.data.findIndex(
          (x) =>
            x.ID === Number(filters.cateid) ||
            x.Active.includes(Number(filters.cateid))
        );

      if (index > -1) {
        if (ProdsCateQuery.data[index].ID === 0) {
          setActive({
            ...ProdsCateQuery.data[index],
            Children: ProdsCateQuery.data.filter((x) => x.ID !== 0),
          });
        } else {
          if (
            ProdsCateQuery.data[index].Children &&
            ProdsCateQuery.data[index].Children.length > 0
          ) {
            setActive({
              ...ProdsCateQuery.data[index],
              Children: [
                { ID: ProdsCateQuery.data[index].ID, Title: "Tất cả phụ phí" },
                ...ProdsCateQuery.data[index].Children,
              ],
            });
          }
        }
      }
    } else {
      let index =
        ProdsCateQuery.data && ProdsCateQuery.data.findIndex((x) => x.ID === 0);
      if (index > -1) {
        setActive({
          ...ProdsCateQuery.data[index],
          Children: [
            {
              ID: 0,
              Title: "Tất cả",
            },
            ...ProdsCateQuery.data.filter((x) => x.ID !== 0),
          ],
        });
      }
    }
  }, [ProdsCateQuery?.data, filters.cateid]);

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addOrderCheckIn(body);
      AdminAPI.clientsPresentAppId({
        MemberID: id,
        Token: Auth.token,
      });
      await Promise.all([
        queryClient.invalidateQueries(["OrderManageID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["ClientManageID"]),
      ]);
      if (prevState && prevState.invalidateQueries) {
        await Promise.all(
          prevState.invalidateQueries.map((key) =>
            queryClient.invalidateQueries([key])
          )
        );
      }
      return data?.data?.data || null;
    },
  });

  const addCheckInMutation = useMutation({
    mutationFn: async (body) => {
      var bodyFormDataCheckIn = new FormData();
      bodyFormDataCheckIn.append("cmd", "checkin");
      bodyFormDataCheckIn.append("mid", id);
      bodyFormDataCheckIn.append("__noset", 0);

      let { data } = await AdminAPI.clientsCheckIn({
        ...body,
        data: bodyFormDataCheckIn,
      });

      let OrderRs = null;

      if (data?.mc?.ID) {
        var bodyFormData = new FormData();
        bodyFormData.append("CheckInID", data?.mc?.ID);
        bodyFormData.append("arr", body.arr);

        OrderRs = await AdminAPI.addOrderCheckIn({
          ...body,
          data: bodyFormData,
        });
      }

      await AdminAPI.clientsPresentAppId({
        MemberID: id,
        Token: Auth.token,
      });

      await Promise.all([
        queryClient.invalidateQueries(["ClientManageID"]),
        queryClient.invalidateQueries(["OrderManageID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["InvoiceProcessings"]),
      ]);
      return OrderRs?.data?.data || null;
    },
  });

  const Lists = ArrayHelpers.useInfiniteQuery(ProdsQuery?.data?.pages, "lst");

  const onChange = async () => {
    if (CheckIn?.data?.ID) {
      var bodyFormData = new FormData();
      bodyFormData.append("CheckInID", CheckIn?.data?.ID);
      bodyFormData.append(
        "arr",
        JSON.stringify(
          selected.map((x) => {
            let obj = {
              id: x.ID,
              qty: x.Qty,
              IsService: x.IsService,
              IsAddFee: x.IsAddFee,
            };
            if (x.priceorder) {
              obj.priceorder = x.priceorder;
            }
            return obj;
          })
        )
      );

      if (prevState?.OrderServiceID) {
        bodyFormData.append("after", "set_fee");
        bodyFormData.append("orderserviceid", prevState?.OrderServiceID);
        bodyFormData.append("MemberID", prevState?.MemberID);
      }

      addMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: (data) => {
            toast.success("Thêm vào hoá đơn thành công.");
            f7router.back();
            // if (
            //   selected.filter((x) => x.IsAddFee).length > 0 &&
            //   f7router.previousRoute.path.includes("/admin/pos/calendar/os")
            // ) {
            //   f7.view.main.router.back(
            //     `${f7router.previousRoute.url}&prevFee=${JSON.stringify(
            //       selected
            //         .filter((x) => x.IsAddFee)
            //         .map((x) => ({
            //           Title: x.Title,
            //           Qty: x.Qty,
            //         }))
            //     )}`,
            //     {
            //       force: true,
            //     }
            //   );
            // } else {
            //   f7router.back();
            // }

            if (data?.prePayedValue) {
              f7.dialog
                .create({
                  title: "Đơn hàng đã thay đổi",
                  content: `Tất cả các khoản đã thanh toán có giá trị <span class="text-danger font-lato font-bold text-[15px]">${StringHelpers.formatVND(
                    data?.prePayedValue
                  )}</span> đã bị xoá. Vui lòng thực hiện thanh toán lại !`,
                  buttons: [
                    {
                      text: "Đóng",
                      close: true,
                    },
                  ],
                })
                .open();
            }
          },
        }
      );
    } else {
      addCheckInMutation.mutate(
        {
          arr: JSON.stringify(
            selected.map((x) => {
              let obj = {
                id: x.ID,
                qty: x.Qty,
                IsService: x.IsService,
                IsAddFee: x.IsAddFee,
              };
              if (x.priceorder) {
                obj.priceorder = x.priceorder;
              }
              return obj;
            })
          ),
          Token: Auth?.token,
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: (data) => {
            toast.success("Thêm vào hoá đơn thành công.");
            f7router.back();
            // if (
            //   selected.filter((x) => x.IsAddFee).length > 0 &&
            //   f7router.previousRoute.path.includes("/admin/pos/calendar/os")
            // ) {
            //   f7.view.main.router(
            //     `${f7router.previousRoute.url}&prevFee=${JSON.stringify(
            //       selected
            //         .filter((x) => x.IsAddFee)
            //         .map((x) => ({
            //           Title: x.Title,
            //           Qty: x.Qty,
            //         }))
            //     )}`,
            //     {
            //       force: true,
            //     }
            //   );
            // } else {
            //   f7router.back();
            // }

            if (data?.prePayedValue) {
              f7.dialog
                .create({
                  title: "Đơn hàng đã thay đổi",
                  content: `Tất cả các khoản đã thanh toán có giá trị <span class="text-danger font-lato font-bold text-[15px]">${StringHelpers.formatVND(
                    data?.prePayedValue
                  )}</span> đã bị xoá. Vui lòng thực hiện thanh toán lại !`,
                  buttons: [
                    {
                      text: "Đóng",
                      close: true,
                    },
                  ],
                })
                .open();
            }
          },
        }
      );
    }
  };

  let isDisabled = ({ Type, Item }) => {
    if (Type === "Plus") {
      let index = selected.findIndex((x) => x.ID === Item.ID);
      return index > -1 && selected[index].Qty && selected[index].Qty > 100;
    }
    if (Type === "Minus") {
      let index = selected.findIndex((x) => x.ID === Item.ID);
      return !(index > -1 && selected[index].Qty > 0);
    }
  };

  let getValues = (Item) => {
    let index = selected.findIndex((x) => x.ID === Item.ID);
    if (index > -1 && selected[index].Qty) {
      return selected[index].Qty;
    }
    return 0;
  };

  let isCheckSales = ({ SaleBegin, SaleEnd, PriceSale }) => {
    if (!SaleBegin || !SaleEnd) return false;
    var todaydate = new Date();
    if (
      Date.parse(todaydate) < Date.parse(SaleEnd) &&
      Date.parse(SaleBegin) <= Date.parse(todaydate) &&
      PriceSale > 0
    ) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <Page
      id="Pos-add-prod"
      className="bg-white"
      name="Pos-add-prod"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      // ptr
      // onPtrRefresh={(done) => ProdsQuery.refetch().then(() => done())}
      // infinite
      // infiniteDistance={50}
      // infinitePreloader={ProdsQuery.isFetchingNextPage}
      // onInfinite={loadMore}
      noToolbar={!selected || selected.length === 0}
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
        <NavTitle>Thêm mới mặt hàng</NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            panelOpen="#panel-cate-prod"
          >
            <AdjustmentsVerticalIcon className="w-6" />
          </Link>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
        <Subnavbar className="[&>div]:px-0">
          <div className="relative w-full h-full">
            <Input
              className="h-full [&_input]:border-0 [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:w-full [&_input]:pl-14 [&_input]:shadow-none"
              type="text"
              placeholder="Tìm kiếm theo tên mặt hàng ..."
              value={filters.key}
              clearButton={true}
              onInput={(e) => {
                setFilters((prevState) => ({
                  ...prevState,
                  key: e.target.value,
                }));
              }}
            />
            <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
              <MagnifyingGlassIcon className="w-6 text-gray-500" />
            </div>
          </div>
        </Subnavbar>
      </Navbar>
      <div className="flex flex-col h-full">
        <div className="h-12 px-4 bg-white border-t shadow-lg">
          {Active && (
            <MenuSubNavbar
              data={
                Active?.Children?.map((x) => ({ ...x, visibleCount: true })) ||
                []
              }
              selected={Number(filters.cateid)}
              setSelected={(val) => {
                setFilters((prevState) => ({
                  ...prevState,
                  cateid: val,
                }));
                f7.dialog.preloader("Đang tải ...");
              }}
            />
          )}
        </div>
        <div id="scrollableDivProds" className="overflow-auto grow" ref={elRef}>
          <InfiniteScroll
            dataLength={Lists.length}
            next={ProdsQuery.fetchNextPage}
            hasMore={ProdsQuery.hasNextPage}
            loader={
              ProdsQuery.isLoading ? null : (
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
            scrollableTarget="scrollableDivProds"
            refreshFunction={ProdsQuery.refetch}
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
            <div>
              {!ProdsQuery.isLoading && (
                <>
                  {Lists && Lists.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4">
                      {Lists.map((item, index) => (
                        <PickerPriceProdAdd
                          data={item}
                          onChange={(price) => {
                            let newSelected = [...selected];
                            newSelected.push({
                              ...item,
                              Qty: 1,
                              priceorder: Number(price),
                            });
                            setSelected(newSelected);
                          }}
                          key={index}
                        >
                          {({ open }) => (
                            <div className="overflow-hidden border rounded">
                              <div
                                className="relative aspect-square"
                                onClick={() => {
                                  let newSelected = [...selected];
                                  let index = newSelected.findIndex(
                                    (x) => x.ID === item.ID
                                  );
                                  if (index > -1) {
                                    newSelected[index].Qty =
                                      newSelected[index].Qty + 1;
                                  } else {
                                    if (item.PriceProduct) {
                                      newSelected.push({ ...item, Qty: 1 });
                                    } else {
                                      open();
                                    }
                                  }
                                  setSelected(newSelected);
                                }}
                              >
                                <img
                                  className="object-cover w-full h-full"
                                  src={AssetsHelpers.toAbsoluteUrl(
                                    item.Thumbnail
                                  )}
                                  alt={item.Title}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      AssetsHelpers.toAbsoluteUrlCore(
                                        "no-product.png",
                                        "/images/"
                                      );
                                  }}
                                />
                                {!item.IsMoney &&
                                  !item.IsService &&
                                  !item.IsNVL &&
                                  !item.IsAddFee &&
                                  !item.IsCourse && (
                                    <div className="absolute text-white bg-danger top-2 right-2 font-lato px-1.5 rounded">
                                      {item.stockCount}
                                    </div>
                                  )}
                              </div>
                              <div className="px-2 py-3 text-center">
                                <div className="font-medium line-clamp-2 min-h-[42px]">
                                  {item.Title}
                                </div>
                                <div
                                  className={clsx(
                                    "mt-1 font-medium font-lato group",
                                    isCheckSales({
                                      SaleBegin: item.SaleBegin,
                                      SaleEnd: item.SaleEnd,
                                      PriceSale: item.PriceSale,
                                    }) && "is-sale"
                                  )}
                                >
                                  <div className="hidden group-[.is-sale]:block">
                                    {StringHelpers.formatVND(item.PriceSale)}
                                  </div>
                                  <div className="group-[.is-sale]:line-through group-[.is-sale]:text-gray-400">
                                    {StringHelpers.formatVND(item.PriceProduct)}
                                  </div>
                                </div>
                                <div className="px-3 mt-2.5 flex">
                                  <button
                                    type="button"
                                    className="flex items-center justify-center h-8 text-white rounded-l w-9 bg-danger border-danger disabled:opacity-60"
                                    onClick={() => {
                                      let newSelected = [...selected];
                                      let index = newSelected.findIndex(
                                        (x) => x.ID === item.ID
                                      );
                                      if (index > -1) {
                                        if (newSelected[index].Qty <= 1) {
                                          newSelected = newSelected.filter(
                                            (x) =>
                                              x.ID !== newSelected[index].ID
                                          );
                                        } else {
                                          newSelected[index].Qty =
                                            newSelected[index].Qty - 1;
                                        }
                                      }
                                      setSelected(newSelected);
                                    }}
                                    disabled={isDisabled({
                                      Item: item,
                                      Type: "Minus",
                                    })}
                                  >
                                    <MinusIcon className="w-4" />
                                  </button>
                                  <div className="flex items-center justify-center flex-1 w-12 border-y font-lato">
                                    {getValues(item)}
                                  </div>
                                  <button
                                    type="button"
                                    className="flex items-center justify-center h-8 text-white rounded-r w-9 bg-success border-danger"
                                    disabled={isDisabled({
                                      Item: item,
                                      Type: "Plus",
                                    })}
                                    onClick={() => {
                                      let newSelected = [...selected];
                                      let index = newSelected.findIndex(
                                        (x) => x.ID === item.ID
                                      );
                                      if (index > -1) {
                                        newSelected[index].Qty =
                                          newSelected[index].Qty + 1;
                                      } else {
                                        if (item.PriceProduct) {
                                          newSelected.push({
                                            ...item,
                                            Qty: 1,
                                          });
                                        } else {
                                          open();
                                        }
                                      }
                                      setSelected(newSelected);
                                    }}
                                  >
                                    <PlusIcon className="w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </PickerPriceProdAdd>
                      ))}
                    </div>
                  )}
                  {(!Lists || Lists.length) === 0 && (
                    <div className="h-full">
                      <NoFound
                        Title="Không có kết quả nào."
                        Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                      />
                    </div>
                  )}
                </>
              )}

              {ProdsQuery.isLoading && (
                <div className="grid grid-cols-2 gap-4 p-4">
                  {Array(4)
                    .fill()
                    .map((_, index) => (
                      <div
                        className="overflow-hidden border rounded"
                        key={index}
                      >
                        <div className="flex items-center justify-center w-full bg-gray-300 rounded aspect-square animate-pulse">
                          <svg
                            className="w-10 h-10 text-gray-200"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 18"
                          >
                            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-center justify-center px-1 py-3">
                          <div className="h-2.5 bg-gray-200 rounded-full w-11/12 mb-2"></div>
                          <div className="h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </InfiniteScroll>
        </div>
      </div>

      <Panel
        left
        floating
        swipeOnlyClose
        containerEl="#pos-add-prod"
        id="panel-cate-prod"
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 pt-6 font-semibold uppercase border-b bg-gray-50">
            Danh mục mặt hàng
          </div>
          <div className="overflow-auto grow">
            {ProdsCateQuery.isLoading && (
              <>
                {Array(2)
                  .fill()
                  .map((_, index) => (
                    <div className="border-b" key={index}>
                      <div>
                        <Link
                          className={clsx(
                            "flex px-4 py-3.5 font-semibold uppercase relative"
                          )}
                          noLinkClass
                        >
                          <div className="h-3.5 bg-gray-200 rounded-full animate-pulse w-full"></div>
                        </Link>
                      </div>
                      <div>
                        <div className="border-t">
                          {Array(3)
                            .fill()
                            .map((_, idx) => (
                              <div className="border-b last:border-0" key={idx}>
                                <Link
                                  className={clsx(
                                    "flex items-center px-4 py-4 font-medium"
                                  )}
                                  noLinkClass
                                >
                                  <div className="w-1 h-1 bg-[#B5B5C3] rounded-full mr-2"></div>
                                  <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-7/12"></div>
                                </Link>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </>
            )}
            {!ProdsCateQuery.isLoading && (
              <>
                {ProdsCateQuery?.data &&
                  ProdsCateQuery?.data.map((item, index) => (
                    <div className="border-b" key={index}>
                      <div>
                        <Link
                          className={clsx(
                            "flex px-4 py-3.5 font-semibold uppercase relative",
                            item.Active.includes(filters.cateid) && "text-app"
                          )}
                          noLinkClass
                          onClick={() => {
                            f7.panel.close(Dom7("#panel-cate-prod"));
                            f7.dialog.preloader("Đang tải ...");
                            elRef?.current?.scrollTo(0, 0);
                            setFilters((prevState) => ({
                              ...prevState,
                              cateid: item.ID,
                            }));
                          }}
                        >
                          {item.Title}
                          <div
                            className={clsx(
                              "absolute right-4 top-2/4 -translate-y-2/4 transition",
                              item.Active.includes(filters.cateid)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          >
                            <CheckIcon className="w-5" />
                          </div>
                        </Link>
                      </div>
                      {item.Children && item.Children.length > 0 && (
                        <div className="border-t">
                          {item.Children.map((sub, idx) => (
                            <div className="border-b last:border-0" key={idx}>
                              <Link
                                className={clsx(
                                  "flex items-center px-4 py-3 font-medium",
                                  sub.ID === filters.cateid
                                    ? "text-app"
                                    : "text-[#3F4254]"
                                )}
                                noLinkClass
                                onClick={() => {
                                  f7.panel.close(Dom7("#panel-cate-prod"));
                                  setFilters((prevState) => ({
                                    ...prevState,
                                    cateid: sub.ID,
                                  }));
                                }}
                              >
                                <div className="w-1 h-1 bg-[#B5B5C3] rounded-full mr-2"></div>
                                {sub.Title}
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </Panel>

      <Toolbar
        className="bg-white"
        bottom
        inner={false}
        outline={false}
        hidden={!selected || selected.length === 0}
      >
        <Button
          type="button"
          className="rounded-none bg-app"
          fill
          large
          preloader
          loading={addMutation.isLoading || addCheckInMutation.isLoading}
          disabled={addMutation.isLoading || addCheckInMutation.isLoading}
          onClick={onChange}
        >
          Xác nhận ({selected && selected.length})
        </Button>
      </Toolbar>
    </Page>
  );
}

export default PosAddProd;

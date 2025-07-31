import {
  ArrowPathRoundedSquareIcon,
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  GiftIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import {
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Popover,
  Subnavbar,
  Tab,
  Tabs,
  f7,
  useStore,
} from "framework7-react";
import React, { useState } from "react";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import { useMutation, useQuery } from "react-query";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import {
  MenuSubNavbar,
  PickerReservedService,
  PickerServiceAddRemove,
  PickerServiceChangeStock,
  PickerServiceEnd,
  PickerServiceEndDate,
  PickerServiceGiftDay,
  PickerServiceInfo,
  PickerServiceRegimen,
  PickerServiceShiftAss,
  PickerServiceTransfer,
} from "./components";
import Dom7 from "dom7";
import clsx from "clsx";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import PullToRefresh from "react-simple-pull-to-refresh";

let initialData = [
  {
    Index: 1,
    Title: "Thẻ dịch vụ",
    ID: "Service",
    children: [],
  },
  {
    Index: 2,
    Title: "Thẻ bảo hành",
    ID: "Warranty",
    children: [],
  },
  {
    Index: 3,
    Title: "Thẻ hết hạn",
    ID: "Expired",
    children: [],
  },
];

let HAS_RESERVED = "ĐANG BẢO LƯU";

function PosClientServices({ f7router, f7route }) {
  const [active, setActive] = useState("Service");

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  let formatLists = (arr) => {
    let newArr = arr.map((x) => {
      let obj = {
        ...x,
        ServicesNew: x.Services.filter((x) => x.Status === "done").sort(
          (a, b) => new Date(b.BookDate) - new Date(a.BookDate)
        ),
      };
      return {
        ...obj,
        BookDate:
          obj.ServicesNew && obj.ServicesNew.length > 0
            ? obj.ServicesNew[0].BookDate
            : null,
      };
    });
    newArr = newArr.sort((a, b) => new Date(b.BookDate) - new Date(a.BookDate));
    return newArr;
  };

  const Services = useQuery({
    queryKey: ["ClientServicesID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let newInitialData = [...initialData];
      let data = await appPOS.getOsList({ mid: f7route?.params?.id });
      let newData = data ? data.filter((x) => x.Product?.IsAddFee !== 1) : [];
      newInitialData[0].children = newData.filter((x) => x.TabIndex === 0);
      newInitialData[1].children = formatLists(
        newData.filter((x) => x.TabIndex === 1)
      );
      newInitialData[2].children = formatLists(
        newData.filter((x) => x.TabIndex === 2)
      );

      return newInitialData;
    },
    enabled: Number(f7route?.params?.id) > 0,
    //initialData: initialData,
  });

  const cancelAllMutation = useMutation({
    mutationFn: async (body) => {
      let data = await Promise.all(
        body.Services.map((service) => {
          var bodyFormData = new FormData();
          bodyFormData.append("cmd", "cancel_service");
          bodyFormData.append("OrderServiceID", service.ID);

          return AdminAPI.clientsChangeServicesItem({
            ...body,
            data: bodyFormData,
          });
        })
      );
      await Services.refetch();
      return data;
    },
  });

  const warrantyMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsChangeServicesItem(body);
      await Services.refetch();
      return data;
    },
  });

  const onWarrantyActive = ({ OrderItem, Product }) => {
    f7.dialog.confirm("Xác nhận kích hoạt bảo hành ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      let values = {
        cmd: "srv_active_warranty",
        OrderItemID: OrderItem?.ID,
        ProdServiceID: Product?.ID,
        MemberID: f7route?.params?.id,
      };

      var bodyFormData = new FormData();

      for (const property in values) {
        bodyFormData.append(property, values[property]);
      }

      warrantyMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
          cmd: "srv_active_warranty",
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: ({ data }) => {
            if (data?.error) {
              toast.error(data?.error);
            } else {
              toast.success("Kích hoạt bảo hành thành công.");
            }
            f7.dialog.close();
          },
        }
      );
    });
  };

  const onAddWarranty = ({ OrderItem, Product }) => {
    f7.dialog.confirm("Xác nhận tạo buổi bảo hành ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      let values = {
        cmd: "srv_add_warranty",
        OrderItemID: OrderItem?.ID,
        ProdServiceID: Product?.ID,
        MemberID: f7route?.params?.id,
      };

      var bodyFormData = new FormData();

      for (const property in values) {
        bodyFormData.append(property, values[property]);
      }

      warrantyMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
          cmd: "srv_add_warranty",
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: ({ data }) => {
            if (data?.error) {
              toast.error(data?.error);
            } else {
              toast.success("Tạo buổi bảo hành thành công.");
            }
            f7.dialog.close();
          },
        }
      );
    });
  };

  const onCancelAll = ({ Services }) => {
    let newServices = Services?.filter((x) => x.Status !== "done");

    f7.dialog.confirm("Xác nhận huỷ cả liệu trình ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");

      cancelAllMutation.mutate(
        {
          Services: newServices,
          Token: Auth?.token,
          cmd: "cancel_service",
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: ({ data }) => {
            if (data?.error) {
              toast.error(data?.error);
            } else {
              toast.success("Huỷ thành công.");
            }
            f7.dialog.close();
          },
        }
      );
    });
  };

  const getDateReserved = (sv) => {
    let date = "";
    let index = sv.findIndex(
      (x) => x.Desc && x.Desc.toUpperCase().indexOf(HAS_RESERVED) > -1
    );
    if (index > -1) {
      let Desc = sv[index].Desc;
      if (Desc && Desc.toUpperCase().indexOf("ĐANG BẢO LƯU") > -1) {
        var found = [],
          rxp = /{([^}]+)}/g,
          curMatch;
        while ((curMatch = rxp.exec(Desc))) {
          found.push(curMatch[1]);
        }
        if (found && found.length > 1) {
          date = found[0];
        }
      }
    }
    return date;
  };

  return (
    <Page
      className="bg-white"
      name="Pos-service-management"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      //ptr
      //onPtrRefresh={(done) => Services.refetch().then(() => done())}
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
        <NavTitle>Quản lý thẻ dịch vụ</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
        <Subnavbar>
          <div className="w-full h-full px-2">
            <MenuSubNavbar
              data={Services?.data || initialData}
              selected={active}
              setSelected={(val) => {
                setActive(val);
                f7.tab.show(Dom7("#" + val), true);
              }}
            />
          </div>
        </Subnavbar>
      </Navbar>
      <div className="bg-[#f5f8fa] h-full">
        <PullToRefresh className="h-full ezs-ptr" onRefresh={Services.refetch}>
          <Tabs animated>
            {(Services?.data || initialData)?.map((item, index) => (
              <Tab
                className="pt-0 pb-safe-b page-content"
                id={item.ID}
                key={index}
                tabActive={active === item.ID}
              >
                <>
                  {!Services?.isLoading && (
                    <>
                      {item?.children && item?.children?.length > 0 && (
                        <div className="p-4">
                          {item?.children.map((service, index) => (
                            <div
                              className="mb-4 bg-white rounded last:mb-0"
                              key={index}
                            >
                              <div className="flex items-center gap-3 p-4 border-b">
                                <div className="relative w-14">
                                  <img
                                    className="object-cover w-full h-full rounded-full aspect-square"
                                    src={AssetsHelpers.toAbsoluteUrl(
                                      service?.Thumbnail
                                    )}
                                  />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-base font-medium truncate">
                                    {service?.OrderItemProdTitle}
                                  </div>
                                  <div className="mt-px font-light text-gray-500 truncate">
                                    {service?.Title}
                                  </div>
                                </div>

                                {Brand?.Global?.Admin?.tang_them_xoa_buoi &&
                                Auth?.ID !== 1 ? (
                                  <PickerServiceInfo data={service}>
                                    {({ open }) => (
                                      <Link
                                        onClick={open}
                                        className="flex items-baseline justify-end w-12 h-12"
                                      >
                                        <EllipsisHorizontalIcon className="w-6" />
                                      </Link>
                                    )}
                                  </PickerServiceInfo>
                                ) : (
                                  <>
                                    <Link
                                      popoverOpen={`.popover-${item.ID}-${service.OrderItem.ID}`}
                                      className="flex items-baseline justify-end w-12 h-12"
                                    >
                                      <EllipsisHorizontalIcon className="w-6" />
                                    </Link>
                                    <Popover
                                      className={`popover-${item.ID}-${service.OrderItem.ID}`}
                                    >
                                      <div className="flex flex-col py-1">
                                        <PickerServiceInfo data={service}>
                                          {({ open }) => (
                                            <Link
                                              onClick={open}
                                              popoverClose
                                              className="flex justify-between p-3 font-medium border-b last:border-0"
                                              noLinkClass
                                            >
                                              Thông tin
                                            </Link>
                                          )}
                                        </PickerServiceInfo>
                                        <PickerServiceTransfer
                                          data={service}
                                          MemberID={f7route?.params?.id}
                                        >
                                          {({ open }) => (
                                            <Link
                                              onClick={open}
                                              popoverClose
                                              className="flex justify-between p-3 font-medium border-b last:border-0"
                                              noLinkClass
                                            >
                                              Chuyển nhượng thẻ liệu trình
                                            </Link>
                                          )}
                                        </PickerServiceTransfer>
                                        {service.TabIndex !== 1 && (
                                          <PickerServiceGiftDay
                                            data={service}
                                            MemberID={f7route?.params?.id}
                                          >
                                            {({ open }) => (
                                              <Link
                                                onClick={open}
                                                popoverClose
                                                className="flex justify-between p-3 font-medium border-b last:border-0"
                                                noLinkClass
                                              >
                                                Tặng buổi
                                              </Link>
                                            )}
                                          </PickerServiceGiftDay>
                                        )}
                                        <PickerServiceAddRemove
                                          data={service}
                                          MemberID={f7route?.params?.id}
                                        >
                                          {({ open }) => (
                                            <Link
                                              onClick={open}
                                              popoverClose
                                              className="flex justify-between p-3 font-medium border-b last:border-0"
                                              noLinkClass
                                            >
                                              Thêm - Xoá buổi
                                            </Link>
                                          )}
                                        </PickerServiceAddRemove>
                                        <PickerServiceEndDate
                                          data={service}
                                          MemberID={f7route?.params?.id}
                                        >
                                          {({ open }) => (
                                            <Link
                                              onClick={open}
                                              popoverClose
                                              className="flex justify-between p-3 font-medium border-b last:border-0"
                                              noLinkClass
                                            >
                                              Thay đổi hạn sử dụng
                                            </Link>
                                          )}
                                        </PickerServiceEndDate>
                                        {!service.Services.some(
                                          (x) =>
                                            x?.TranBy && x?.TranBy?.Tranby > 0
                                        ) && (
                                          <PickerServiceEnd
                                            data={service}
                                            MemberID={f7route?.params?.id}
                                          >
                                            {({ open }) => (
                                              <Link
                                                onClick={open}
                                                popoverClose
                                                className="flex justify-between p-3 font-medium border-b last:border-0"
                                                noLinkClass
                                              >
                                                Kết thúc thẻ
                                              </Link>
                                            )}
                                          </PickerServiceEnd>
                                        )}
                                        <PickerServiceChangeStock
                                          data={service}
                                          MemberID={f7route?.params?.id}
                                        >
                                          {({ open }) => (
                                            <Link
                                              popoverClose
                                              className="flex justify-between p-3 font-medium border-b last:border-0"
                                              noLinkClass
                                              onClick={open}
                                            >
                                              Thay đổi cơ sở
                                            </Link>
                                          )}
                                        </PickerServiceChangeStock>

                                        {service.BH_Kichhoat && (
                                          <Link
                                            popoverClose
                                            className="flex justify-between p-3 font-medium border-b last:border-0"
                                            noLinkClass
                                            onClick={() =>
                                              onWarrantyActive(service)
                                            }
                                          >
                                            Kích hoạt bảo hành
                                          </Link>
                                        )}

                                        {service.Product.PhacDo && (
                                          <PickerServiceRegimen
                                            data={service}
                                            MemberID={f7route?.params?.id}
                                          >
                                            {({ open }) => (
                                              <Link
                                                onClick={open}
                                                popoverClose
                                                className="flex justify-between p-3 font-medium border-b last:border-0"
                                                noLinkClass
                                              >
                                                Cài đặt phác đồ
                                              </Link>
                                            )}
                                          </PickerServiceRegimen>
                                        )}
                                        <PickerServiceShiftAss
                                          data={service}
                                          MemberID={f7route?.params?.id}
                                        >
                                          {({ open }) => (
                                            <Link
                                              onClick={open}
                                              popoverClose
                                              className="flex justify-between p-3 font-medium border-b last:border-0"
                                              noLinkClass
                                            >
                                              Giao ca cả liệu trình
                                            </Link>
                                          )}
                                        </PickerServiceShiftAss>

                                        {service.Services &&
                                          service.Services.some(
                                            (x) => x.Status === "doing"
                                          ) && (
                                            <Link
                                              popoverClose
                                              className="flex justify-between p-3 font-medium border-b last:border-0 text-danger"
                                              noLinkClass
                                              onClick={() =>
                                                onCancelAll(service)
                                              }
                                            >
                                              Huỷ lịch cả liệu trình
                                            </Link>
                                          )}

                                        {service.TabIndex === 0 && (
                                          <PickerReservedService
                                            Services={
                                              service?.Services
                                                ? service.Services.filter(
                                                    (x) => x.Status !== "doing"
                                                  )
                                                : []
                                            }
                                            isCancel={
                                              service.Services &&
                                              service.Services.some(
                                                (x) =>
                                                  x.Desc &&
                                                  x.Desc.toUpperCase().indexOf(
                                                    HAS_RESERVED
                                                  ) > -1
                                              )
                                            }
                                          >
                                            {({ open }) => (
                                              <Link
                                                popoverClose
                                                className="flex justify-between p-3 font-medium border-b last:border-0"
                                                noLinkClass
                                                onClick={() => {
                                                  if (
                                                    service.Services &&
                                                    service.Services.some(
                                                      (x) =>
                                                        x.Status !== "done" &&
                                                        x.Desc &&
                                                        x.Desc.toUpperCase().indexOf(
                                                          "ĐÃ XẾP LỚP"
                                                        ) > -1
                                                    )
                                                  ) {
                                                    toast.error(
                                                      "Có buổi đã sử dụng xếp lớp cho học viên. Vui lòng huỷ học viên ra khởi lớp."
                                                    );
                                                  } else {
                                                    open();
                                                  }
                                                }}
                                              >
                                                {service.Services &&
                                                service.Services.some(
                                                  (x) =>
                                                    x.Desc &&
                                                    x.Desc.toUpperCase().indexOf(
                                                      HAS_RESERVED
                                                    ) > -1
                                                )
                                                  ? "Huỷ bảo lưu"
                                                  : "Bảo lưu"}
                                              </Link>
                                            )}
                                          </PickerReservedService>
                                        )}
                                      </div>
                                    </Popover>
                                  </>
                                )}
                              </div>
                              {service.Services &&
                                service.Services.length > 0 && (
                                  <div className="grid grid-cols-4 gap-3 p-4">
                                    {service.Services.map((item, idx) => (
                                      <Link
                                        noLinkClass
                                        href={
                                          "/admin/pos/calendar/os/?formState=" +
                                          encodeURIComponent(
                                            JSON.stringify({
                                              Os: {
                                                ID: item?.ID,
                                                MemberID: item?.MemberID || "",
                                                ProdService:
                                                  item?.ProdService || "",
                                                ProdService2:
                                                  item?.ProdService2 || "",
                                                Title: item?.Title || "",
                                              },
                                            })
                                          )
                                        }
                                        className={clsx(
                                          "relative flex items-center justify-center text-white rounded aspect-square shadow",
                                          item.BookDate &&
                                            item.Status === "done" &&
                                            "bg-[#808080]",
                                          !item.BookDate && "bg-primary",
                                          item.BookDate &&
                                            item.Status !== "done" &&
                                            "bg-success"
                                        )}
                                        key={idx}
                                      >
                                        {item.Status === "done" && (
                                          <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
                                            ✔
                                          </div>
                                        )}
                                        {item.Status !== "done" &&
                                          item.IsWarrant && (
                                            <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
                                              <ShieldExclamationIcon className="w-4" />
                                            </div>
                                          )}

                                        {item.ConvertProdID ? (
                                          <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
                                            <ArrowPathRoundedSquareIcon className="w-4" />
                                          </div>
                                        ) : (
                                          <></>
                                        )}

                                        {item.Meta &&
                                          item.Meta.indexOf("gift") > -1 && (
                                            <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
                                              <GiftIcon className="w-4" />
                                            </div>
                                          )}

                                        {item.Status === "done" && (
                                          <div className="absolute text-xs pointer-events-none top-1 left-1 font-lato">
                                            {moment(item.BookDate).format(
                                              "DD-MM"
                                            )}
                                          </div>
                                        )}
                                        {item.Status !== "done" &&
                                          item.BookDate && (
                                            <div className="absolute text-xs pointer-events-none top-1 left-1 font-lato">
                                              {moment(item.BookDate).format(
                                                "DD-MM"
                                              )}
                                            </div>
                                          )}

                                        <div className="text-lg font-semibold pointer-events-none font-lato">
                                          {idx + 1}
                                        </div>
                                        {item.Staffs &&
                                          item.Staffs.length > 0 && (
                                            <div className="absolute pointer-events-none bottom-1 left-1">
                                              <div className="flex -space-x-2.5 rtl:space-x-reverse">
                                                <img
                                                  className="w-5 h-5 border-2 border-white rounded-full"
                                                  src={AssetsHelpers.toAbsoluteUrlCore(
                                                    "/AppCore/images/blank.png",
                                                    ""
                                                  )}
                                                />
                                                {item.Staffs.length > 1 && (
                                                  <div className="flex items-center justify-center w-5 h-5 text-xs font-medium text-black bg-gray-200 border-2 border-white rounded-full font-lato">
                                                    +{item.Staffs.length - 1}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </Link>
                                    ))}
                                    {service.BH_Taobuoi && (
                                      <div
                                        className="relative flex items-center justify-center text-gray-500 bg-gray-200 rounded shadow aspect-square"
                                        onClick={() => onAddWarranty(service)}
                                      >
                                        <PlusIcon className="w-6" />
                                        <div className="absolute bottom-1.5 right-1.5 text-success">
                                          <ShieldExclamationIcon className="w-4" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              {service?.BookPredictDate && (
                                <div className="px-4 pb-4 font-medium text-gray-600">
                                  Dự kiến buổi tiếp :
                                  <span className="pl-1 font-semibold font-lato text-[15px]">
                                    {moment(service.BookPredictDate).format(
                                      "HH:mm DD/MM/YYYY"
                                    )}
                                  </span>
                                </div>
                              )}
                              {service.Services &&
                                service.Services.some(
                                  (x) =>
                                    x.Desc &&
                                    x.Desc.toUpperCase().indexOf(HAS_RESERVED) >
                                      -1
                                ) && (
                                  <div className="px-4 pb-4 font-medium text-warning text-[15px]">
                                    Đang bảo lưu đến ngày{" "}
                                    {getDateReserved(service.Services)}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                      {(!item?.children || item?.children?.length === 0) && (
                        <NoFound
                          Title="Không có kết quả nào."
                          Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                        />
                      )}
                    </>
                  )}
                  {Services?.isLoading && (
                    <div className="p-4">
                      <div className="mb-4 bg-white rounded last:mb-0">
                        <div className="flex items-center gap-3 p-4 border-b">
                          <div className="relative w-14">
                            <div
                              role="status"
                              className="flex items-center justify-center w-full h-full max-w-sm bg-gray-300 rounded-full aspect-square animate-pulse"
                            >
                              <svg
                                className="w-5 h-5 text-gray-200"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 16 20"
                              >
                                <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
                                <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM9 13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2Zm4 .382a1 1 0 0 1-1.447.894L10 13v-2l1.553-1.276a1 1 0 0 1 1.447.894v2.764Z" />
                              </svg>
                              <span className="sr-only">Loading...</span>
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-base font-medium truncate">
                              <div className="w-24 h-3 mb-2 bg-gray-300 rounded-full"></div>
                              <div className="w-10/12 h-2 mb-2 bg-gray-300 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 p-4">
                          {Array(12)
                            .fill()
                            .map((_, idx) => (
                              <Link
                                noLinkClass
                                className={clsx(
                                  "relative flex items-center justify-center text-white rounded aspect-square shadow bg-primary animate-pulse"
                                )}
                                key={idx}
                              >
                                <div className="text-lg font-semibold pointer-events-none font-lato">
                                  {idx + 1}
                                </div>
                              </Link>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              </Tab>
            ))}
          </Tabs>
        </PullToRefresh>
      </div>
    </Page>
  );
}

export default PosClientServices;

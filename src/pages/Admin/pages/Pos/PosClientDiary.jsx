import {
  AdjustmentsVerticalIcon,
  CheckIcon,
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  PhotoBrowser,
  Popover,
  Subnavbar,
  Tab,
  Tabs,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { MenuSubNavbar, PickerAddNoteDiary } from "./components";
import NoFound from "@/components/NoFound";
import Dom7 from "dom7";
import PromHelpers from "@/helpers/PromHelpers";
import { useMutation, useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import moment from "moment";
import clsx from "clsx";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import { toast } from "react-toastify";
import StringHelpers from "@/helpers/StringHelpers";

let Menu = [
  {
    Index: 1,
    ID: "NotiServices",
    Title: "Ghi chú",
    children: [],
    items: [],
    Key: "NotiServices",
  },
  {
    Index: 2,
    ID: "Attachments",
    Title: "Hình ảnh & Clips",
    children: [],
    items: [],
    Key: "Attachments",
  },
  {
    Index: 3,
    ID: "NotiDates",
    Title: "Lịch nhắc",
    children: [],
    items: [],
    Key: "NotiDates",
  },
  {
    Index: 4,
    ID: "ServicesHistory",
    Title: "Lịch sử dịch vụ",
    children: [],
    items: [],
    Key: "ServicesHistory",
  },
  {
    Index: 5,
    ID: "SalesHistory",
    Title: "Lịch sử mua hàng",
    children: [],
    items: [],
    Key: "SalesHistory",
  },
];

function PosClientDiary({ f7router, f7route }) {
  let [Menus, setMenus] = useState(Menu);
  const [active, setActive] = useState(Menu[0].ID);
  const [SortedByTime, setSortedByTime] = useState(true);
  const [TypeSale, setTypeSale] = useState({
    Title: "Tất cả",
    Value: -1,
  });
  const [photos, setPhotos] = useState([]);

  const standalone = useRef(null);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { isLoading, refetch } = useQuery({
    queryKey: ["ClientDiaryID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientCareDiaryId({
        MemberID: f7route?.params?.id,
        Token: Auth?.token,
      });
      let newMenu = [...Menus];
      if (data?.data) {
        for (const property in data?.data) {
          let index = Menu.findIndex((x) => x.Key === property);
          if (index > -1) {
            if (property === "NotiServices") {
              newMenu[index].children = data?.data[property];
              newMenu[index].items = ArrayHelpers.groupbyDDHHMM(
                data?.data[property],
                "CreateDate"
              );
            } else if (property === "Attachments") {
              let newItems = [];
              if (data?.data[property] && data?.data[property].length > 0) {
                for (let obj of data?.data[property]) {
                  let idx = newItems.findIndex(
                    (x) =>
                      moment(x.BookDate).format("DD-MM-YYYY") ===
                      moment(obj?.OrderService?.BookDate).format("DD-MM-YYYY")
                  );
                  if (idx > -1) {
                    newItems[idx].Items = [...newItems[idx].Items, obj.Items];
                  } else {
                    newItems.push({
                      ...obj,
                      BookDate: obj?.OrderService?.BookDate,
                    });
                  }
                }
              }

              newMenu[index].children = data?.data[property];
              newMenu[index].items = newItems;
            } else {
              newMenu[index].children = data?.data[property];
              newMenu[index].items = data?.data[property];
            }
          }
        }
      }

      return newMenu || null;
    },
    onSuccess: (data) => {
      setMenus(data);
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const { isLoading: isLoadingProds } = useQuery({
    queryKey: ["ClientHisProdDiaryID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientCareHisProdDiaryId({
        MemberID: f7route?.params?.id,
        Token: Auth?.token,
      });
      let newMenu = [...Menus];
      if (data?.items) {
        let index = newMenu.findIndex((x) => x.Key === "SalesHistory");
        if (index > -1) {
          newMenu[index].children = data?.items;
          newMenu[index].items = ArrayHelpers.groupbyDDHHMM(
            data?.items,
            "CreateDate"
          );
        }
      }

      return newMenu || null;
    },
    onSuccess: (data) => {
      setMenus(data);
    },
  });

  const { isLoading: isLoadingService } = useQuery({
    queryKey: ["ClientHisServiceDiaryID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientCareHisServiceDiaryId({
        MemberID: f7route?.params?.id,
        Token: Auth?.token,
      });
      let newMenu = [...Menus];

      const dataNew = [];

      if (data && data.length > 0) {
        for (let item of data) {
          for (let service of item.Services) {
            if (service.Status === "done")
              dataNew.push({
                ...service,
                ProdTitle: item.OrderItem.ProdTitle,
                os: service,
              });
          }
        }
      }

      let index = newMenu.findIndex((x) => x.Key === "ServicesHistory");
      if (index > -1) {
        newMenu[index].children = dataNew;
        newMenu[index].items = ArrayHelpers.groupbyDDHHMM(
          dataNew,
          "CreateDate"
        );
      }

      return newMenu || null;
    },
    onSuccess: (data) => {
      setMenus(data);
    },
  });

  const { isLoading: isLoadingNotiDate } = useQuery({
    queryKey: ["ClientDiaryBooksID", { MemberID: f7route?.params?.id }],
    queryFn: async () => {
      const { data } = await AdminAPI.calendarBookings({
        From: moment().subtract(7, "day").format("YYYY-MM-DD"),
        To: moment().add(50, "year").format("YYYY-MM-DD"),
        StockID: CrStocks?.ID,
        Token: Auth?.token,
        MemberIDs: f7route?.params?.id,
        status: "XAC_NHAN,XAC_NHAN_TU_DONG",
      });

      let newMenu = [...Menus];

      if (data?.books) {
        let index = newMenu.findIndex((x) => x.Key === "NotiDates");
        if (index > -1) {
          let prevValues = newMenu[index].children;
          newMenu[index].children = [...prevValues, ...data?.books];
          newMenu[index].items = [...prevValues, ...data?.books];
        }
      }

      return newMenu || null;
    },
    onSuccess: (data) => {
      setMenus(data);
    },
  });

  useEffect(() => {
    if(photos && photos.length > 0) {
      standalone?.current?.open();
    }
  }, [photos])

  const doNotiMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientDoNoti(body);
      await refetch();
      return data;
    },
  });

  const isPhoto = (src) => {
    if (!src) return;
    let ext = src.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "webp", "png", "gif", "bmp"].indexOf(ext) > -1;
  };

  const onAlready = (item) => {
    f7.dialog.confirm("Xác nhận đã thực hiện nhắc ?", () => {
      f7.dialog.preloader("Đang thực hiện");
      var bodyFormData = new FormData();
      bodyFormData.append("noti_id", item?.ID);

      doNotiMutation.mutate(bodyFormData, {
        onSuccess: () => {
          f7.dialog.close();
          toast.success("Thực hiện thành công.");
        },
      });
    });
  };

  const getSaleHistory = (arr) => {
    if (!TypeSale || TypeSale?.Title === "Tất cả") return arr;
    let newArr = arr
      .map((x) => ({
        ...x,
        items: x.items.filter((o) => o.ProdOrService === TypeSale.Value),
      }))
      .filter((x) => x.items && x.items.length > 0);
    return newArr;
  };

  return (
    <Page
      className="bg-white"
      name="Pos-client-diary"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
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
        <NavTitle>Nhật ký khách hàng</NavTitle>
        <NavRight className="h-full">
          {active === "NotiServices" && (
            <PickerAddNoteDiary MemberID={f7route?.params?.id}>
              {({ open }) => (
                <Link
                  onClick={open}
                  noLinkClass
                  className="!text-white h-full flex item-center justify-center w-12"
                >
                  <PlusIcon className="w-6" />
                </Link>
              )}
            </PickerAddNoteDiary>
          )}
          {active === "Attachments" && (
            <>
              <Link
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
                popoverOpen=".popover-filter-attachments"
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </Link>
              <Popover className="popover-filter-attachments">
                <div className="flex flex-col py-1">
                  <Link
                    popoverClose
                    className={clsx(
                      "flex justify-between p-3 font-medium border-b last:border-0",
                      SortedByTime && "text-app"
                    )}
                    noLinkClass
                    onClick={() => setSortedByTime(true)}
                  >
                    Sắp xếp theo thời gian
                    {SortedByTime && <CheckIcon className="w-5" />}
                  </Link>
                  <Link
                    popoverClose
                    className={clsx(
                      "flex justify-between p-3 font-medium border-b last:border-0",
                      !SortedByTime && "text-app"
                    )}
                    noLinkClass
                    onClick={() => setSortedByTime(false)}
                  >
                    Sắp xếp theo dịch vụ
                    {!SortedByTime && <CheckIcon className="w-5" />}
                  </Link>
                </div>
              </Popover>
            </>
          )}
          {active === "SalesHistory" && (
            <>
              <Link
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
                popoverOpen=".popover-filter-attachments"
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </Link>
              <Popover className="popover-filter-attachments">
                <div className="flex flex-col py-1">
                  {[
                    {
                      Title: "Tất cả",
                      Value: -1,
                    },
                    {
                      Title: "Sản phẩm",
                      Value: 0,
                    },
                    {
                      Title: "Dịch vụ",
                      Value: 1,
                    },
                    {
                      Title: "Phụ phí",
                      Value: 2,
                    },
                    {
                      Title: "Nguyên vật liệu",
                      Value: 3,
                    },
                    {
                      Title: "Thẻ tiền",
                      Value: 4,
                    },
                  ].map((item, index) => (
                    <Link
                      key={index}
                      popoverClose
                      className={clsx(
                        "flex justify-between p-3 font-medium border-b last:border-0",
                        TypeSale?.Title === item.Title && "text-app"
                      )}
                      noLinkClass
                      onClick={() => setTypeSale(item)}
                    >
                      {item.Title}
                      {TypeSale?.Title === item?.Title && (
                        <CheckIcon className="w-5" />
                      )}
                    </Link>
                  ))}
                </div>
              </Popover>
            </>
          )}
        </NavRight>
        <Subnavbar>
          <MenuSubNavbar
            data={Menus || []}
            selected={active}
            setSelected={(val) => {
              setActive(val);
              f7.tab.show(Dom7("#" + val), true);
            }}
          />
        </Subnavbar>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="h-full bg-[#f5f8fa]">
        <Tabs animated>
          {Menus &&
            Menus.map((item, index) => (
              <Tab
                className="pt-0 pb-safe-b page-content"
                id={item.ID}
                key={index}
                tabActive={active === item.ID}
              >
                {isLoading && (
                  <div className="p-4">
                    {Array(4)
                      .fill()
                      .map((_, index) => (
                        <div
                          className="p-4 mb-3.5 last:mb-0 bg-white rounded"
                          key={index}
                        >
                          <div className="w-8/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="mt-3">
                            <div className="w-2/4 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="w-7/12 h-2 mt-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {!isLoading && (
                  <>
                    {item.items && item.items.length > 0 && (
                      <div className="p-4">
                        {item.ID === "NotiServices" && (
                          <>
                            {item.items.map((note, index) => (
                              <div className="mb-3.5 last:mb-0" key={index}>
                                <div className="flex items-center">
                                  <div className="w-1.5 h-1.5 mr-2 rounded-full bg-primary"></div>
                                  <div className="px-2.5 py-1 font-medium rounded bg-primary-light text-primary">
                                    {moment(note.dayFull).format(
                                      "[Ngày] DD [Th]MM YYYY"
                                    )}
                                  </div>
                                </div>
                                <div>
                                  {note?.items.map((item, idx) => (
                                    <div
                                      className="p-4 mt-3 bg-white rounded"
                                      key={idx}
                                    >
                                      <div className="flex justify-between">
                                        <div className="flex text-gray-500">
                                          <div>
                                            {moment(note.dayFull).format(
                                              "HH:mm"
                                            )}
                                          </div>
                                          <div className="px-1">-</div>
                                          <div>{item?.User?.FullName}</div>
                                        </div>
                                        <PickerAddNoteDiary
                                          MemberID={f7route?.params?.id}
                                          data={item}
                                        >
                                          {({ open }) => (
                                            <div onClick={open}>
                                              <EllipsisHorizontalIcon className="w-6" />
                                            </div>
                                          )}
                                        </PickerAddNoteDiary>
                                      </div>
                                      <div
                                        className={clsx(
                                          "mt-2",
                                          item?.IsImportant && "text-danger"
                                        )}
                                        dangerouslySetInnerHTML={{
                                          __html:
                                            StringHelpers.fixedContentDomain(
                                              item.Content
                                            ),
                                        }}
                                      ></div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {item.ID === "Attachments" && (
                          <>
                            {SortedByTime &&
                              item.items.map((attachments, index) => (
                                <div className="mb-3.5 last:mb-0" key={index}>
                                  <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 mr-2 rounded-full bg-primary"></div>
                                    <div className="px-2.5 py-1 font-medium rounded bg-primary-light text-primary">
                                      {moment(attachments?.BookDate).format(
                                        "[Ngày] DD [Th]MM YYYY"
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mt-3.5">
                                    {attachments?.Items.map((item, idx) => (
                                      <div
                                        className="bg-white rounded"
                                        key={idx}
                                      >
                                        <div className="flex items-center aspect-square">
                                          {isPhoto(item.Src) ? (
                                            <img
                                              className="h-full rounded-t"
                                              src={AssetsHelpers.toAbsoluteUrl(
                                                item.Src
                                              )}
                                              onClick={() => {
                                                setPhotos([
                                                  {
                                                    url: AssetsHelpers.toAbsoluteUrl(
                                                      item.Src
                                                    ),
                                                    caption:
                                                      attachments?.OrderService
                                                        ?.Title,
                                                  },
                                                ]);
                                                //standalone.current.open(0);
                                              }}
                                            />
                                          ) : (
                                            <video
                                              className="w-full h-full rounded-t"
                                              controls
                                            >
                                              <source
                                                src={AssetsHelpers.toAbsoluteUrl(
                                                  item.Src
                                                )}
                                                type="video/mp4"
                                              />
                                            </video>
                                          )}
                                        </div>
                                        <div className="px-2 py-3.5 text-center text-gray-700">
                                          {attachments?.OrderService?.Title}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            {!SortedByTime &&
                              item.children.map((attachments, index) => (
                                <div className="mb-3.5 last:mb-0" key={index}>
                                  <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 mr-2 rounded-full bg-primary"></div>
                                    <div className="px-2.5 py-1 font-medium rounded bg-primary-light text-primary">
                                      {attachments?.OrderService?.Title}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mt-3.5">
                                    {attachments?.Items.map((item, idx) => (
                                      <div
                                        className="bg-white rounded"
                                        key={idx}
                                      >
                                        <div className="flex items-center aspect-square">
                                          {isPhoto(item.Src) ? (
                                            <img
                                              className="object-cover h-full rounded-t"
                                              src={AssetsHelpers.toAbsoluteUrl(
                                                item.Src
                                              )}
                                              onClick={() => {
                                                setPhotos([
                                                  {
                                                    url: AssetsHelpers.toAbsoluteUrl(
                                                      item.Src
                                                    ),
                                                    caption:
                                                      attachments?.OrderService
                                                        ?.Title,
                                                  },
                                                ]);
                                              }}
                                            />
                                          ) : (
                                            <video
                                              className="w-full h-full rounded-t"
                                              controls
                                            >
                                              <source
                                                src={AssetsHelpers.toAbsoluteUrl(
                                                  item.Src
                                                )}
                                                type="video/mp4"
                                              />
                                            </video>
                                          )}
                                        </div>
                                        <div className="px-2 py-3.5 text-center text-gray-700">
                                          {moment(item?.CreateDate).format(
                                            "DD-MM-YYYY"
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              
                            <PhotoBrowser
                              photos={photos}
                              thumbs={photos.map((x) => x.url)}
                              ref={standalone}
                              navbarShowCount={true}
                              toolbar={false}
                            />
                          </>
                        )}
                        {item.ID === "NotiDates" && (
                          <>
                            {item?.items.map((item, idx) => (
                              <div
                                className="p-4 mb-3.5 last:mb-0 bg-white rounded"
                                key={idx}
                              >
                                {item.BookDate && (
                                  <>
                                    <div className="flex justify-between">
                                      <div className="flex text-gray-500">
                                        <div>Đặt lịch lúc</div>
                                        <div className="pl-1.5">
                                          {moment(item.BookDate).format(
                                            "HH:mm DD-MM-YYYY"
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <div className="font-medium text-primary">
                                        {item.RootTitles || "Chưa xác định"}
                                      </div>
                                      {item.Desc && (
                                        <div className="mt-1 text-gray-500">
                                          {item.Desc}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                                {!item.BookDate && (
                                  <>
                                    <div className="flex justify-between">
                                      <div className="flex text-gray-500">
                                        <div>
                                          {moment(item.NotiDate).format(
                                            "HH:mm DD-MM-YYYY"
                                          )}
                                        </div>
                                        <div className="px-1">-</div>
                                        <div>{item?.User?.FullName}</div>
                                      </div>
                                      {item.IsEd !== 1 && (
                                        <div onClick={() => onAlready(item)}>
                                          <EllipsisHorizontalIcon className="w-6" />
                                        </div>
                                      )}
                                    </div>
                                    {item.IsEd === 1 && (
                                      <div className="inline-flex px-2 py-px mt-2 text-xs rounded bg-success-light text-success">
                                        Đã thực hiện nhắc
                                      </div>
                                    )}
                                    <div
                                      className={clsx(
                                        "mt-2",
                                        item?.IsImportant && "text-danger"
                                      )}
                                      dangerouslySetInnerHTML={{
                                        __html: item.Content,
                                      }}
                                    ></div>
                                  </>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                        {item.ID === "ServicesHistory" && (
                          <>
                            {item.items.map((service, index) => (
                              <div className="mb-3.5 last:mb-0" key={index}>
                                <div className="flex items-center">
                                  <div className="w-1.5 h-1.5 mr-2 rounded-full bg-primary"></div>
                                  <div className="px-2.5 py-1 font-medium rounded bg-primary-light text-primary">
                                    {moment(service.dayFull).format(
                                      "[Ngày] DD [Th]MM YYYY"
                                    )}
                                  </div>
                                </div>
                                <div>
                                  {service?.items.map((item, idx) => (
                                    <div
                                      className="p-4 mt-3 bg-white rounded"
                                      key={idx}
                                    >
                                      <div className="flex justify-between">
                                        <div className="flex text-gray-500">
                                          <div>
                                            {moment(item.dayFull).format(
                                              "HH:mm"
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <div className="mb-1 font-medium text-primary">
                                          {item.ProdTitle}
                                        </div>
                                        <div className="text-gray-500">
                                          {item.ProdService ||
                                            item.ProdService2}
                                        </div>
                                      </div>
                                      {Number(item.Rate) > 0 && (
                                        <div className="pt-3 mt-3 border-t border-dashed">
                                          <div className="flex items-center">
                                            <div className="flex items-center">
                                              {[1, 2, 3, 4, 5].map((val, i) => (
                                                <svg
                                                  key={i}
                                                  className={clsx(
                                                    "w-4 h-4 mr-1",
                                                    val <= Number(item.Rate)
                                                      ? "text-yellow-300"
                                                      : "text-gray-300"
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
                                            <div className="pl-1 text-gray-500">
                                              {item.Rate} trên 5
                                            </div>
                                          </div>
                                          {item.RateNote && (
                                            <div className="mt-1 font-light text-gray-500">
                                              {item.RateNote}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {item.ID === "SalesHistory" && (
                          <>
                            {getSaleHistory(item.items).length > 0 &&
                              getSaleHistory(item.items).map((prod, index) => (
                                <div className="mb-3.5 last:mb-0" key={index}>
                                  <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 mr-2 rounded-full bg-primary"></div>
                                    <div className="px-2.5 py-1 font-medium rounded bg-primary-light text-primary">
                                      {moment(prod.dayFull).format(
                                        "[Ngày] DD [Th]MM YYYY"
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    {prod?.items.map((item, idx) => (
                                      <div
                                        className="p-4 mt-3 bg-white rounded"
                                        key={idx}
                                      >
                                        <div className="flex justify-between">
                                          <div className="flex text-gray-500">
                                            <div>
                                              {moment(item.CreateDate).format(
                                                "HH:mm"
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="mt-2">{item.Title}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            {(!getSaleHistory(item.items) ||
                              getSaleHistory(item.items).length === 0) && (
                              <NoFound
                                Title="Không có kết quả nào."
                                Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {(!item.items || item.items.length === 0) && (
                      <NoFound
                        Title="Không có kết quả nào."
                        Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                      />
                    )}
                  </>
                )}
              </Tab>
            ))}
        </Tabs>
      </div>
    </Page>
  );
}

export default PosClientDiary;

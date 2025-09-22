import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Segmented,
  Subnavbar,
  Tab,
  Tabs,
  useStore,
  f7,
} from "framework7-react";
import React, { useState, useEffect, useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "react-query";
import StaffsAPI from "../../api/Staffs.api";
import moment from "moment";
import StringHelpers from "../../helpers/StringHelpers";
import PromHelpers from "../../helpers/PromHelpers";
import AssetsHelpers from "../../helpers/AssetsHelpers";
import { DatePickerWrap } from "../../partials/forms";
import PickerDiaryAdd from "./components/PickerDiaryAdd";
import NoFound from "../../components/NoFound";
import Dom7 from "dom7";
import InfiniteScroll from "react-infinite-scroll-component";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import { PickerSheet } from "@/partials/components/Sheet";
import { PickerAddEditCustomerInfo } from "./components";
import { Fancybox } from "@fancyapps/ui";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { toast } from "react-toastify";

function TechniciansProfile({ id, memberid, f7route }) {
  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  const Brand = useStore("Brand");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const [filters, setFilters] = useState({
    mon: new Date(),
  });

  const [active, setActive] = useState("#thong-tin");

  const standalone = useRef(null);
  const elDiary = useRef(null);
  const elAttachments = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Technicians-Info"],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "member_sevice");
      bodyFormData.append("IsManager", 1);
      bodyFormData.append("IsService", 1);
      bodyFormData.append("MemberIDs", "");
      bodyFormData.append(
        "srv_status",
        "book,wait_book,wait,doing,done,cancel"
      );
      bodyFormData.append("srv_from", "");
      bodyFormData.append("srv_to", "");
      bodyFormData.append("key", "");
      bodyFormData.append("ps", 1);
      if (f7route.query.type) {
        bodyFormData.append("osid", id);
      } else {
        bodyFormData.append("mbid", id);
      }

      let { data } = await StaffsAPI.getServices({
        Filters: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID || "",
      });
      if (f7route.query.type) {
        return data?.data ? data?.data[0] : null;
      }
      return data?.mBook
        ? {
            ...data?.mBook[0],
            member: {
              ...data?.mBook[0].Member,
              FullName:
                data?.mBook[0]?.FullName || data?.mBook[0].Member?.FullName,
              MobilePhone:
                data?.mBook[0]?.Phone || data?.mBook[0].Member?.MobilePhone,
            },
          }
        : null;
    },
    enabled: Boolean(Auth && Auth?.ID),
  });

  const {
    data: Diary,
    isLoading: DiaryLoading,
    refetch: DiaryRefetch,
  } = useQuery({
    queryKey: ["Technicians-Diary"],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("mid", memberid);
      bodyFormData.append("cmd", "noti");

      let { data } = await StaffsAPI.getDiarys({
        Filters: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID || "",
      });

      return data || null;
    },
    enabled: Boolean(active === "#nhat-ky"),
  });

  const {
    data: Attachments,
    isLoading: AttachmentsLoading,
    refetch: AttachmentsRefetch,
  } = useQuery({
    queryKey: ["Technicians-Attachments", filters],
    queryFn: async () => {
      let bodyForm = {
        mid: memberid,
        from: moment(filters.mon).startOf("month").format("DD/MM/YYYY"),
        to: moment(filters.mon).endOf("month").format("DD/MM/YYYY"),
      };
      let { data } = await StaffsAPI.getAttachments(bodyForm);
      let Attachments = [];
      if (data?.list) {
        for (let item of data?.list) {
          const index = Attachments.findIndex(
            (o) =>
              moment(o.BookDate).format("DD-MM-YYYY") ===
              moment(item.BookDate).format("DD-MM-YYYY")
          );
          if (index > -1) {
            Attachments[index].Items.push(item);
          } else {
            const newObj = {
              BookDate: item.BookDate,
              Items: [item],
            };
            Attachments.push(newObj);
          }
        }
      }
      return Attachments.sort((left, right) =>
        moment.utc(right.BookDate).diff(moment.utc(left.BookDate))
      );
    },
    enabled: Boolean(active === "#hinh-anh"),
  });

  const CustomerInfoQuery = useInfiniteQuery({
    queryKey: ["Technicians-Customer"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await StaffsAPI.getCustomerInfo({
        data: { MemberID: memberid, Pi: pageParam, Ps: 20 },
        Token: Auth.token,
      });
      return data || null;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.Pi === lastPage.pCount ? undefined : lastPage.Pi + 1,
    keepPreviousData: true,
    enabled: Boolean(active === "#ho-so"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await StaffsAPI.deleteCustomerInfo(body);
      await CustomerInfoQuery.refetch();
      return data;
    },
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    CustomerInfoQuery?.data?.pages,
    "lst"
  );

  useEffect(() => {
    if (elDiary?.current || elAttachments?.current) {
      let $$ = Dom7;
      let images = [];
      if (active === "#hinh-anh") {
        images = $$(elAttachments?.current).find("img");
      }
      if (active === "#nhat-ky") {
        images = $$(elDiary?.current).find("img");
      }

      let newPhotos = [];

      for (const image of images) {
        let src = $$(image).attr("src");
        newPhotos.push({ url: src });
      }

      for (let [index, image] of images.entries()) {
        $$(image).click(() => {
          Fancybox.show(
            newPhotos.map((x) => ({
              src: x.url,
              thumbSrc: x.url,
            })),
            {
              Carousel: {
                Toolbar: {
                  items: {
                    downloadImage: {
                      tpl: '<button class="f-button"><svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"></path></svg></button>',
                      click: () => {
                        PromHelpers.OPEN_LINK(
                          AssetsHelpers.toAbsoluteUrl(image.Src)
                        );
                      },
                    },
                  },
                  display: {
                    left: ["counter"],
                    middle: [
                      "zoomIn",
                      "zoomOut",
                      // "toggle1to1",
                      "rotateCCW",
                      "rotateCW",
                      // "flipX",
                      // "flipY",
                    ],
                    right: [
                      "downloadImage",
                      //"thumbs",
                      "close",
                    ],
                  },
                },
              },
              startIndex: index,
            }
          );
        });
      }
    }
  }, [
    elDiary?.current,
    elAttachments?.current,
    Diary,
    Attachments,
    standalone,
    active,
  ]);

  const onDelete = (item) => {
    f7.dialog.confirm(`Bạn có chắc chắn muốn xoá ?`, () => {
      f7.dialog.preloader("Đang thực hiện...");

      deleteMutation.mutate(
        {
          data: {
            delete: [item.ID],
          },
          Token: Auth.token,
        },
        {
          onSuccess: (data) => {
            f7.dialog.close();
            toast.success(`Xoá thành công.`);
          },
        }
      );
    });
  };
  
  let isCustomer = Lists.some(
    (x) =>
      x.MemberID === Number(memberid) && x.Items &&
      x.Items.findIndex(
        (o) =>
          moment(o.CreateDate).format("DD-MM-YYYY") ===
          moment().format("DD-MM-YYYY")
      ) > -1
  );

  return (
    <Page
      name="Technicians-profile"
      noToolbar
      // ptr
      // onPtrRefresh={loadRefresh}
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
        <NavTitle>Thông tin khách hàng</NavTitle>
        {active === "#hinh-anh" && (
          <NavRight className="h-full">
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
        )}

        {active === "#nhat-ky" && (
          <NavRight className="h-full">
            <PickerDiaryAdd memberid={memberid}>
              {({ open }) => (
                <div
                  className="flex items-center justify-center w-12 h-full"
                  onClick={open}
                >
                  <PlusIcon className="w-6" />
                </div>
              )}
            </PickerDiaryAdd>
          </NavRight>
        )}

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
        <Subnavbar>
          <Segmented strong>
            <Button
              tabLink="#thong-tin"
              active={active === "#thong-tin"}
              onClick={() => setActive("#thong-tin")}
            >
              Thông tin
            </Button>
            <Button
              tabLink="#nhat-ky"
              active={active === "#nhat-ky"}
              onClick={() => {
                setActive("#nhat-ky");
              }}
            >
              Nhật ký
            </Button>
            <Button
              tabLink="#hinh-anh"
              active={active === "#hinh-anh"}
              onClick={() => setActive("#hinh-anh")}
            >
              Hình ảnh
            </Button>
            {Brand?.Global?.Admin?.thong_tin_pos && (
              <Button
                tabLink="#ho-so"
                active={active === "#ho-so"}
                onClick={() => setActive("#ho-so")}
              >
                Hồ sơ
              </Button>
            )}
          </Segmented>
        </Subnavbar>
      </Navbar>
      <Tabs animated>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          className="p-4 overflow-auto"
          id="thong-tin"
          tabActive
        >
          {isLoading && (
            <div className="py-2 mb-3 bg-white rounded last:mb-0" role="status">
              <div className="px-4 py-2">
                <div className="text-muted">Họ và tên</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-2/4 animate-pulse"></div>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-muted">Số điện thoại</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-2/5 animate-pulse"></div>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-muted">Ngày sinh</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-2/5 animate-pulse"></div>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-muted">Giới tính</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-2/5 animate-pulse"></div>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-muted">Địa chỉ</div>
                <div className="mt-1.5 font-medium">
                  <div className="h-2.5 bg-gray-200 rounded-full w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          {!isLoading && (
            <>
              <div className="py-2 mb-3 bg-white rounded last:mb-0">
                <div className="px-4 py-2">
                  <div className="text-muted">Họ và tên</div>
                  <div className="mt-px font-medium">
                    {data?.member?.FullName}
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-muted">Số điện thoại</div>
                  {Brand?.Global?.APP?.Staff?.hidePhoneMember ? (
                    <div className="mt-px font-medium text-primary">
                      **********
                    </div>
                  ) : (
                    <div
                      className="mt-px font-medium text-primary"
                      onClick={() =>
                        PromHelpers.CALL_PHONE(data?.member?.MobilePhone)
                      }
                    >
                      {data?.member?.MobilePhone}
                    </div>
                  )}
                </div>
                <div className="px-4 py-2">
                  <div className="text-muted">Ngày sinh</div>
                  <div className="mt-px font-medium capitalize">
                    {data?.member?.BirthDate
                      ? moment(data?.member?.BirthDate).format("DD-MM-YYYY")
                      : "Chưa có"}
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-muted">Giới tính</div>
                  <div className="mt-px font-medium capitalize">
                    {data?.member?.Gender === 0 && "Nữ"}
                    {data?.member?.Gender === 1 && "Nam"}
                    {data?.member?.Gender === "" && "Chưa xác định"}
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-muted">Địa chỉ</div>
                  {Brand?.Global?.APP?.Staff?.hideAddressMember ? (
                    <div className="mt-px font-medium capitalize">
                      ************************
                    </div>
                  ) : (
                    <div className="mt-px font-medium capitalize">
                      {data?.member?.HomeAddress || "Chưa xác đinh"}
                    </div>
                  )}
                </div>
              </div>
              {!Brand?.Global?.APP?.Staff?.hideWalletCard && (
                <div className="py-2 mb-3 bg-white rounded last:mb-0">
                  <div className="px-4 py-2">
                    <div className="text-muted">Công nợ</div>
                    <div className="mt-px font-medium">
                      {StringHelpers.formatVND(data?.member?.Present?.no)}
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-muted">Ví</div>
                    <div className="mt-px font-medium capitalize">
                      {StringHelpers.formatVND(data?.member?.Present?.nap_vi)}
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-muted">Thẻ tiền</div>
                    <div className="mt-px font-medium capitalize">
                      {StringHelpers.formatVND(
                        data?.member?.Present?.the_tien_kha_dung
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-muted">Tích điểm</div>
                    <div className="mt-px font-medium capitalize">
                      {data?.member?.Present?.points || 0}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Tab>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          id="nhat-ky"
          className="h-full p-4 overflow-auto"
        >
          {DiaryLoading && (
            <div className="timeline">
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div className="pb-4 timeline-item" key={index}>
                    <div className="timeline-item-date">
                      <span className="font-semibold">
                        <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      </span>
                    </div>
                    <div className="timeline-item-divider"></div>
                    <div className="w-full timeline-item-content">
                      <div className="p-3 bg-white rounded">
                        <div className="mb-3 text-xs font-semibold text-muted">
                          <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-full h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-9/12 h-2 mt-2 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!DiaryLoading && (
            <>
              {Diary && Diary.length > 0 && (
                <div className="timeline" ref={elDiary}>
                  {Diary &&
                    Diary.map((item, index) => (
                      <div className="pb-4 timeline-item" key={index}>
                        <div className="timeline-item-date">
                          <span className="font-semibold">
                            {moment(item.CreateDate).format("DD")}
                          </span>
                          <small className="pl-[2px]">
                            {moment(item.CreateDate).format("MMM")}
                          </small>
                        </div>
                        <div className="timeline-item-divider"></div>
                        <div className="w-full timeline-item-content">
                          <div className="p-3 bg-white rounded">
                            <div className="mt-1 text-xs text-muted mb-1.5 font-semibold">
                              {moment(item.CreateDate).fromNow()}{" "}
                              {item.IsNoti && (
                                <span className="text-danger">- Lịch nhắc</span>
                              )}
                            </div>
                            <div
                              className="child [&_img]:mt-1.5"
                              dangerouslySetInnerHTML={{
                                __html: StringHelpers.fixedContentDomain(
                                  item.Content
                                ),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {(!Diary || Diary.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </Tab>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          id="hinh-anh"
          className="p-4 overflow-auto"
        >
          {AttachmentsLoading && (
            <div className="timeline">
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div className="pb-4 timeline-item" key={index}>
                    <div className="timeline-item-date">
                      <span className="font-semibold">
                        <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      </span>
                    </div>
                    <div className="timeline-item-divider"></div>
                    <div className="w-full timeline-item-content">
                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded">
                        <div>
                          <div className="flex items-center justify-center w-full mb-2 bg-gray-300 rounded aspect-square sm:w-96">
                            <svg
                              className="w-6 h-6 text-gray-200 dark:text-gray-600"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 20 18"
                            >
                              <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                            </svg>
                          </div>

                          <div className="w-full h-1.5 bg-gray-300 rounded-full animate-pulse"></div>
                          <div className="w-9/12 h-1.5 mt-1 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center w-full mb-2 bg-gray-300 rounded aspect-square sm:w-96">
                            <svg
                              className="w-6 h-6 text-gray-200 dark:text-gray-600"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 20 18"
                            >
                              <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                            </svg>
                          </div>

                          <div className="w-full h-1.5 bg-gray-300 rounded-full animate-pulse"></div>
                          <div className="w-9/12 h-1.5 mt-1 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!AttachmentsLoading && (
            <>
              {Attachments && Attachments.length > 0 && (
                <div className="timeline" ref={elAttachments}>
                  {Attachments &&
                    Attachments.map((item, index) => (
                      <div className="pb-4 timeline-item" key={index}>
                        <div className="timeline-item-date">
                          <span className="font-semibold">
                            {moment(item.BookDate).format("DD")}
                          </span>
                          <small className="pl-[2px]">
                            {moment(item.BookDate).format("MMM")}
                          </small>
                        </div>
                        <div className="timeline-item-divider"></div>
                        <div className="w-full timeline-item-content">
                          <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded">
                            {item.Items.map((img, i) => (
                              <div className="relative" key={i}>
                                <img
                                  className="rounded"
                                  src={AssetsHelpers.toAbsoluteUrl(img.Src)}
                                  alt={img.Title}
                                />
                                <div className="mt-1.5 text-xs line-clamp-2">
                                  {img.Title}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {(!Attachments || Attachments.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </Tab>
        {Brand?.Global?.Admin?.thong_tin_pos && (
          <Tab
            onTabShow={(el) => Dom7(el).scrollTop(0)}
            id="ho-so"
            className="h-full"
          >
            <div className="flex flex-col h-full pb-safe-b">
              <div
                id="scrollableDivTechniciansInfo"
                className="overflow-auto grow"
              >
                <InfiniteScroll
                  dataLength={Lists.length}
                  next={CustomerInfoQuery.fetchNextPage}
                  hasMore={CustomerInfoQuery.hasNextPage}
                  loader={
                    CustomerInfoQuery.isLoading ? null : (
                      <>
                        {CustomerInfoQuery.isFetchingNextPage &&
                          Lists &&
                          Lists.length > 0 && (
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
                  scrollableTarget="scrollableDivTechniciansInfo"
                  refreshFunction={CustomerInfoQuery.refetch}
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
                    {CustomerInfoQuery?.isLoading && (
                      <>
                        {Array(2)
                          .fill()
                          .map((_, index) => (
                            <div
                              className="flex flex-col p-4 mb-3.5 bg-white rounded-lg last:mb-0 animate-pulse"
                              key={index}
                            >
                              {/* Dòng ngày + icon */}
                              <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0 items-center">
                                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                              </div>

                              {/* Dòng người nhập */}
                              <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0 items-center">
                                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                    
                    {!CustomerInfoQuery?.isLoading && (
                      <>
                        {Lists && Lists.length > 0 && (
                          <>
                            {Lists.map((item, index) => (
                              <div className="mb-3.5 last:mb-0" key={index}>
                                {item.Items &&
                                  item.Items.sort((x, y) =>
                                    moment(y.CreateDate).diff(
                                      moment(x.CreateDate)
                                    )
                                  ).map((sub, idx) => (
                                    <PickerSheet
                                      key={idx}
                                      Title="Bạn muốn thực hiện ?"
                                      Options={[
                                        {
                                          Title:
                                            moment().format("YYYY-MM-DD") !==
                                              moment(sub.CreateDate).format(
                                                "YYYY-MM-DD"
                                              ) && !adminTools_byStock?.hasRight
                                              ? "Xem chi tiết"
                                              : "Xem & chỉnh sửa",
                                          component: ({
                                            children,
                                            close,
                                            setHideForChild,
                                          }) => (
                                            <PickerAddEditCustomerInfo
                                              data={sub}
                                              MemberID={memberid}
                                              onOpen={() =>
                                                setHideForChild(true)
                                              }
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
                                            </PickerAddEditCustomerInfo>
                                          ),
                                        },

                                        {
                                          Title: "Xoá thông tin",
                                          className:
                                            "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer text-danger",
                                          onClick: (e) => {
                                            onDelete(sub);
                                          },
                                          hidden:
                                            moment().format("YYYY-MM-DD") !==
                                              moment(sub.CreateDate).format(
                                                "YYYY-MM-DD"
                                              ) &&
                                            !adminTools_byStock?.hasRight,
                                        },
                                      ].filter((x) => !x.hidden)}
                                      Close={{
                                        Title: "Đóng",
                                      }}
                                    >
                                      {({ open }) => (
                                        <div
                                          className="flex flex-col p-4 mb-3.5 bg-white rounded-lg last:mb-0"
                                          onClick={open}
                                        >
                                          <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0 items-center">
                                            <div className="font-semibold text-gray-500 font-lato">
                                              {moment(sub.CreateDate).format(
                                                "DD/MM/YYYY"
                                              )}
                                            </div>
                                            <div>
                                              <EllipsisVerticalIcon className="w-6 text-primary" />
                                            </div>
                                          </div>
                                          <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0 items-center">
                                            <div className="text-gray-500">
                                              Người nhập
                                            </div>
                                            <div className="font-medium">
                                              {sub?.UserFullName || ""}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </PickerSheet>
                                  ))}
                              </div>
                            ))}
                          </>
                        )}
                        {(!Lists || Lists.length) === 0 && (
                          <NoFound
                            Title="Không có kết quả nào."
                            Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                          />
                        )}
                      </>
                    )}
                  </div>
                </InfiniteScroll>
              </div>
              {!isCustomer && (
                <div className="p-4">
                  <PickerAddEditCustomerInfo MemberID={memberid}>
                    {({ open }) => (
                      <Button
                        onClick={open}
                        type="button"
                        className="rounded-full bg-app"
                        fill
                        large
                        preloader
                        loading={CustomerInfoQuery.isLoading}
                        disabled={CustomerInfoQuery.isLoading}
                      >
                        Thêm mới thông tin
                      </Button>
                    )}
                  </PickerAddEditCustomerInfo>
                </div>
              )}
            </div>
          </Tab>
        )}
      </Tabs>
    </Page>
  );
}

export default TechniciansProfile;

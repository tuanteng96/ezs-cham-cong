import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import { useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import moment from "moment";
import clsx from "clsx";
import { PickerFilterClientBook } from "./components";

function PosClientBooks({ f7router, f7route }) {
  let client = f7route?.query?.client
    ? JSON.parse(f7route?.query?.client)
    : null;
  let Auth = useStore("Auth");

  const [idRef, setIdRef] = useState(0);
  let [filters, setFilters] = useState({
    From: moment().subtract(15, "days").toDate(),
    To: moment().add(15, "days").toDate(),
  });

  const scrollRef = useRef("");

  const ClientBooks = useQuery({
    queryKey: ["ClientBooksCareID", { ID: f7route?.params?.id, filters }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientBooksId({
        MemberID: f7route?.params?.id,
        Token: Auth?.token,
        StockID: "",
        From: moment(filters.From).format("YYYY-MM-DD"),
        To: moment(filters.To).format("YYYY-MM-DD"),
      });
      return data?.books
        ? data?.books
            .map((x) => ({
              ...x,
              isToday: moment().diff(x.BookDate, "days") === 0,
            }))
            .sort((left, right) =>
              moment.utc(right["BookDate"]).diff(moment.utc(left["BookDate"]))
            )
        : null;
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  useEffect(() => {
    if (ClientBooks?.data) {
      let index = ClientBooks?.data.findIndex((x) => x.isToday);
      if (index > -1) {
        setIdRef(ClientBooks?.data[index].ID);
      }
    }
  }, [ClientBooks?.data]);

  useEffect(() => {
    if (scrollRef?.current?.el) {
      scrollRef?.current?.el?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [scrollRef]);

  const getStatusClass = (Status, item) => {
    const isAuto =
      item?.Desc && item.Desc.toUpperCase().indexOf("TỰ ĐỘNG ĐẶT LỊCH");

    if (Status === "XAC_NHAN") {
      if (isAuto !== "" && isAuto > -1)
        return {
          Color: "primary-2",
          Text: "Xác nhận",
        };
      return {
        Color: "primary",
        Text: "Xác nhận",
      };
    }
    if (Status === "CHUA_XAC_NHAN") {
      return {
        Color: "warning",
        Text: "Chưa xác nhận",
      };
    }
    if (Status === "KHACH_KHONG_DEN") {
      return {
        Color: "danger",
        Text: "Khách không đến",
      };
    }
    if (Status === "KHACH_DEN") {
      return {
        Color: "info",
        Text: "Khách đến",
      };
    }
    if (Status === "TU_CHOI") {
      return {
        Color: "danger",
        Text: "Khách huỷ lịch",
      };
    }
    if (Status === "doing") {
      return {
        Color: "success",
        Text: "Đang thực hiện",
      };
    }
    if (Status === "done") {
      return {
        Color: "secondary",
        Text: "Hoàn thành",
      };
    }
    return {
      Color: "warning",
      Text: "Chưa xác định",
    };
  };

  return (
    <Page
      className="bg-white"
      name="Pos-client-books"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => ClientBooks.refetch().then(() => done())}
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
        <NavTitle>Quản lý đặt lịch</NavTitle>
        <NavRight className="h-full">
          <Link
            popoverOpen=".popover-client-book"
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <EllipsisVerticalIcon className="w-6" />
          </Link>

          <Popover className="popover-client-book w-[170px]">
            <div className="flex flex-col py-1.5">
              <Link
                className="relative px-4 py-3 border-b"
                noLinkClass
                href={
                  `/admin/pos/calendar/add/?client=` +
                  encodeURIComponent(JSON.stringify(client || null)) +
                  "&prevState=" +
                  JSON.stringify({ invalidateQueries: ["ClientBooksCareID"] })
                }
                popoverClose
              >
                <span>Tạo mới đặt lịch</span>
              </Link>
              <PickerFilterClientBook
                initialValues={filters}
                onChange={(val) => setFilters(val)}
              >
                {({ open }) => (
                  <Link
                    className="relative px-4 py-3"
                    noLinkClass
                    popoverClose
                    onClick={open}
                  >
                    <span>Bộ lọc</span>
                  </Link>
                )}
              </PickerFilterClientBook>
            </div>
          </Popover>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {ClientBooks?.isLoading && (
        <>
          {Array(3)
            .fill()
            .map((_, index) => (
              <div
                className="flex flex-col p-4 border-b border-dashed"
                key={index}
              >
                <div className="h-3.5 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-7/12 mb-1"></div>
                <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-7/12 mb-1"></div>
                <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-9/12"></div>
              </div>
            ))}
        </>
      )}
      {!ClientBooks?.isLoading && (
        <>
          {ClientBooks?.data && ClientBooks?.data?.length > 0 && (
            <div>
              {ClientBooks?.data.map((item, index) => (
                <Link
                  noLinkClass
                  className={clsx(
                    "flex p-4 border-b border-dashed last:border-b-0",
                    item?.isToday && "bg-success-light"
                  )}
                  href={
                    "/admin/pos/calendar/add/?formState=" +
                    encodeURIComponent(
                      JSON.stringify({
                        ...item,
                        Member: {
                          FullName: item?.Member?.FullName,
                          MobilePhone: item.Member?.MobilePhone,
                          ID: item.Member?.ID,
                        },
                        Roots: item.Roots
                          ? item.Roots.map((x) => ({
                              Title: x.Title,
                              ID: x.ID,
                            }))
                          : [],
                      })
                    ) +
                    "&prevState=" +
                    JSON.stringify({ invalidateQueries: ["ClientBooksCareID"] })
                  }
                  key={index}
                  ref={idRef === item.ID ? scrollRef : null}
                >
                  <div className="flex-1">
                    <div className="mb-1 text-base font-medium text-primary">
                      {item?.RootTitles || "Chưa chọn dịch vụ"}
                    </div>
                    <div className="mb-1 text-sm text-gray-700">
                      Thời gian
                      <span className="pl-1 font-medium text-danger">
                        {moment(item.BookDate).format("HH:mm DD-MM-YYYY")}
                      </span>
                    </div>
                    <div className="mb-1 text-sm text-gray-700">
                      Trạng thái
                      <span
                        className={clsx(
                          "pl-1 font-medium",
                          "text-" + getStatusClass(item.Status, item).Color
                        )}
                      >
                        {getStatusClass(item.Status, item).Text}
                      </span>
                    </div>
                    <div className="mb-1 text-sm text-gray-700">
                      Tại cơ sở
                      <span className="pl-1 font-medium text-black">
                        {item?.Stock?.Title || "Chưa chọn"}
                      </span>
                    </div>
                    <div className="mb-1 text-sm text-gray-700">
                      Nhân viên thực hiện
                      <span className="pl-1 font-medium text-black">
                        {item.UserServices && item.UserServices.length > 0
                          ? item.UserServices?.map((x) => x.FullName).join(", ")
                          : "Chưa chọn"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700">
                      Tạo bởi {item.UserName} lúc
                      <span className="pl-1">
                        {moment(item.CreateDate).format("HH:mm DD-MM-YYYY")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end w-7">
                    <ChevronRightIcon className="w-6 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          {(!ClientBooks?.data || ClientBooks?.data.length === 0) && (
            <NoFound
              Title="Không có kết quả nào."
              Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
            />
          )}
        </>
      )}
    </Page>
  );
}

export default PosClientBooks;

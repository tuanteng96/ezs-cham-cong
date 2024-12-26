import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
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
import React, { useEffect, useRef, useState } from "react";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import { useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import moment from "moment";
import clsx from "clsx";

function PosClientBooks({ f7router, f7route }) {
  let client = f7route?.query?.client
    ? JSON.parse(f7route?.query?.client)
    : null;
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const [idRef, setIdRef] = useState(0);

  const scrollRef = useRef("");

  const ClientBooks = useQuery({
    queryKey: ["ClientBooksCareID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientBooksId({
        MemberID: f7route?.params?.id,
        Token: Auth?.token,
        StockID: "",
        From: moment().subtract(15, "days").format("YYYY-MM-DD"),
        To: moment().add(15, "days").format("YYYY-MM-DD"),
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
            href={
              `/admin/pos/calendar/add/?client=` +
              JSON.stringify(client || null) +
              "&prevState=" +
              JSON.stringify({ invalidateQueries: ["ClientBooksCareID"] })
            }
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <PlusIcon className="w-6" />
          </Link>
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
                    }) +
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

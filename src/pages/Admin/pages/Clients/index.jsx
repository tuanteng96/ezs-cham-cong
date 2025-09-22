import {
  Input,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  Subnavbar,
  useStore,
} from "framework7-react";
import React, { useRef, useState } from "react";
import {
  ArrowRightIcon,
  CakeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import { useInfiniteQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import NoFound from "@/components/NoFound";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import clsx from "clsx";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import moment from "moment";
import { useDebounce } from "@/hooks";

function ClientsAdmin({ f7router }) {
  const allowInfinite = useRef(true);
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  let ClientBirthDayCount = useStore("ClientBirthDayCount");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const [filters, setFilters] = useState({
    Key: "",
    pi: 1,
    ps: 12,
  });

  let keyDebounce = useDebounce(filters.Key, 400);

  const ClientsQuery = useInfiniteQuery({
    queryKey: ["ClientsList", keyDebounce],
    queryFn: async ({ pageParam = 1 }) => {
      let isAdmin = false;

      if (Auth?.ID === 1 || Auth?.Info?.Groups?.some((x) => x.ID === 1))
        isAdmin = true;

      let StockID = CrStocks?.ID;
      let CrStockID = "";

      if (Brand?.Global?.Admin?.cho_phep_tim_khac_diem) {
        StockID = "";
        if (Brand?.Global?.Admin?.tim_kiem_khac_diem_chinh_xac) {
          CrStockID = CrStocks?.ID;
        }
      } else {
        isAdmin = true;
      }

      const { data } = await AdminAPI.listClients({
        ...filters,
        pi: pageParam,
        ps: 12,
        Token: Auth.token,
        StockID,
        CrStockID,
        isAdmin,
      });

      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
    keepPreviousData: true,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    ClientsQuery?.data?.pages,
    "data"
  );

  window.SearchMembers = Lists;

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;
    ClientsQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      className="bg-white"
      name="ClientAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => ClientsQuery.refetch().then(() => done())}
      infinite={adminTools_byStock?.hasRight}
      infiniteDistance={50}
      infinitePreloader={ClientsQuery.isFetchingNextPage}
      onInfinite={loadMore}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavTitle>
          Khách hàng
          {ClientsQuery?.data?.pages &&
            ClientsQuery?.data?.pages[0].total > 0 && (
              <span className="pl-1">
                ({ClientsQuery?.data?.pages[0].total})
              </span>
            )}
        </NavTitle>

        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            href="/admin/pos/clients/birthday/"
          >
            <CakeIcon className="w-6" />
            {ClientBirthDayCount?.day > 0 && (
              <span className="absolute text-white bg-danger text-[10px] px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center top-1.5 right-1.5">
                {ClientBirthDayCount?.day}
              </span>
            )}
          </Link>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>

        <Subnavbar className="[&>div]:px-0 shadow-lg">
          <div className="flex w-full">
            <div className="relative flex-1">
              <Input
                className="[&_input]:border-0 [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14 [&_input]:pr-10 [&_input]:shadow-none"
                type="text"
                placeholder="Tìm theo tên, số điện thoại ..."
                value={filters.Key}
                clearButton={true}
                onInput={(e) => {
                  setFilters((prevState) => ({
                    ...prevState,
                    Key: e.target.value,
                  }));
                }}
              />
              <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
                <MagnifyingGlassIcon className="w-6 text-[#cccccc]" />
              </div>
            </div>
          </div>
        </Subnavbar>
      </Navbar>

      <div>
        {ClientsQuery.isLoading && (
          <>
            {Array(4)
              .fill()
              .map((_, index) => (
                <div
                  className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
                  key={index}
                >
                  <div className="w-11">
                    <div className="w-11 h-11 bg-gray-100 text-[#bababe] rounded-full flex items-center justify-center animate-pulse"></div>
                  </div>
                  <div className="flex-1 pl-4 pr-4">
                    <div className="flex mb-1 font-medium">
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-10/12 mb-1"></div>
                    </div>
                    <div className="flex items-center font-light text-gray-500 text-[14px] mb-1">
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                    </div>
                  </div>
                  <div className="flex justify-end w-10 gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg animate-pulse bg-primary-light text-primary"></div>
                  </div>
                </div>
              ))}
          </>
        )}
        {!ClientsQuery.isLoading && (
          <>
            {Lists && Lists.length > 0 && (
              <>
                {Lists.map((item, index) => (
                  <Link
                    noLinkClass
                    href={`/admin/pos/manage/${item.ID}/?state=${JSON.stringify(
                      {
                        MobilePhone: item.MobilePhone,
                        FullName: item.FullName,
                      }
                    )}`}
                    className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
                    key={index}
                  >
                    <div className="w-11">
                      <img
                        className="object-cover w-full rounded-full aspect-square"
                        src={
                          !item?.Photo
                            ? AssetsHelpers.toAbsoluteUrlCore(
                                "/AppCore/images/blank.png",
                                ""
                              )
                            : AssetsHelpers.toAbsoluteUrl(item?.Photo)
                        }
                        onError={(e) =>
                          (e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                            "/AppCore/images/blank.png",
                            ""
                          ))
                        }
                      />
                    </div>
                    <div className="flex-1 pl-4 pr-4">
                      <div className="flex mb-px font-medium">
                        <div
                          className={clsx(
                            "truncate",
                            item?.Source &&
                              (item?.Source.toUpperCase().includes("WEB") ||
                                item?.Source.toUpperCase().includes("APP"))
                              ? "max-w-[145px]"
                              : "max-w-[190px]",
                            item.GroupJSON &&
                              item.GroupJSON.length > 0 &&
                              item.GroupJSON[0].Color
                              ? ""
                              : "!text-black"
                          )}
                          style={{
                            color:
                              item.GroupJSON &&
                              item.GroupJSON.length > 0 &&
                              item.GroupJSON[0].Color,
                          }}
                        >
                          {item.FullName}
                        </div>
                        {item?.Source &&
                          (item?.Source.toUpperCase().includes("WEB") ||
                            item?.Source.toUpperCase().includes("APP")) && (
                            <div className="pl-1 font-normal text-gray-700 max-w-[80px] truncate">
                              ({item?.Source})
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-gray-500 font-lato">
                          {item.MobilePhone}
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="text-gray-500 font-lato">
                          {moment().year() === moment(item?.CreateDate).year()
                            ? moment(item?.CreateDate).format("DD-MM")
                            : moment(item?.CreateDate).format("DD-MM-YYYY")}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end w-10 gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary">
                        <ArrowRightIcon className="w-5" />
                      </div>
                    </div>
                  </Link>
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
    </Page>
  );
}

export default ClientsAdmin;

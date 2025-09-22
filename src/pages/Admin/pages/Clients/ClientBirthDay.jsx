import React, { useEffect, useState } from "react";
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
import PromHelpers from "@/helpers/PromHelpers";
import {
  AdjustmentsVerticalIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import NoFound from "@/components/NoFound";
import { useQuery, useQueryClient } from "react-query";
import clsx from "clsx";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";

function ClientBirthDay({ f7route }) {
  const [isToday, setIsToday] = useState(true);
  const [data, setData] = useState([]);

  const queryClient = useQueryClient();

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  useEffect(() => {
    if (f7route?.query?.mon) setIsToday(false);
  }, [f7route.query]);

  let { isLoading } = useQuery({
    queryKey: ["ClientBirthDay", { ID: Auth?.ID, StockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data } = await AdminAPI.ClientBirthDay({
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      });
      return data?.data || [];
    },
    onSuccess: (rs) => setData(rs),
  });

  return (
    <Page
      className="bg-white"
      name="ClientBirthDay"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={async (done) => {
        await queryClient.invalidateQueries(["ClientBirthDayCount"]);
        let { data } = await AdminAPI.ClientBirthDay({
          Token: Auth?.token,
          StockID: CrStocks?.ID,
          force: true,
        });
        setData(data?.data || []);
        done();
      }}
      noToolbar
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
        <NavTitle>
          {isToday ? "Sinh nhật hôm nay" : "Sinh nhật tháng"}
          {data && data.length > 0 && (
            <span className="pl-1">
              (
              {
                data.filter((x) =>
                  isToday
                    ? moment(x.BirthDate, "YYYY-MM-DD").format("DD-MM") ===
                      moment().format("DD-MM")
                    : true
                ).length
              }
              )
            </span>
          )}
        </NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            popoverOpen=".popover-filter-birth"
          >
            <AdjustmentsVerticalIcon className="w-6" />
          </Link>
        </NavRight>

        <Popover className="popover-filter-birth w-[210px]">
          <div className="flex flex-col py-1">
            <Link
              className={clsx(
                "relative px-4 py-3 font-medium border-b last:border-0",
                isToday && "text-app"
              )}
              popoverClose
              noLinkClass
              onClick={() => setIsToday(true)}
            >
              Sinh nhật hôm nay
              {data &&
                data.filter(
                  (x) =>
                    moment(x.BirthDate, "YYYY-MM-DD").format("DD-MM") ===
                    moment().format("DD-MM")
                ).length > 0 && (
                  <span className="pl-1">
                    (
                    {
                      data.filter(
                        (x) =>
                          moment(x.BirthDate, "YYYY-MM-DD").format("DD-MM") ===
                          moment().format("DD-MM")
                      ).length
                    }
                    )
                  </span>
                )}
            </Link>
            <Link
              className={clsx(
                "relative px-4 py-3 font-medium border-b last:border-0",
                !isToday && "text-app"
              )}
              popoverClose
              noLinkClass
              onClick={() => setIsToday(false)}
            >
              Sinh nhật tháng
              {data && data.length > 0 && (
                <span className="pl-1">({data.length})</span>
              )}
            </Link>
          </div>
        </Popover>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div>
        {isLoading && (
          <>
            {Array(4)
              .fill()
              .map((_, index) => (
                <Link
                  key={index}
                  className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
                >
                  <div className="relative w-11">
                    <img
                      className="object-cover w-full rounded-full aspect-square"
                      src={AssetsHelpers.toAbsoluteUrlCore(
                        "/AppCore/images/blank.png",
                        ""
                      )}
                    />
                    <div className="animate-pulse absolute top-0 flex items-center justify-center w-6 h-6 text-xs font-bold text-white border-white border-[2px] rounded-full -left-3 font-lato bg-danger"></div>
                  </div>
                  <div className="flex-1 pl-4 pr-4">
                    <div className="flex mb-1.5 font-medium">
                      <div className="max-w-[180px] truncate w-full">
                        <div className="animate-pulse h-3.5 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center text-gray-500 font-lato">
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-2/4" />
                    </div>
                  </div>
                  <div className="flex justify-end w-10 gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg animate-pulse bg-primary-light text-primary">
                      <ArrowRightIcon className="w-5" />
                    </div>
                  </div>
                </Link>
              ))}
          </>
        )}

        {!isLoading && (
          <>
            {data &&
              data
                .filter((x) =>
                  isToday
                    ? moment(x.BirthDate, "YYYY-MM-DD").format("DD-MM") ===
                      moment().format("DD-MM")
                    : true
                )
                .map((x) => ({
                  ...x,
                  BirthSort: moment(x.BirthDate, "YYYY-MM-DD")
                    .set({
                      year: moment().format("YYYY"),
                    })
                    .toDate(),
                }))
                .sort((a, b) =>
                  moment.utc(b.BirthSort).diff(moment.utc(a.BirthSort))
                )
                .map((item, index) => (
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
                    <div className="relative w-11">
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
                      <div className="absolute top-0 flex items-center justify-center w-6 h-6 text-xs font-bold text-white border-white border-[2px] rounded-full -left-3 font-lato bg-danger">
                        {moment(item.BirthDate).format("DD")}
                      </div>
                    </div>
                    <div className="flex-1 pl-4 pr-4">
                      <div className="flex mb-px font-medium">
                        <div
                          className={clsx(
                            "max-w-[180px] truncate",
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
                      </div>
                      <div className="flex items-center text-gray-500 font-lato">
                        {item.MobilePhone}
                      </div>
                    </div>
                    <div className="flex justify-end w-10 gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary">
                        <ArrowRightIcon className="w-5" />
                      </div>
                    </div>
                  </Link>
                ))}
            {(!data ||
              (isToday
                ? data.filter((x) =>
                    isToday
                      ? moment(x.BirthDate, "YYYY-MM-DD").format("DD-MM") ===
                        moment().format("DD-MM")
                      : true
                  ).length === 0
                : data.length === 0)) && (
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

export default ClientBirthDay;

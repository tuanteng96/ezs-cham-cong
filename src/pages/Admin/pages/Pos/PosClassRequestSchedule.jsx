import AdminAPI from "@/api/Admin.api";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import {
  AdjustmentsVerticalIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import moment from "moment";
import React, { useRef, useState } from "react";
import { useInfiniteQuery, useMutation } from "react-query";
import { toast } from "react-toastify";
import { PickerClassRequestFilter } from "./components";
import ArrayHelpers from "@/helpers/ArrayHelpers";

function PosClassRequestSchedule({ f7router, f7route }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const allowInfinite = useRef(true);

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const [filters, setFilters] = useState({
    ClassIDs: null,
    TeachIDs: null,
    StockID: CrStocks
      ? {
          label: CrStocks?.Title,
          value: CrStocks?.ID,
        }
      : null,
    DateStart: null,
    DateEnd: null,
    BeginFrom: new Date(),
    BeginTo: new Date(),
    Status: "",
    WorkingTime: "",
    UserRequest: "1",
  });

  const { data, refetch, isLoading, fetchNextPage } = useInfiniteQuery({
    queryKey: ["PosClassRequestSchedule", filters],
    queryFn: async ({ pageParam = 1 }) => {
      let result = await AdminAPI.getClassListSchedule({
        data: {
          ...filters,
          StockID: filters?.StockID
            ? [filters?.StockID?.value]
            : adminTools_byStock?.StockRoles?.map((x) => x.value),
          ClassIDs: filters.ClassIDs ? [filters.ClassIDs?.value] : [],
          TeachIDs: filters.TeachIDs ? [filters.TeachIDs?.value] : [],
          DateStart: null,
          DateEnd: null,
          BeginFrom: moment(filters.BeginFrom)
            .set({
              hour: "00",
              minute: "00",
              second: "00",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          BeginTo: moment(filters.BeginTo)
            .set({
              hour: "23",
              minute: "59",
              second: "59",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          Status: filters?.Status ? filters?.Status?.value : "",
          WorkingTime: filters?.WorkingTime ? filters?.WorkingTime?.value : "",
          Pi: pageParam,
          Ps: 20,
        },
        Token: Auth?.token,
      });

      let rs = await AdminAPI.getClassListSchedule({
        data: {
          StockID: filters?.StockID
            ? [filters?.StockID?.value]
            : adminTools_byStock?.StockRoles?.map((x) => x.value),
          ClassIDs: [],
          TeachIDs: [],
          DateStart: null,
          DateEnd: null,
          BeginFrom: moment(filters.BeginFrom)
            .set({
              hour: "00",
              minute: "00",
              second: "00",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          BeginTo: moment(filters.BeginTo)
            .set({
              hour: "23",
              minute: "59",
              second: "59",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          Status: "",
          WorkingTime: "",
          Pi: 1,
          Ps: 1000,
        },
        Token: Auth?.token,
      });

      let data = result?.data || null;
      let Items = rs?.data?.Items || [];

      let res = {
        ...data,
        Items:
          data.Items && data.Items.length > 0
            ? data.Items.map((item) => {
                let obj = { ...item };
                let index =
                  Items &&
                  Items.findIndex(
                    (x) =>
                      item.Member?.UserRequest?.ID === x.TeacherID &&
                      moment(x.TimeBegin, "YYYY-MM-DD HH:mm").format(
                        "DD-MM-YYYY HH:mm"
                      ) ===
                        moment(item.TimeBegin, "YYYY-MM-DD HH:mm").format(
                          "DD-MM-YYYY HH:mm"
                        )
                  );
                if (index > -1) {
                  obj.AlreadyScheduled = Items[index];
                }
                return obj;
              })
            : [],
      };
      return res;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.Pi === lastPage.PCount ? undefined : lastPage.Pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(data?.pages, "Items");

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.addEditClassSchedule(body);
      await refetch();
      return rs;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ data, update, Token }) => {
      let rs = await AdminAPI.deleteClassSchedule({
        data: data,
        Token,
      });
      await AdminAPI.updateOsClassSchedule({
        data: update,
        Token,
      });
      await refetch();
      return rs;
    },
  });

  const onConfirm = (rowData) => {
    f7.dialog.confirm(
      `Bạn có chắc chắn xác nhận huấn luyện viên ${
        rowData?.Member?.UserRequest?.FullName
      } cho lớp ${rowData?.Class?.Title} lúc ${moment(rowData.TimeBegin).format(
        "HH:mm DD-MM-YYYY"
      )} ?`,
      async () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let rs = await AdminAPI.getClassListSchedule({
          StockID: filters?.StockID
            ? [filters?.StockID]
            : adminTools_byStock?.StockRoles?.map((x) => x.value),
          ClassIDs: [],
          TeachIDs: [],
          DateStart: null,
          DateEnd: null,
          BeginFrom: moment(rowData.TimeBegin)
            .set({
              hour: "00",
              minute: "00",
              second: "00",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          BeginTo: moment(rowData.TimeBegin)
            .set({
              hour: "23",
              minute: "59",
              second: "59",
            })
            .format("YYYY-MM-DD HH:mm:ss"),
          Status: "",
          WorkingTime: "",
          Pi: 1,
          Ps: 1000,
        });

        let Items = rs?.data?.Items || [];

        let index =
          Items &&
          Items.findIndex(
            (x) =>
              moment(x.TimeBegin).format("HH:mm DD-MM-YYYY") ===
                moment(rowData.TimeBegin).format("HH:mm DD-MM-YYYY") &&
              rowData?.Member?.UserRequest?.ID === x.TeacherID
          );

        if (index === -1) {
          let Members = {
            ...rowData?.Member,
            HistoryCoachs: [
              ...(rowData?.Member?.HistoryCoachs || []),
              {
                CreateDate: moment().format("YYYY-MM-DD HH:mm"),
                Staff: {
                  StaffID: Auth?.ID,
                  ID: Auth?.ID,
                  FullName: Auth?.FullName,
                },
                Coach: {
                  ID: rowData?.Member?.UserRequest?.ID,
                  FullName: rowData?.Member?.UserRequest?.FullName,
                },
              },
            ],
          };
          Members.UserRequestConfirm = rowData?.Member?.UserRequest;
          delete Members.UserRequest;
          let values = {
            ID: rowData?.ID,
            CreateDate: moment(rowData.CreateDate, "YYYY-MM-DD HH:mm").format(
              "YYYY-MM-DD HH:mm"
            ),
            StockID: rowData?.StockID,
            TimeBegin: moment(rowData.TimeBegin).format("YYYY-MM-DD HH:mm:ss"),
            OrderServiceClassID: rowData?.OrderServiceClassID,
            TeacherID: rowData?.Member?.UserRequest?.ID,
            Member: Members,
            MemberID: "",
            Desc: "",
          };

          await updateMutation.mutateAsync({
            data: {
              arr: [values],
            },
            Token: Auth?.token,
          });
          f7.dialog.close();
        } else {
          f7.dialog.close();
          f7.dialog.alert(
            `Huấn luyện viên ${
              result.value?.rowData?.Member?.UserRequest?.FullName
            } đã bận vào lúc ${moment(result.value?.rowData?.TimeBegin).format(
              "HH:mm DD-MM-YYYY"
            )}.`
          );
        }
      }
    );
  };

  const onDelete = (rowData) => {
    f7.dialog.confirm(
      `Bạn có chắc chắn muốn huỷ lịch lớp ${rowData?.Class?.Title} lúc ${moment(
        rowData.TimeBegin
      ).format("HH:mm DD-MM-YYYY")} ?`,
      async () => {
        deleteMutation.mutate(
          {
            data: {
              delete: [rowData?.ID],
            },
            update: {
              arr: [
                {
                  ID: rowData?.Os?.ID,
                  Desc: "",
                  UserID: 0,
                },
              ],
            },
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success("Thực hiện thành công.");
            },
          }
        );
      }
    );
  };

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      className="bg-white"
      name="Pos-class-reuquest-schedule"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={isLoading}
      onInfinite={loadMore}
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
          <div>
            Yêu cầu giáo viên (
            {data?.pages && data?.pages.length > 0 ? data?.pages[0].Total : 0})
          </div>
          <div className="font-lato text-[12px] tracking-[1px] opacity-90">
            {moment(filters.BeginFrom).format("DD/MM/YYYY")}
            <span className="px-1">-</span>
            {moment(filters.BeginTo).format("DD/MM/YYYY")}
          </div>
        </NavTitle>
        <NavRight className="h-full">
          <PickerClassRequestFilter
            filters={filters}
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                ...val,
              }));
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
          </PickerClassRequestFilter>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>

      <div className="pb-safe-b">
        <div className="p-4">
          {isLoading && (
            <>
              {Array(2)
                .fill()
                .map((_, index) => (
                  <div className="mb-4 border rounded last:mb-0" key={index}>
                    <div className="flex justify-between px-4 py-4 font-medium bg-gray-100 border-b">
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between px-4 py-4 font-medium border-b">
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between px-4 py-4 font-medium border-b">
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!isLoading && (
            <>
              {Lists && Lists.length > 0 && (
                <>
                  {Lists.map((item, index) => (
                    <div
                      className="mb-3.5 last:mb-0 border shadow rounded overflow-hidden"
                      key={index}
                    >
                      <div className="px-4 py-2.5 bg-gray-50">
                        <div className="font-semibold text-[15px] text-primary">
                          {item?.Class?.Title}
                        </div>
                        <div className="mt-1 font-medium leading-4 text-gray-700 font-lato">
                          Ngày {moment(item.TimeBegin).format("DD-MM-YYYY")}
                          <span className="pl-1">
                            ({moment(item.TimeBegin).format("HH:mm")}
                            <span className="px-1">-</span>
                            {moment(item.TimeBegin)
                              .add(item.Class.Minutes, "minutes")
                              .format("HH:mm")}
                            )
                          </span>
                        </div>
                      </div>
                      <div className="border-t">
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[90px]">Cơ sở</div>
                          <div className="flex-1 text-right">
                            {item?.Stock?.Title}
                          </div>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                          <div className="text-gray-500 w-[90px]">
                            HVL Yêu cầu
                          </div>
                          <div className="flex-1 text-right">
                            {item?.Member?.UserRequest?.FullName}
                            {item?.AlreadyScheduled && (
                              <span className="pl-1 text-danger">(Đã bận)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 px-4 py-2.5 border-t">
                        <button
                          disabled={data.Member?.Status}
                          type="button"
                          className="h-8 text-white rounded bg-primary disabled:opacity-50"
                          onClick={() => {
                            onConfirm(item);
                          }}
                        >
                          Xác nhận
                        </button>
                        <button
                          disabled={data.Member?.Status}
                          type="button"
                          className="h-8 text-white rounded bg-danger disabled:opacity-50"
                          onClick={() => {
                            onDelete(item);
                          }}
                        >
                          Huỷ lịch
                        </button>
                      </div>
                    </div>
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
      </div>
    </Page>
  );
}

export default PosClassRequestSchedule;

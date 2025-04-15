import React, { useState } from "react";
import {
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  CheckIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import NoFound from "@/components/NoFound";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import clsx from "clsx";
import moment from "moment";
import ClassOsAPI from "@/api/ClassOs.api";
import { toast } from "react-toastify";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function OsClassView({ f7route }) {
  const queryClient = useQueryClient();

  let { params, query } = f7route;
  let prevState = query?.prevState ? JSON.parse(query?.prevState) : null;

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  let [initialValues, setInitialValues] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["OsClassView", params?.id],
    queryFn: async () => {
      let { data } = await ClassOsAPI.getListMembers({
        data: {
          ClassIDs: [prevState?.ClassID],
          TeachIDs: [Auth?.ID],
          DateStart: null,
          DateEnd: null,
          StockID: [prevState.StockID],
          BeginFrom: moment(prevState?.TimeBegin).format("YYYY-MM-DD HH:mm:ss"),
          BeginTo: moment(prevState?.TimeBegin)
            .add(prevState?.Minutes, "minute")
            .format("YYYY-MM-DD HH:mm:ss"),
          Pi: 1,
          Ps: 1,
        },
        Token: Auth?.token,
      });
      return data?.Items && data?.Items.length > 0 ? data?.Items[0] : null;
    },
    enabled: Boolean(params?.id && prevState),
    onSuccess: (data) => {
      setInitialValues({
        ID: data?.ID,
        CreateDate: moment(data.CreateDate, "YYYY-MM-DD HH:mm").format(
          "YYYY-MM-DD HH:mm"
        ),
        StockID: data?.StockID,
        TimeBegin: moment(data?.TimeBegin).format("YYYY-MM-DD HH:mm:ss"),
        OrderServiceClassID: data?.OrderServiceClassID,
        TeacherID: data?.TeacherID,
        Member: {
          ...data?.Member,
          Lists: data?.Member?.Lists ? data?.Member?.Lists : [],
        },
        MemberID: "",
        Desc: "",
      });
    },
  });

  const addEditMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await ClassOsAPI.addEditClassMember(body);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["OsMembers"] });
      return rs;
    },
  });

  const updateOsStatusMutation = useMutation({
    mutationFn: async ({ data, update, Token }) => {
      let rs = await ClassOsAPI.addEditClassMember({ data: data, Token });
      await ClassOsAPI.updateOsClassMember({ data: update, Token });
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["OsMembers"] });
      return rs;
    },
  });

  const updateStatus = ({ Status, rowData, rowIndex }) => {
    f7.dialog.confirm(
      `Xác nhận ${Status?.label} cho học viên ${rowData?.Member?.FullName}`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let newLists = [...initialValues.Member.Lists];
        newLists[rowIndex]["Status"] = Status.value;

        let newValues = {
          arr: [
            {
              ...initialValues,
              Member: {
                ...initialValues.Member,
                Lists: newLists,
              },
            },
          ],
        };

        let newObj = {
          ID: rowData?.Os?.ID,
          BookDate: Status.value ? moment().format("YYYY-MM-DD HH:mm") : null,
          Status: !Status.value ? "" : "done",
        };

        if (!Status.value) {
          newObj["UserID"] = 0;
        }

        updateOsStatusMutation.mutate(
          {
            data: newValues,
            update: {
              arr: [newObj],
            },
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success("Cập nhật thành công.");
            },
          }
        );
      }
    );
  };

  const onComplete = () => {
    f7.dialog.confirm(
      `Xác nhận ${
        !data?.Member?.Status ? "hoàn thành" : "huỷ hoàn thành"
      } cho lớp ${prevState?.ClassTitle} (${moment(prevState?.TimeBegin).format(
        "HH:mm"
      )}-${moment(prevState?.TimeBegin)
        .add(prevState?.Minutes, "minute")
        .format("HH:mm")})`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let newValues = {
          arr: [
            {
              ...initialValues,
              Member: {
                ...initialValues.Member,
                Status: initialValues.Member?.Status ? "" : "1",
              },
            },
          ],
        };

        addEditMutation.mutate(
          {
            data: newValues,
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success("Cập nhật thành công.");
            },
          }
        );
      }
    );
  };

  const onUpdateOverTime = (ck) => {
    f7.dialog.confirm(
      `Xác nhận ngoài giờ cho lớp ${prevState?.ClassTitle} (${moment(
        prevState?.TimeBegin
      ).format("HH:mm")}-${moment(prevState?.TimeBegin)
        .add(prevState?.Minutes, "minute")
        .format("HH:mm")})`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let newValues = {
          arr: [
            {
              ...initialValues,
              Member: {
                ...initialValues.Member,
                IsOverTime: ck,
              },
            },
          ],
        };

        addEditMutation.mutate(
          {
            data: newValues,
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success("Cập nhật thành công.");
            },
          }
        );
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="OsClassView"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
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
          <div className="text-base truncate">{prevState?.ClassTitle}</div>
          <div className="font-lato text-[13px] font-medium">
            {moment(prevState?.TimeBegin).format("DD/MM/YYYY")}
            <span className="pl-1">
              ({moment(prevState?.TimeBegin).format("HH:mm")} -{" "}
              {moment(prevState?.TimeBegin)
                .add(prevState?.Minutes, "minute")
                .format("HH:mm")}
              )
            </span>
            <span className="pl-1">
              ({(data?.Member?.Lists && data?.Member?.Lists.length) || 0}
              <span>/</span>
              {data?.Class?.MemberTotal || 0})
            </span>
          </div>
        </NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full">
        <div className="overflow-auto grow">
          {isLoading && (
            <div>
              {Array(5)
                .fill()
                .map((_, index) => (
                  <div className="flex border-b" key={index}>
                    <div className="flex-1 px-4 py-4 border-r">
                      <div className="text-[15px] font-semibold mb-1.5">
                        <div className="w-8/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-gray-500 font-lato">
                        <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-2/4"></div>
                      </div>
                    </div>
                    <div className="w-[100px] flex items-center justify-center">
                      <div className="flex items-center justify-center w-full">
                        <div className="relative w-6 h-6 text-white rounded shadow-lg bg-primary">
                          <CheckIcon className="absolute w-5 top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!isLoading && (
            <>
              {data?.Member?.Lists && data?.Member?.Lists.length > 0 && (
                <>
                  {data?.Member?.Lists.map((item, index) => (
                    <div className="flex border-b" key={index}>
                      <div className="flex-1 px-4 py-4 border-r">
                        <div className="text-[15px] font-semibold">
                          {item?.Member?.FullName}
                        </div>
                        <div className="text-gray-500 font-lato">
                          {Brand?.Global?.Admin?.hidePhoneMember ? (
                            <>
                              {item?.Member?.Phone
                                ? `${item?.Member?.Phone.slice(
                                    0,
                                    2
                                  )}${Array.from(
                                    { length: item?.Member?.Phone.length - 2 },
                                    (v, i) => "*"
                                  ).join("")}`
                                : ""}
                            </>
                          ) : (
                            item?.Member?.Phone
                          )}
                        </div>
                        {item?.Status && (
                          <div
                            className={clsx(
                              "mt-1",
                              item?.Status === "DIEM_DANH_DEN" &&
                                "text-success",
                              item?.Status === "DIEM_DANH_KHONG_DEN" &&
                                "text-danger"
                            )}
                          >
                            {item?.Status === "DIEM_DANH_DEN" && "Có mặt"}
                            {item?.Status === "DIEM_DANH_KHONG_DEN" &&
                              "Vắng mặt"}
                          </div>
                        )}
                      </div>
                      <div className="w-[130px] flex items-center justify-center">
                        {!item.Status && (
                          <>
                            <Link
                              popoverOpen={`.popover-${item?.Member?.ID}`}
                              noLinkClass
                              className="flex flex-col items-center justify-center"
                            >
                              <div className="px-2 py-1 text-white rounded bg-primary">
                                Điểm danh
                              </div>
                            </Link>

                            <Popover
                              className={clsx(
                                `popover-${item?.Member?.ID} w-[220px]`
                              )}
                            >
                              <div className="flex flex-col py-1">
                                {[
                                  {
                                    label: "Điểm danh đến",
                                    value: "DIEM_DANH_DEN",
                                  },
                                  {
                                    label: "Điểm danh không đến",
                                    value: "DIEM_DANH_KHONG_DEN",
                                  },
                                ].map((action, i) => (
                                  <Link
                                    key={i}
                                    className={clsx(
                                      "relative px-4 py-3 font-medium border-b last:border-0"
                                    )}
                                    popoverClose
                                    noLinkClass
                                    onClick={() =>
                                      updateStatus({
                                        Status: action,
                                        rowData: item,
                                        rowIndex: index,
                                      })
                                    }
                                  >
                                    {action.label}
                                  </Link>
                                ))}
                              </div>
                            </Popover>
                          </>
                        )}
                        {item.Status && (
                          <div className="flex items-center justify-center w-full">
                            <div
                              className={clsx(
                                "relative w-6 h-6 text-white rounded shadow-lg",
                                item.Status !== "DIEM_DANH_KHONG_DEN"
                                  ? "bg-primary"
                                  : "bg-danger"
                              )}
                              onClick={() => {
                                if (adminTools_byStock?.hasRight) {
                                  updateStatus({
                                    Status: {
                                      label: "Huỷ điểm danh",
                                      value: "",
                                    },
                                    rowData: item,
                                    rowIndex: index,
                                  });
                                }
                              }}
                            >
                              {item.Status === "DIEM_DANH_DEN" && (
                                <CheckIcon className="absolute w-5 top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4" />
                              )}
                              {item.Status === "DIEM_DANH_KHONG_DEN" && (
                                <XMarkIcon className="absolute w-5 top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {(!data?.Member?.Lists || data?.Member?.Lists.length === 0) && (
                <NoFound
                  Title="Chưa có học viên."
                  Desc="Rất tiếc ... Lớp chưa có học viên nào"
                />
              )}
            </>
          )}
        </div>
        {!data?.Member?.Status && (
          <div className="flex border-t pb-safe-b">
            <div className="flex items-center flex-1 pl-4">
              <div className="flex">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    onChange={(e) => {
                      onUpdateOverTime(e.target.checked);
                    }}
                    checked={data?.Member?.IsOverTime}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                </label>
                <div className="pl-2.5 text-gray-800 font-lato">Ngoài giờ</div>
              </div>
            </div>
            <button
              disabled={isLoading}
              className="h-12 px-5 font-medium text-white bg-success disabled:opacity-50 w-[200px]"
              type="button"
              onClick={() => {
                if (
                  !data.Member?.Status &&
                  (data?.Member?.Lists?.length === 0 ||
                    (data?.Member?.Lists &&
                      data?.Member?.Lists.some((x) => !x.Status)))
                ) {
                  toast.error(
                    "Không thể hoàn thành do có học viên chưa điểm danh.",
                    {
                      autoClose: 1500,
                    }
                  );
                } else {
                  onComplete();
                }
              }}
            >
              Hoàn thành
            </button>
          </div>
        )}

        {data?.Member?.Status && adminTools_byStock?.hasRight && (
          <div className="border-t pb-safe-b">
            <button
              disabled={isLoading}
              className="h-12 px-5 font-medium text-white bg-danger disabled:opacity-50"
              type="button"
              onClick={onComplete}
            >
              Huỷ hoàn thành
            </button>
          </div>
        )}
      </div>
    </Page>
  );
}

export default OsClassView;

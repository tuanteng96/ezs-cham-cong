import AdminAPI from "@/api/Admin.api";
import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Button,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import moment from "moment";
import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { PickerClassOsMemberAddEdit } from "./components";
import { SelectMembers } from "@/partials/forms/select";
import PullToRefresh from "react-simple-pull-to-refresh";
import ClassOsAPI from "@/api/ClassOs.api";

let StatusOptions = [
  {
    label: "Điểm danh đến",
    value: "DIEM_DANH_DEN",
    className: "success",
  },
  {
    label: "Điểm danh không đến",
    value: "DIEM_DANH_KHONG_DEN",
    className: "danger",
  },
];

function PosClassOsSchedule({ f7router, f7route }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  let StaffsRef = useRef(null);

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const queryClient = useQueryClient();

  let formState = f7route?.query?.formState
    ? JSON.parse(f7route?.query?.formState)
    : null;

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["PosClassOsSchedule", formState],
    queryFn: async () => {
      const rsListClass = await AdminAPI.getClassListSchedule({
        data: {
          ClassIDs: [f7route?.params?.ID],
          TeachIDs: [],
          StockID: formState?.Class?.StockID ? [formState?.Class?.StockID] : [],
          DateStart: null,
          DateEnd: null,
          BeginFrom: moment(formState.DateFrom, "HH:mm DD-MM-YYYY").format(
            "YYYY-MM-DD HH:mm:ss"
          ),
          BeginTo: moment(formState.DateFrom, "HH:mm DD-MM-YYYY").format(
            "YYYY-MM-DD HH:mm:ss"
          ),
          Pi: 1,
          Ps: 1000,
        },
        Token: Auth?.token,
      });

      let Items = rsListClass?.data?.Items;

      return Items && Items.length > 0 ? Items[0] : null;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.addEditClassSchedule(body);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["PosClassSchedule"] });
      return rs;
    },
  });

  const updateOsStatusMutation = useMutation({
    mutationFn: async ({ data, update, addPoint, deletePoint, Token }) => {
      let rs = await AdminAPI.addEditClassSchedule({
        data: data,
        Token,
      });
      await AdminAPI.updateOsClassSchedule({
        data: update,
        Token,
      });
      if (addPoint)
        await ClassOsAPI.addEditPointOsMember({ data: addPoint, Token });

      if (deletePoint)
        await ClassOsAPI.deletePointOsMember({ data: deletePoint, Token });

      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["PosClassSchedule"] });
      return rs;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.deleteClassSchedule(body);
      await queryClient.invalidateQueries({ queryKey: ["PosClassSchedule"] });
      return rs;
    },
  });

  const onAttendance = ({ rowIndex, Status, rowData }) => {
    f7.dialog.confirm(
      `Bạn có chắc chắn muốn ${Status.label} cho học viên <span>${rowData.Member.FullName}</span>.`,
      async () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let values = {
          ID: data?.ID,
          CreateDate: moment(data.CreateDate, "YYYY-MM-DD HH:mm").format(
            "YYYY-MM-DD HH:mm"
          ),
          StockID: data?.StockID,
          TimeBegin: data?.TimeBegin
            ? moment(data?.TimeBegin).format("YYYY-MM-DD HH:mm:ss")
            : null,
          OrderServiceClassID: data?.OrderServiceClassID,
          TeacherID: data?.TeacherID,
          Member: {
            ...data?.Member,
            IsOverTime: data?.Member?.IsOverTime || false,
            Lists: data?.Member?.Lists || [],
          },
          MemberID: "",
          Desc: "",
        };

        values.Member.Lists[rowIndex]["Status"] = Status.value;

        let newObj = {
          ID: rowData?.Os?.ID,
          BookDate: Status.value ? moment().format("YYYY-MM-DD HH:mm") : null,
          Status: !Status.value ? "" : "done",
        };

        if (!Status.value) {
          newObj["UserID"] = 0;
        }

        let addPoints = null;
        let deletePoints = null;

        if (Brand?.Global?.Admin?.lop_hoc_diem) {
          if (Status.value === "DIEM_DANH_DEN") {
            addPoints = {
              MemberID: rowData?.Member?.ID,
              Title: "Tích điểm khi đi tập",
              Desc: `Đi tập lớp ${data?.Class?.Title} lúc ${moment(
                data?.TimeBegin
              ).format("HH:mm DD/MM/YYYY")}.`,
              CreateDate: moment().format("YYYY-MM-DD HH:mm"),
              Point: Brand?.Global?.Admin?.lop_hoc_diem,
              StockID: data?.StockID,
              OrderServiceID: rowData?.Os?.ID,
            };
          } else if (rowData?.Status === "DIEM_DANH_DEN") {
            deletePoints = {
              MemberID: rowData?.Member?.ID,
              OrderServiceID: rowData?.Os?.ID,
            };
          }
        }

        updateOsStatusMutation.mutate(
          {
            data: {
              arr: [values],
            },
            update: {
              arr: [newObj],
            },
            addPoint: addPoints
              ? {
                  edit: [addPoints],
                }
              : null,
            deletePoint: deletePoints,
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

  const onDelete = ({ rowData }) => {
    f7.dialog.confirm(
      `Bạn có chắc chắn muốn xoá học viên <span>${rowData.Member.FullName}</span>.`,
      async () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let values = {
          ID: data?.ID,
          CreateDate: moment(data.CreateDate, "YYYY-MM-DD HH:mm").format(
            "YYYY-MM-DD HH:mm"
          ),
          StockID: data?.StockID,
          TimeBegin: data?.TimeBegin
            ? moment(data?.TimeBegin).format("YYYY-MM-DD HH:mm:ss")
            : null,
          OrderServiceClassID: data?.OrderServiceClassID,
          TeacherID: data?.TeacherID,
          Member: {
            ...data?.Member,
            IsOverTime: data?.Member?.IsOverTime || false,
            Lists: data?.Member?.Lists || [],
          },
          MemberID: "",
          Desc: "",
        };

        values.Member.Lists = values.Member.Lists.filter(
          (x) => x.Member.ID !== rowData?.Member?.ID
        );

        updateOsStatusMutation.mutate(
          {
            data: {
              arr: [values],
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

  const onUpdateStatus = () => {
    f7.dialog.confirm(
      `Bạn có chắc chắn muốn chuyển trạng thái thành <span>${
        data.Member?.Status ? "huỷ hoàn thành ?" : "hoàn thành"
      }</span>`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let values = {
          ID: data?.ID,
          CreateDate: moment(data.CreateDate, "YYYY-MM-DD HH:mm").format(
            "YYYY-MM-DD HH:mm"
          ),
          StockID: data?.StockID,
          TimeBegin: data?.TimeBegin
            ? moment(data?.TimeBegin).format("YYYY-MM-DD HH:mm:ss")
            : null,
          OrderServiceClassID: data?.OrderServiceClassID,
          TeacherID: data?.TeacherID,
          Member: {
            ...data?.Member,
            Lists: data?.Member?.Lists || [],
            Status: data.Member?.Status ? "" : "1",
          },
          MemberID: "",
          Desc: "",
        };

        updateMutation.mutate(
          {
            data: {
              arr: [values],
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

  const onDeleteClass = () => {
    if (
      data?.Member?.Lists &&
      data?.Member?.Lists.length > 0 &&
      data?.Member?.Lists.filter((x) => x.Member?.Status)
    ) {
      toast.error("Bạn không thể xoá lớp khi đã có học viên.");
    } else {
      f7.dialog.confirm(
        `Bạn có chắc chắn muốn xoá lớp <span>${data?.Class.Title} (${
          data?.TimeFrom
        }
                    <span class="px-px">-</span>
                    ${moment()
                      .set({
                        hour: moment(data?.TimeFrom, "HH:mm").get("hour"),
                        minute: moment(data?.TimeFrom, "HH:mm").get("minute"),
                        second: moment(data?.TimeFrom, "HH:mm").get("second"),
                      })
                      .add(data?.Class?.Minutes, "minutes")
                      .format("HH:mm")})</span>.`,
        async () => {
          f7.dialog.preloader("Đang thực hiện ...");
          await deleteMutation.mutateAsync({
            data: {
              delete: [data?.ID],
            },
            Token: Auth?.token,
          });

          f7.dialog.close();
          toast.success("Thực hiện thành công.");
          f7router.back();
        }
      );
    }
  };

  const onUpdateOverTime = () => {
    f7.dialog.confirm(
      `Xác nhận ${
        !data?.Member?.IsOverTime ? "ngoài giờ" : "huỷ ngoài giờ"
      } cho lớp ?`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let values = {
          ID: data?.ID,
          CreateDate: moment(data.CreateDate, "YYYY-MM-DD HH:mm").format(
            "YYYY-MM-DD HH:mm"
          ),
          StockID: data?.StockID,
          TimeBegin: data?.TimeBegin
            ? moment(data?.TimeBegin).format("YYYY-MM-DD HH:mm:ss")
            : null,
          OrderServiceClassID: data?.OrderServiceClassID,
          TeacherID: data?.TeacherID,
          Member: {
            ...data?.Member,
            Lists: data?.Member?.Lists || [],
            IsOverTime: data.Member?.IsOverTime ? false : true,
          },
          MemberID: "",
          Desc: "",
        };

        updateMutation.mutate(
          {
            data: {
              arr: [values],
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

  const onUpdateTeacher = (teacher) => {
    f7.dialog.confirm(
      `Cập nhập huấn luyện viên <span>${teacher?.label} cho lớp ${data?.Class?.Title}</span>`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let values = {
          ID: data?.ID,
          CreateDate: moment(data.CreateDate, "YYYY-MM-DD HH:mm").format(
            "YYYY-MM-DD HH:mm"
          ),
          StockID: data?.StockID,
          TimeBegin: data?.TimeBegin
            ? moment(data?.TimeBegin).format("YYYY-MM-DD HH:mm:ss")
            : null,
          OrderServiceClassID: data?.OrderServiceClassID,
          TeacherID: teacher?.value || null,
          Member: {
            ...data?.Member,
            HistoryCoachs: [
              ...(data?.Member?.HistoryCoachs || []),
              {
                CreateDate: moment().format("YYYY-MM-DD HH:mm"),
                Staff: {
                  StaffID: Auth?.ID,
                  ID: Auth?.ID,
                  FullName: Auth?.FullName,
                },
                Coach: teacher
                  ? {
                      ID: teacher?.value,
                      FullName: teacher?.label,
                    }
                  : null,
              },
            ],
          },
          MemberID: "",
          Desc: "",
        };

        updateMutation.mutate(
          {
            data: {
              arr: [values],
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

  const getStatus = (status) => {
    let index = StatusOptions.findIndex((x) => x.value === status);
    if (index > -1) return StatusOptions[index];
    return {
      label: "",
      className: "",
    };
  };

  return (
    <Page
      className="bg-white"
      name="Pos-class-os-schedule"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
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
          <div>{formState?.Class?.Title}</div>
          <div className="font-lato text-[12px] tracking-[1px] opacity-90">
            <span className="pr-1">
              ({moment(formState.DateFrom, "HH:mm DD-MM-YYYY").format("HH:mm")}
              <span className="px-1">-</span>
              {moment(formState.DateFrom, "HH:mm DD-MM-YYYY")
                .add(formState?.Class?.Minutes, "minutes")
                .format("HH:mm")}
              )
            </span>
            {moment(formState.DateFrom, "HH:mm DD-MM-YYYY").format(
              "DD-MM-YYYY"
            )}
          </div>
        </NavTitle>
        <NavRight className="h-full">
          <PickerClassOsMemberAddEdit
            initialValue={data}
            ProdIDs={data?.Class?.ProdIDs}
            DateFrom={data?.DateFrom}
          >
            {({ open }) => (
              <Link
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
                onClick={open}
              >
                <PlusIcon className="w-6" />
              </Link>
            )}
          </PickerClassOsMemberAddEdit>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>

      <div className="flex flex-col h-full pb-safe-b">
        <PullToRefresh
          className="overflow-auto grow ezs-ptr"
          onRefresh={refetch}
        >
          <div className="h-full p-4 overflow-auto">
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
                {data?.Member?.Lists && data?.Member?.Lists.length > 0 && (
                  <>
                    {data?.Member?.Lists.map((item, index) => (
                      <div
                        className="mb-3.5 last:mb-0 border shadow rounded overflow-hidden"
                        key={index}
                      >
                        <div className="px-4 py-2 bg-gray-50">
                          <div className="font-semibold text-[15px] text-primary">
                            {item?.Member?.FullName}
                          </div>
                          <div className="font-medium leading-4 text-gray-700 font-lato">
                            {item?.Member?.Phone}
                          </div>
                        </div>
                        <div className="border-t">
                          <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                            <div className="text-gray-500 w-[90px]">
                              ID học viên
                            </div>
                            <div className="font-lato font-medium text-[15px]">
                              {item?.Member?.ID}
                            </div>
                          </div>
                          <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                            <div className="text-gray-500 w-[90px]">
                              Dịch vụ thẻ
                            </div>
                            <div className="flex-1 text-right">
                              {item?.Os?.Title}
                            </div>
                          </div>
                          <div className="flex justify-between px-4 py-2.5 border-b border-dashed last:border-0">
                            <div className="text-gray-500 w-[90px]">
                              Trạng thái
                            </div>
                            <div>
                              {item?.Status ? (
                                <div
                                  className={clsx(
                                    "text-" + getStatus(item?.Status).className
                                  )}
                                >
                                  {getStatus(item?.Status).label}
                                </div>
                              ) : (
                                <>Chưa điểm danh</>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 px-4 py-2.5 border-t">
                          {item.Status ? (
                            <>
                              {item.Status !== "DA_HUY_LICH" ? (
                                <button
                                  disabled={data.Member?.Status}
                                  type="button"
                                  className="h-8 text-white rounded bg-danger disabled:opacity-50"
                                  onClick={() => {
                                    if (adminTools_byStock?.hasRight) {
                                      onAttendance({
                                        rowData: item,
                                        rowIndex: index,
                                        Status: {
                                          label: "Huỷ điểm danh",
                                          value: "",
                                        },
                                      });
                                    } else {
                                      toast.error(
                                        "Bạn không có quyền huỷ điểm danh."
                                      );
                                    }
                                  }}
                                >
                                  Huỷ điểm danh
                                </button>
                              ) : (
                                <button
                                  disabled={data.Member?.Status}
                                  type="button"
                                  className="h-8 text-white rounded bg-success disabled:opacity-50"
                                  onClick={() => {
                                    onAttendance({
                                      rowData: item,
                                      rowIndex: index,
                                      Status: {
                                        label: "Đặt lại lịch",
                                        value: "",
                                      },
                                    });
                                  }}
                                >
                                  Đặt lại lịch
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <Link
                                noLinkClass
                                popoverOpen={
                                  moment(data?.TimeBegin).isSameOrBefore(
                                    moment()
                                  )
                                    ? `.popover-class-os-${item.Member.ID}`
                                    : null
                                }
                                disabled={data.Member?.Status}
                                className={clsx(
                                  "flex items-center justify-center h-8 text-white rounded bg-success",
                                  moment().isSameOrBefore(
                                    moment(data?.TimeBegin)
                                  ) && "opacity-50"
                                )}
                              >
                                Điểm danh
                              </Link>
                              <Popover
                                className={`popover-class-os-${item.Member.ID} w-[200px]`}
                              >
                                <div className="flex flex-col py-2">
                                  {StatusOptions &&
                                    StatusOptions.map((otp, idx) => (
                                      <Link
                                        className={clsx(
                                          "relative px-4 py-2",
                                          "text-" + otp.className
                                        )}
                                        noLinkClass
                                        popoverClose
                                        key={idx}
                                        onClick={() => {
                                          onAttendance({
                                            rowData: item,
                                            rowIndex: index,
                                            Status: otp,
                                          });
                                        }}
                                      >
                                        <span>{otp?.label}</span>
                                      </Link>
                                    ))}
                                </div>
                              </Popover>
                            </>
                          )}
                          <button
                            disabled={item?.Status}
                            type="button"
                            className="h-8 text-white rounded bg-danger disabled:opacity-50"
                            onClick={() =>
                              onDelete({ rowIndex: index, rowData: item })
                            }
                          >
                            Huỷ lịch
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {(!data?.Member?.Lists || data?.Member?.Lists.length === 0) && (
                  <NoFound
                    Title="Không có kết quả nào."
                    Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                  />
                )}
              </>
            )}
          </div>
        </PullToRefresh>
        <div className="px-4 py-3.5 border-t">
          <div className="flex items-end justify-between mb-4">
            <div className="font-medium leading-3">HLV</div>
            <div
              className={clsx(
                "font-medium leading-3",
                data?.Teacher?.FullName ? "text-success" : "text-primary"
              )}
              onClick={() => {
                StaffsRef?.current?.click();
              }}
            >
              {data?.Teacher?.FullName ? (
                <>
                  <span className="flex items-end">
                    {data?.Teacher?.FullName}
                    <PencilSquareIcon className="w-5 ml-1.5" />
                  </span>
                </>
              ) : (
                "Chọn huấn luyện viên?"
              )}
            </div>
            <div className="hidden">
              <SelectMembers
                elRef={StaffsRef}
                placeholderInput="Tên huấn luyện viên"
                placeholder="Chọn huấn luyện viên"
                value={
                  data?.Teacher
                    ? {
                        label: data?.Teacher?.FullName,
                        value: data?.Teacher?.ID,
                      }
                    : null
                }
                label="Chọn huấn luyện viên"
                onChange={(val) => {
                  onUpdateTeacher(val);
                }}
                isFilter
                //isMulti
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              style={{ "--f7-preloader-color": "#000" }}
              popoverOpen=".popover-action-class-os"
              type="button"
              className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
              fill
              large
              preloader
              loading={isLoading}
              disabled={isLoading}
            >
              <EllipsisVerticalIcon className="w-6" />
            </Button>
            <Popover className="popover-action-class-os">
              <div className="flex flex-col py-1">
                <PickerClassOsMemberAddEdit
                  initialValue={data}
                  ProdIDs={data?.Class?.ProdIDs}
                  DateFrom={data?.DateFrom}
                >
                  {({ open }) => (
                    <Link
                      onClick={open}
                      popoverClose
                      className="flex justify-between p-3 font-medium border-b last:border-0"
                      noLinkClass
                    >
                      Thêm học viên
                    </Link>
                  )}
                </PickerClassOsMemberAddEdit>

                <Link
                  popoverClose
                  className="flex justify-between p-3 font-medium border-b last:border-0"
                  noLinkClass
                  onClick={onUpdateOverTime}
                >
                  Ngoài giờ
                  <div className="w-9 h-5 bg-[#EBEDF3] rounded-[30px] relative items-center">
                    <div
                      className={clsx(
                        "h-[15px] w-[15px] absolute shadow rounded-full top-2/4 -translate-y-2/4",
                        data?.Member?.IsOverTime
                          ? "right-1 bg-primary"
                          : "left-1 bg-white"
                      )}
                    ></div>
                  </div>
                </Link>
                <Link
                  popoverClose
                  className="flex justify-between p-3 font-medium border-b last:border-0 text-danger"
                  noLinkClass
                  onClick={onDeleteClass}
                >
                  Xoá lớp
                </Link>
              </div>
            </Popover>
            <Button
              onClick={() => {
                if (
                  !data?.Member?.Status &&
                  (data?.Member?.Lists?.length === 0 ||
                    (data?.Member?.Lists &&
                      data?.Member?.Lists.some((x) => !x.Status)))
                ) {
                  toast.error(
                    "Không thể hoàn thành do có học viên chưa điểm danh."
                  );
                  return;
                }
                if (!adminTools_byStock?.hasRight && data.Member?.Status) {
                  toast.error("Bạn không có quyền.");
                } else {
                  onUpdateStatus();
                }
              }}
              className={clsx(
                "flex-1 rounded",
                data?.Member?.Status ? "bg-danger" : "bg-primary"
              )}
              fill
              large
              preloader
              type="button"
              loading={isLoading}
              disabled={isLoading}
            >
              {data?.Member?.Status ? "Huỷ hoàn thành" : "Hoàn thành"}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default PosClassOsSchedule;

import PromHelpers from "@/helpers/PromHelpers";
import {
  ChevronLeftIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  PlusIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  PhotoBrowser,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { SelectMembersServices } from "@/partials/forms/select";
import { DatePicker, SelectPicker, SelectPickersGroup } from "@/partials/forms";
import { useMutation, useQuery, useQueryClient } from "react-query";
import ConfigsAPI from "@/api/Configs.api";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import clsx from "clsx";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import { NumericFormat } from "react-number-format";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { PickerServiceChange, PickerServiceOsInfo } from "./components";
import { UploadImages } from "@/partials/forms/files";

const AutoSalaryMethodOptions = [
  {
    value: "0",
    label: "Cùng cấp - chia đều, khác cấp - chia theo người cao nhất",
  },
  {
    value: "1",
    label: "Cùng cấp - chia đều, khác cấp - theo từng người",
  },
];

function EditOsCalendar({ f7route, f7router }) {
  const queryClient = useQueryClient();

  const Stocks = useStore("Stocks");
  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const { adminTools_byStock, pos_mng } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock", "pos_mng"],
    auth: Auth,
    CrStocks,
  });
  let prevState = f7route?.query?.prevState
    ? JSON.parse(f7route?.query?.prevState)
    : null;

  let formState = f7route?.query?.formState
    ? JSON.parse(f7route?.query?.formState)
    : null;

  let [RoomsList, setRoomsList] = useState([]);

  const standalone = useRef(null);
  const btnStaffRef = useRef(null);

  const [IsAutoSalaryMethod, setIsAutoSalaryMethod] = useState(false);

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      ServiceID: formState?.Os?.ID,
      Staffs: null,
      desc: "",
      IsMemberSet: false,
      date: "",
      StockID: null,
      AutoSalaryMethod: AutoSalaryMethodOptions[0],
      btn: "CHUYEN",
      Hours: `' + z.Minutes + '`,
      salaryUpdate: null,
      roomid: "",
      salaryJSON: null,
      fee: null,
      TINH_TRANG: "",
      THU_THUAT: "",
      DANH_GIA: "",
      LUU_Y: "",
    },
    //resolver: yupResolver(schemaAdd),
  });

  const { fields: fieldsFee } = useFieldArray({
    control,
    name: "fee",
  });

  const { fields: fieldsStaffs, remove } = useFieldArray({
    control,
    name: "Staffs",
  });

  const OsImages = useQuery({
    queryKey: ["OsImagesDetailID", { ID: formState?.Os?.ID }],
    queryFn: async () => {
      let images = await AdminAPI.clientsGetImagesServicesItem({
        OsID: formState?.Os?.ID,
        token: Auth?.token,
      });
      return images?.data?.data || null;
    },
  });

  const Os = useQuery({
    queryKey: ["OsDetailID", { ID: formState?.Os?.ID }],
    queryFn: async () => {
      let rs = await appPOS.getOs({
        mid: formState?.Os?.MemberID,
        osid: formState?.Os?.ID,
      });
      if (rs?.OrderID) {
        let { data: Order } = await AdminAPI.clientsViewOrderId({
          OrderID: rs?.OrderID,
          Token: Auth?.token,
        });
        rs = {
          ...rs,
          CPayed: Order?.Order?.CPayed,
          MPayed: Order?.Order?.MPayed,
        };
      }
      let Materials = [];
      if (rs.Status === "done") {
        let rsMaterials = await AdminAPI.clientsGetMaterialsOsServicesItem({
          Token: Auth?.token,
          OsID: formState?.Os?.ID,
        });
        Materials = rsMaterials?.data?.data;
      }
      return rs ? { ...rs, Materials } : null;
    },
    onSuccess: (data) => {
      let index = Stocks.findIndex((x) => x.value === data?.StockID);
      let newFee = null;
      if (data.feeList && data?.feeList?.length > 0) {
        newFee = data.feeList.filter((x) => x.Remain > 0 || x.Assign > 0);
        if (newFee.length > 0) {
          newFee = newFee.map((x) => ({
            ...x,
            Remain: x.Assign
              ? {
                  label: x.Assign,
                  value: x.Assign,
                }
              : {
                  label: "Không sử dụng",
                  value: "-1",
                },
            Remains: Array.from(
              { length: x.Remain + x.Assign + 1 },
              (_, i) => ({
                label: i === 0 ? "Không sử dụng" : i,
                value: i === 0 ? "-1" : i,
              })
            ),
          }));
        }
      }

      let newStaffs = data?.Staffs
        ? data?.Staffs.map((item) => ({
            ...item,
            label: item.FullName,
            value: item.UserID,
            raw: item.Value,
            feeList: item.feeList
              ? item.feeList.map((o) => ({
                  ...o,
                  raw: o.Value,
                }))
              : [],
          }))
        : null;

      let InfoJSON = data?.InfoJSON ? JSON.parse(data?.InfoJSON) : null;
      reset({
        ServiceID: data?.ID,
        Staffs: newStaffs,
        Hours: "",
        desc: data?.Desc,
        IsMemberSet: data?.IsMemberSet,
        date: data?.BookDate || new Date(),
        StockID: data?.Status
          ? index > -1
            ? Stocks[index]
            : null
          : {
              ...CrStocks,
              value: CrStocks?.ID,
              label: CrStocks?.Title,
            },
        AutoSalaryMethod: AutoSalaryMethodOptions[0],
        btn: !data?.Status ? "CHUYEN" : "HOAN_THANH",
        salaryUpdate: null,
        roomid: data?.RoomID && data?.RoomID !== "0" ? data?.RoomID : "",
        salaryJSON: null,
        fee: newFee,
        TINH_TRANG: InfoJSON?.TINH_TRANG || "",
        THU_THUAT: InfoJSON?.THU_THUAT || "",
        DANH_GIA: InfoJSON?.DANH_GIA || "",
        LUU_Y: InfoJSON?.LUU_Y || "",
      });
    },
  });

  const Rooms = useQuery({
    queryKey: ["ConfigRoomsOs"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("room");
      let result = [];
      if (data?.data && data.data.length > 0) {
        let { Value } = data?.data[0];
        if (Value) {
          let newValue = JSON.parse(Value);
          if (newValue && newValue.length > 0) {
            for (let Stock of Stocks) {
              let index = newValue.findIndex((x) => x.StockID === Stock?.ID);
              if (index > -1) {
                result.push(newValue[index]);
              } else {
                result.push({
                  StockID: Stock?.ID,
                  StockTitle: Stock?.Title,
                  ListRooms: [],
                });
              }
            }
          }
        } else {
          result = Stocks.map((o) => ({
            StockID: o.ID,
            StockTitle: o?.Title,
            ListRooms: [],
          }));
        }
      }

      return result;
    },
  });

  const CheckIn = useQuery({
    queryKey: ["GetCheckIn", { ID: Os?.data?.MemberID }],
    queryFn: async () => {
      let bodyFormData = new FormData();
      bodyFormData.append("cmd", "getcheck");
      bodyFormData.append("ids", Os?.data?.MemberID);

      let { data } = await AdminAPI.getCheckIn({
        data: bodyFormData,
        Token: Auth.token,
        StockID: CrStocks?.ID,
      });
      return data && data.length > 0 && !data[0]?.CheckOutTime ? data[0] : null;
    },
    enabled: Os?.data?.MemberID > 0,
  });

  let { roomid, StockID, fee, Staffs, AutoSalaryMethod } = watch();

  useEffect(() => {
    if (Rooms?.data && Rooms?.data.length > 0) {
      let index = Rooms?.data.findIndex((x) => x.StockID === StockID?.value);
      if (index > -1) {
        setRoomsList(
          Rooms?.data[index]?.ListRooms
            ? Rooms?.data[index]?.ListRooms.map((room) => ({
                ...room,
                value: room.ID,
                options: room.Children
                  ? room.Children.map((x) => ({ ...x, value: x.ID }))
                  : [],
              }))
            : []
        );
      }
    }
  }, [StockID, Rooms?.data]);

  useEffect(() => {
    if (typeof roomid === "string") {
      for (let otps of RoomsList) {
        let index = otps?.options?.findIndex(
          (x) => x.value === (roomid?.value || roomid)
        );
        if (index > -1) {
          setValue("roomid", otps?.options[index]);
        }
      }
    }
  }, [StockID, RoomsList, roomid]);

  const uploadImageOsMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsUploadImagesServicesItem(body);
      await OsImages.refetch();
      return data;
    },
  });

  const uploadImagesOsMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsUploadImagesServicesItem(body);
      return data;
    },
  });

  const resetOsMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsResetOsServicesItem(body);
      await Promise.all([
        queryClient.invalidateQueries(["ClientServicesID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["OrderManageID"]),
      ]);
      await OsImages.refetch();
      await Os?.refetch();
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      if (
        !CheckIn?.data?.ID &&
        body?.data?.os?.BookDate &&
        moment(body?.data?.os?.BookDate).format("DD-MM-YYYY") ===
          moment().format("DD-MM-YYYY")
      ) {
        var bodyFormDataCheckIn = new FormData();
        bodyFormDataCheckIn.append("cmd", "checkin");
        bodyFormDataCheckIn.append("mid", Os?.data?.MemberID);
        bodyFormDataCheckIn.append("desc", "Checkin khi giao ca dịch vụ");
        bodyFormDataCheckIn.append(
          "date",
          moment().format("DD/MM/YYYY HH:mm:ss")
        );

        await AdminAPI.clientsCheckIn({
          StockID: CrStocks?.ID,
          data: bodyFormDataCheckIn,
          Token: Auth?.token,
        });
      }

      let data = await appPOS.setOs(body.data.os, body.data.actions);
      await Promise.all([
        queryClient.invalidateQueries(["ClientServicesID"]),
        queryClient.invalidateQueries(["CalendarBookings"]),
        queryClient.invalidateQueries(["InvoiceProcessings"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["OrderManageID"]),
      ]);
      await Os.refetch();
      return data;
    },
  });

  const UploadImagesOs = async (images) => {
    if (!images) return;

    f7.dialog.preloader("Đang Upload ...");

    const promiseArray = images.map(async (arr) => {
      await Promise.all(
        images.map(async (image) => {
          var bodyFormData = new FormData();
          bodyFormData.append("src", image);

          await uploadImagesOsMutation.mutateAsync({
            OsID: formState?.Os?.ID,
            Token: Auth?.Token,
            data: bodyFormData,
          });
        })
      );
    });
    await await Promise.all(promiseArray);
    await OsImages.refetch();
    f7.dialog.close();
  };

  const onRemoveImagesID = (ID) => {
    f7.dialog.confirm("Xác nhận xoá hình ảnh này ?", () => {
      f7.dialog.preloader("Đang xoá ảnh ...");
      var bodyFormData = new FormData();
      bodyFormData.append("delete", ID);
      uploadImageOsMutation.mutate(
        {
          OsID: formState?.Os?.ID,
          Token: Auth?.Token,
          data: bodyFormData,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
          },
        }
      );
    });
  };

  const resetOs = () => {
    f7.dialog.confirm(
      "Thông tin buổi dịch vụ sẽ được Reset. Vui lòng đặt lịch lại.",
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        var bodyFormData = new FormData();
        bodyFormData.append("osid", formState?.Os?.ID);
        resetOsMutation.mutate(
          {
            Token: Auth?.Token,
            data: bodyFormData,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success("Reset buổi dịch vụ thành công.");
            },
          }
        );
      }
    );
  };

  const onSubmit = async (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    if (values.btn === "CHUYEN") {
      let newValues = {
        os: {
          ...Os?.data,
          InfoJSON: JSON.stringify({
            TINH_TRANG: values.TINH_TRANG,
            THU_THUAT: values.THU_THUAT,
            DANH_GIA: values.DANH_GIA,
            LUU_Y: values.LUU_Y,
          }),
          BookDate: values.date
            ? moment(values.date).toDate()
            : moment().toDate(),
          Desc: values?.desc,
          StockID: values?.StockID?.value || "",
          RoomID: values.roomid?.value || "",
          AutoSalaryMethod: values.AutoSalaryMethod?.value || "0",
        },
        actions: {
          action: "GIAO_CA",
          data: {
            feeList: values.fee
              ? fee.map((x) => ({
                  ...x,
                  Remain: x?.Remain?.value,
                  Assign: x?.Remain?.value || 0,
                }))
              : [],
            Staffs: values.Staffs
              ? values.Staffs.map((m) => {
                  let obj = {
                    UserID: m?.value,
                    FullName: m?.label,
                    Value: m.Value,
                    feeList: m.feeList
                      ? m.feeList.map((f) => {
                          let newF = {
                            ...f,
                            RootID: f.Salary.ProdRootID,
                            OrderItemID: f.Salary.OrderItemID,
                            OrderServiceFeeList: [],
                          };
                          if (f.raw === f.Value) {
                            delete newF.raw;
                          }
                          return newF;
                        })
                      : [],
                  };
                  if (m.raw !== m.Value) {
                    obj.raw = m.Value;
                  }
                  return obj;
                })
              : [],
          },
        },
      };
      updateMutation.mutate(
        {
          data: newValues,
        },
        {
          onSuccess: (data) => {
            toast.success("Cập nhập thành công.");
            f7.dialog.close();
          },
        }
      );
    }
    if (values.btn === "HUY_BUOI") {
      let newValues = {
        os: {
          ...Os?.data,
          InfoJSON: JSON.stringify({
            TINH_TRANG: values.TINH_TRANG,
            THU_THUAT: values.THU_THUAT,
            DANH_GIA: values.DANH_GIA,
            LUU_Y: values.LUU_Y,
          }),
          BookDate: values.date
            ? moment(values.date).toDate()
            : moment().toDate(),
          Desc: values?.desc,
          StockID: values?.StockID?.value || "",
          RoomID: values.roomid?.value || "",
          AutoSalaryMethod: values.AutoSalaryMethod?.value || "0",
        },
        actions: {
          action: "HUY_BUOI",
          data: {
            feeList: values.fee
              ? fee.map((x) => ({
                  ...x,
                  Remain: x?.Remain?.value,
                  Assign: x?.Remain?.value || 0,
                }))
              : [],
            Staffs: [],
          },
        },
      };
      updateMutation.mutate(
        {
          data: newValues,
        },
        {
          onSuccess: (data) => {
            noti27 && noti27.DICH_VU_HUY({ Service: newValues, OrderService: newValues });
            toast.success("Huỷ buổi thành công.");
            f7.dialog.close();
          },
        }
      );
    }
    if (values.btn === "HOAN_THANH") {
      let newValues = {
        os: {
          ...Os?.data,
          InfoJSON: JSON.stringify({
            TINH_TRANG: values.TINH_TRANG,
            THU_THUAT: values.THU_THUAT,
            DANH_GIA: values.DANH_GIA,
            LUU_Y: values.LUU_Y,
          }),
          BookDate: values.date
            ? moment(values.date).toDate()
            : moment().toDate(),
          Desc: values?.desc,
          StockID: values?.StockID?.value || "",
          RoomID: values.roomid?.value || "",
          AutoSalaryMethod: values.AutoSalaryMethod?.value || "0",
        },
        actions: {
          action: "HOAN_THANH_CA",
          data: {
            feeList: values.fee
              ? fee.map((x) => ({
                  ...x,
                  Remain: x?.Remain?.value,
                  Assign: x?.Remain?.value || 0,
                }))
              : [],
            Staffs: values.Staffs
              ? values.Staffs.map((m) => {
                  let obj = {
                    UserID: m?.value,
                    FullName: m?.label,
                    Value: m.Value,
                    feeList: m.feeList
                      ? m.feeList.map((f) => {
                          let newF = {
                            ...f,
                            RootID: f.Salary.ProdRootID,
                            OrderItemID: f.Salary.OrderItemID,
                            OrderServiceFeeList: [],
                          };
                          if (f.raw === f.Value) {
                            delete newF.raw;
                          }
                          return newF;
                        })
                      : [],
                  };
                  if (m.raw !== m.Value) {
                    obj.raw = m.Value;
                  }
                  return obj;
                })
              : [],
          },
        },
      };
      updateMutation.mutate(
        {
          data: newValues,
        },
        {
          onSuccess: (data) => {
            toast.success("Hoàn thành ca thành công.");
            f7.dialog.close();
          },
        }
      );
    }
  };

  const isAddFreeShow = () => {
    if (!Brand?.Global?.Admin?.Chinh_sua_don_hang_da_thanh_toan) {
      if (Os?.data?.CPayed || Os?.data?.MPayed)
        return adminTools_byStock?.hasRight;
      return true;
    }
    return true;
  };

  return (
    <Page
      className="bg-white"
      name="os-edit-calendar"
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
          {!Os?.data
            ? formState?.Os?.ProdService2
              ? formState?.Os?.ProdService2
              : formState?.Os?.ProdService || formState?.Os?.Title
            : Os?.data?.ProdService2
            ? Os?.data?.ProdService2
            : Os?.data?.ProdService || data?.Title}
        </NavTitle>
        <NavRight className="h-full">
          <PickerServiceOsInfo data={Os?.data}>
            {({ open }) => (
              <Link
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
                onClick={open}
              >
                <InformationCircleIcon className="w-6" />
              </Link>
            )}
          </PickerServiceOsInfo>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form
        className="flex flex-col h-full pb-safe-b"
        onSubmit={handleSubmit(onSubmit)}
      >
        {Os?.isLoading && (
          <div
            role="status"
            className={clsx(
              "grow left-0 flex items-center justify-center w-full transition h-full top-0 z-10 bg-white/50"
            )}
          >
            <svg
              aria-hidden="true"
              className="w-8 h-8 mr-2 text-gray-300 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="fill-muted"
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        )}
        {!Os?.isLoading && (
          <>
            <div className="p-4 overflow-auto grow page-scrollbar">
              <div className="mb-3.5 last:mb-0">
                <div className="mb-px">Thời gian / Cơ sở</div>
                <Controller
                  name="date"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      format="HH:mm DD-MM-YYYY"
                      errorMessage={fieldState?.error?.message}
                      errorMessageForce={fieldState?.invalid}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn thời gian"
                      showHeader
                      clear
                      minDate={
                        Brand?.Global?.Admin?.minbookdate === "now" &&
                        !adminTools_byStock?.hasRight
                          ? new Date()
                          : null
                      }
                    />
                  )}
                />
                <div className="mt-2">
                  <Controller
                    name="StockID"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectPicker
                        isClearable={false}
                        placeholder="Chọn cơ sở"
                        value={field.value}
                        options={pos_mng?.StockRoles || []}
                        label="Cơ sở"
                        onChange={(val) => {
                          field.onChange(val || null);
                          setValue("roomid", null);
                        }}
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                      />
                    )}
                  />
                  {Os?.data?.StockID !== StockID?.ID && (
                    <div className="mt-1.5 text-[14px] font-light leading-5">
                      (*) Buổi dịch vụ thuộc điểm
                      <span className="text-danger font-medium pl-1.5">
                        {Stocks &&
                        Stocks.filter((x) => x.ID === Os?.data?.StockID)
                          .length > 0
                          ? Stocks.filter((x) => x.ID === Os?.data?.StockID)[0]
                              .Title
                          : "Chưa xác định"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-3.5 last:mb-0 border rounded">
                <div className="flex justify-between p-4 mb-px bg-gray-100">
                  <div className="font-medium">Phụ phí</div>
                  {isAddFreeShow() && (
                    <Link
                      noLinkClass
                      className="flex font-medium text-primary"
                      href={`/admin/pos/manage/${
                        Os?.data?.MemberID
                      }/add-prods?filters=${JSON.stringify({
                        cateid: "890",
                      })}&prevState=${JSON.stringify({
                        invalidateQueries: ["OsDetailID"],
                      })}`}
                    >
                      <PlusIcon className="w-4 mr-1" />
                      Mua mới phụ phí
                    </Link>
                  )}
                </div>
                <div className="p-4">
                  {fieldsFee &&
                    fieldsFee?.map((item, index) => (
                      <div className="mb-2 last:mb-0" key={item.id}>
                        <div className="mb-px text-gray-500">{item.Title}</div>
                        <div>
                          <Controller
                            name={`fee[${index}].Remain`}
                            control={control}
                            render={({ field, fieldState }) => (
                              <SelectPicker
                                isClearable={false}
                                placeholder="Số lượng"
                                value={field.value}
                                options={item?.Remains || []}
                                label="Số lượng"
                                onChange={(val) => {
                                  field.onChange(val || null);
                                  if (appPOS) {
                                    appPOS
                                      .setOs(
                                        {
                                          ...Os?.data,
                                          AutoSalaryMethod:
                                            AutoSalaryMethod?.value,
                                        },
                                        {
                                          action: "TINH_LUONG",
                                          data: {
                                            feeList: fee
                                              ? fee.map((x) => ({
                                                  ...x,
                                                  Assign: x?.Remain?.value || 0,
                                                }))
                                              : [],
                                            Staffs: Staffs
                                              ? Staffs.map((m) => ({
                                                  UserID: m?.value,
                                                  FullName: m?.label,
                                                  Value: 0,
                                                  feeList: fee
                                                    ? fee
                                                        .filter(
                                                          (x) =>
                                                            Number(
                                                              x?.Remain?.value
                                                            ) > 0
                                                        )
                                                        .map((x) => ({
                                                          ...x,
                                                          Assign:
                                                            x?.Remain?.value ||
                                                            0,
                                                        }))
                                                    : [],
                                                }))
                                              : [],
                                          },
                                        }
                                      )
                                      .then((os) => {
                                        setValue(
                                          "Staffs",
                                          os?.Staffs?.map((x) => ({
                                            ...x,
                                            label: x.FullName,
                                            value: x.UserID,
                                            Value: x.Salary || x.Value,
                                            raw: x.Salary || x.Value,
                                            feeList: x.feeList
                                              ? x.feeList.map((f) => ({
                                                  ...f,
                                                  raw: f.Value,
                                                }))
                                              : [],
                                          }))
                                        );
                                      })
                                      .catch((e) => console.log(e));
                                  }
                                }}
                                errorMessage={fieldState?.error?.message}
                                errorMessageForce={fieldState?.invalid}
                              />
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  {(!fieldsFee || fieldsFee.length === 0) && (
                    <div className="font-light text-gray-600">Chưa có</div>
                  )}
                </div>
              </div>
              <div className="mb-3.5 last:mb-0">
                <div className="border rounded">
                  <div className="flex justify-between p-4 mb-px bg-gray-100">
                    <div
                      className="flex font-medium"
                      onClick={() => setIsAutoSalaryMethod(!IsAutoSalaryMethod)}
                    >
                      <Cog6ToothIcon className="w-5 mr-1" /> Nhân viên thực hiện
                    </div>
                    <Link
                      noLinkClass
                      className="flex font-medium text-primary"
                      onClick={() => btnStaffRef?.current?.click()}
                    >
                      <PlusIcon className="w-4 mr-1" />
                      Thêm nhân viên
                    </Link>
                  </div>
                  <div className="p-4">
                    {fieldsStaffs && fieldsStaffs.length > 0 && (
                      <>
                        {fieldsStaffs.map((item, index) => (
                          <div
                            className="mb-3 pb-3.5 border-b border-dashed last:mb-0 last:pb-0 last:border-0"
                            key={item.id}
                          >
                            <div className="mb-1.5 flex justify-between items-center">
                              <div className="font-medium text-gray-500">
                                {item.FullName}
                              </div>
                              <div
                                onClick={() =>
                                  f7.dialog.confirm(
                                    "Xác nhận loại bỏ thưởng cho nhân viên này ? ",
                                    () => remove(index)
                                  )
                                }
                              >
                                <XCircleIcon className="w-5 text-danger" />
                              </div>
                            </div>
                            <div className="mb-1.5">
                              <Controller
                                name={`Staffs[${index}].Value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <div className="flex">
                                    <div className="bg-gray-100 px-4 rounded-s w-[100px] flex items-center border-l border-t border-b border-[#d5d7da] text-[13px]">
                                      Lương ca
                                    </div>
                                    <div className="relative flex-1">
                                      <NumericFormat
                                        className={clsx(
                                          "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded-s-none rounded-e py-3 px-4 focus:border-primary",
                                          fieldState?.invalid
                                            ? "border-danger"
                                            : "border-[#d5d7da]"
                                        )}
                                        type="text"
                                        autoComplete="off"
                                        thousandSeparator={true}
                                        placeholder="Nhập số tiền"
                                        value={field.value}
                                        onValueChange={(val) =>
                                          field.onChange(val.floatValue || "")
                                        }
                                        onFocus={(e) =>
                                          KeyboardsHelper.setAndroid({
                                            Type: "body",
                                            Event: e,
                                          })
                                        }
                                      />
                                      {field.value ? (
                                        <div
                                          className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                          onClick={() => field.onChange("")}
                                        >
                                          <XMarkIcon className="w-5" />
                                        </div>
                                      ) : (
                                        <></>
                                      )}
                                    </div>
                                  </div>
                                )}
                              />
                            </div>
                            {item.feeList &&
                              item.feeList.map((fe, idx) => (
                                <div className="mb-1.5 last:mb-0" key={idx}>
                                  <Controller
                                    name={`Staffs[${index}].feeList[${idx}].Value`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <div className="flex">
                                        <div className="bg-gray-100 px-4 rounded-s w-[100px] flex items-center border-l border-t border-b border-[#d5d7da] text-[13px]">
                                          PP [{idx + 1}]
                                        </div>
                                        <div className="relative flex-1">
                                          <NumericFormat
                                            className={clsx(
                                              "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded-s-none rounded-e py-3 px-4 focus:border-primary",
                                              fieldState?.invalid
                                                ? "border-danger"
                                                : "border-[#d5d7da]"
                                            )}
                                            type="text"
                                            autoComplete="off"
                                            thousandSeparator={true}
                                            placeholder="Nhập số tiền"
                                            value={field.value}
                                            onValueChange={(val) =>
                                              field.onChange(
                                                val.floatValue || ""
                                              )
                                            }
                                            onFocus={(e) =>
                                              KeyboardsHelper.setAndroid({
                                                Type: "body",
                                                Event: e,
                                              })
                                            }
                                          />
                                          {field.value ? (
                                            <div
                                              className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                              onClick={() => field.onChange("")}
                                            >
                                              <XMarkIcon className="w-5" />
                                            </div>
                                          ) : (
                                            <></>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  />
                                </div>
                              ))}
                          </div>
                        ))}
                      </>
                    )}
                    {(!fieldsStaffs || fieldsStaffs.length === 0) && (
                      <div className="font-light text-gray-600">Chưa có</div>
                    )}
                  </div>
                  <div className="hidden">
                    <Controller
                      name="Staffs"
                      control={control}
                      render={({ field, fieldState }) => (
                        <SelectMembersServices
                          ShiftOnly={true}
                          elRef={btnStaffRef}
                          isMulti
                          isRequired={false}
                          placeholderInput="Tên nhân viên"
                          placeholder="Chọn nhân viên"
                          value={field.value}
                          label="Chọn nhân viên"
                          onChange={(val) => {
                            field.onChange(val);

                            if (appPOS) {
                              appPOS
                                .setOs(
                                  {
                                    ...Os?.data,
                                    AutoSalaryMethod: AutoSalaryMethod?.value,
                                  },
                                  {
                                    action: "TINH_LUONG",
                                    data: {
                                      feeList: fee
                                        ? fee.map((x) => ({
                                            ...x,
                                            Assign: x?.Remain?.value || 0,
                                          }))
                                        : [],
                                      Staffs: val
                                        ? val.map((m) => ({
                                            UserID: m?.value,
                                            FullName: m?.label,
                                            Value: 0,
                                            feeList: fee
                                              ? fee
                                                  .filter(
                                                    (x) =>
                                                      Number(x?.Remain?.value) >
                                                      0
                                                  )
                                                  .map((x) => ({
                                                    ...x,
                                                    Assign:
                                                      x?.Remain?.value || 0,
                                                  }))
                                              : [],
                                          }))
                                        : [],
                                    },
                                  }
                                )
                                .then((os) => {
                                  setValue(
                                    "Staffs",
                                    os?.Staffs?.map((x) => ({
                                      ...x,
                                      label: x.FullName,
                                      value: x.UserID,
                                      Value: x.Salary || x.Value,
                                      raw: x.Salary || x.Value,
                                      feeList: x.feeList
                                        ? x.feeList.map((f) => ({
                                            ...f,
                                            raw: f.Value,
                                          }))
                                        : [],
                                    }))
                                  );
                                })
                                .catch((e) => console.log(e));
                            }
                          }}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          isFilter
                          StockRoles={pos_mng?.StockRoles}
                        />
                      )}
                    />
                  </div>
                </div>
                {IsAutoSalaryMethod && (
                  <div className="mt-2">
                    <Controller
                      name={`AutoSalaryMethod`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <SelectPicker
                          isClearable={false}
                          placeholder="Chọn phương thức"
                          value={field.value}
                          options={AutoSalaryMethodOptions || []}
                          label="Chọn phương thức"
                          onChange={(val) => {
                            field.onChange(val || null);
                            if (appPOS) {
                              appPOS
                                .setOs(
                                  {
                                    ...Os?.data,
                                    AutoSalaryMethod: val?.value,
                                  },
                                  {
                                    action: "TINH_LUONG",
                                    data: {
                                      feeList: fee
                                        ? fee.map((x) => ({
                                            ...x,
                                            Assign: x?.Remain?.value || 0,
                                          }))
                                        : [],
                                      Staffs: Staffs
                                        ? Staffs.map((m) => ({
                                            UserID: m?.value,
                                            FullName: m?.label,
                                            Value: 0,
                                            feeList: fee
                                              ? fee
                                                  .filter(
                                                    (x) =>
                                                      Number(x?.Remain?.value) >
                                                      0
                                                  )
                                                  .map((x) => ({
                                                    ...x,
                                                    Assign:
                                                      x?.Remain?.value || 0,
                                                  }))
                                              : [],
                                          }))
                                        : [],
                                    },
                                  }
                                )
                                .then((os) => {
                                  setValue(
                                    "Staffs",
                                    os?.Staffs?.map((x) => ({
                                      ...x,
                                      label: x.FullName,
                                      value: x.UserID,
                                      Value: x.Salary || x.Value,
                                    }))
                                  );
                                })
                                .catch((e) => console.log(e));
                            }
                          }}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
              {Brand?.Global?.Admin?.isRooms && (
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Giường</div>
                  <Controller
                    name="roomid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectPickersGroup
                        isRequired={true}
                        placeholder="Chọn giường"
                        value={field.value}
                        options={RoomsList || []}
                        label="Chọn giường"
                        onChange={(val) => {
                          field.onChange(val);
                        }}
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                      />
                    )}
                  />
                </div>
              )}

              <div className="flex items-end justify-between mb-3.5 last:mb-0">
                <div>Khách hàng chọn nhân viên</div>
                <Controller
                  name="IsMemberSet"
                  control={control}
                  render={({ field: { ref, ...field }, fieldState }) => (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={field.value}
                        {...field}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                    </label>
                  )}
                />
              </div>
              <div className="mb-3.5 last:mb-0">
                <div className="mb-px">Ghi chú</div>
                <Controller
                  name="desc"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                      type="textarea"
                      placeholder="Nhập ghi chú"
                      rows="4"
                      value={field.value}
                      errorMessage={fieldState?.error?.message}
                      errorMessageForce={fieldState?.invalid}
                      onChange={field.onChange}
                      onFocus={(e) =>
                        KeyboardsHelper.setAndroid({
                          Type: "body",
                          Event: e,
                        })
                      }
                    />
                  )}
                />
              </div>
              {Brand?.Global?.Admin?.os_4_chi_tiet && (
                <>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px">Tình trạng</div>
                    <Controller
                      name="TINH_TRANG"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                          type="textarea"
                          placeholder="Nhập tình trạng"
                          rows="4"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onChange={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                        />
                      )}
                    />
                  </div>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px">Thủ thuật</div>
                    <Controller
                      name="THU_THUAT"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                          type="textarea"
                          placeholder="Nhập thủ thuật"
                          rows="4"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onChange={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                        />
                      )}
                    />
                  </div>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px">Đánh giá sau buổi liệu trình</div>
                    <Controller
                      name="DANH_GIA"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                          type="textarea"
                          placeholder="Nhập đánh giá"
                          rows="4"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onChange={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                        />
                      )}
                    />
                  </div>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px">Lưu ý cho buổi sau</div>
                    <Controller
                      name="LUU_Y"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                          type="textarea"
                          placeholder="Nhập lưu ý"
                          rows="4"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onChange={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                        />
                      )}
                    />
                  </div>
                </>
              )}
              <div className="mb-3.5 last:mb-0">
                <div className="mb-px font-light">Hình ảnh</div>
                <div className="grid grid-cols-3 gap-4">
                  {OsImages?.data &&
                    OsImages?.data.map((item, index) => (
                      <div
                        className="relative flex items-center border aspect-square"
                        key={index}
                        onClick={() => standalone.current.open(index)}
                      >
                        <img
                          className="object-contain w-full h-full rounded"
                          src={AssetsHelpers.toAbsoluteUrl(item?.Src)}
                          alt=""
                        />
                        <div
                          className="absolute flex items-center justify-center bg-white rounded-full shadow-lg w-7 h-7 -top-3 -right-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImagesID(item.ID);
                          }}
                        >
                          <XMarkIcon className="w-5 opacity-75" />
                        </div>
                      </div>
                    ))}
                  <UploadImages
                    width="w-auto"
                    height="h-auto"
                    className="aspect-square"
                    onChange={(images) => UploadImagesOs(images)}
                    size="xs"
                    isMultiple={true}
                  />
                </div>
                <PhotoBrowser
                  photos={
                    OsImages?.data
                      ? OsImages?.data.map((x) => ({
                          ...x,
                          url: AssetsHelpers.toAbsoluteUrl(x.Src),
                        }))
                      : []
                  }
                  thumbs={
                    OsImages?.data
                      ? OsImages?.data.map((x) =>
                          AssetsHelpers.toAbsoluteUrl(x.Src)
                        )
                      : []
                  }
                  ref={standalone}
                  navbarShowCount={true}
                  toolbar={false}
                />
              </div>
            </div>
          </>
        )}
        <div className="flex gap-2 p-4">
          <Button
            type="button"
            className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
            fill
            large
            preloader
            popoverOpen=".popover-os-more"
            disabled={Os?.isLoading || Os?.isFetching}
            loading={Os?.isLoading || Os?.isFetching}
            preloaderColor="black"
          >
            <EllipsisVerticalIcon className="w-6" />
          </Button>
          <Popover className="popover-os-more">
            <div className="flex flex-col py-1">
              <Link
                popoverClose
                className="flex justify-between p-3 font-medium border-b last:border-0"
                noLinkClass
                href={`/admin/printers/service/${Os?.data?.ID}/`}
              >
                In phiếu dịch vụ
              </Link>
              <Link
                popoverClose
                className="flex justify-between p-3 font-medium border-b last:border-0"
                noLinkClass
                href={`/admin/printers/service/${Os?.data?.ID}/?mode=card`}
              >
                In thẻ dịch vụ
              </Link>
              {Os?.data?.ConvertAddFeeID && (
                <PickerServiceChange data={Os?.data}>
                  {({ open }) => (
                    <Link
                      popoverClose
                      className="flex justify-between p-3 font-medium border-b last:border-0"
                      noLinkClass
                      onClick={open}
                    >
                      Chuyển đổi dịch vụ
                    </Link>
                  )}
                </PickerServiceChange>
              )}
              {Os?.data?.Status === "done" && (
                <>
                  <Link
                    popoverClose
                    className="flex justify-between p-3 font-medium border-b last:border-0"
                    noLinkClass
                    href={`/admin/pos/calendar/os/materials/${formState?.Os?.ID}`}
                  >
                    Nguyên vật liệu ({Os?.data?.Materials?.length || "0"})
                  </Link>
                </>
              )}
            </div>
          </Popover>

          {Os?.data?.Status === "done" &&
            (moment(Os?.data?.BookDate).format("DD/MM/YYYY") ==
              moment().format("DD/MM/YYYY") ||
              adminTools_byStock?.hasRight) && (
              <Button
                fill
                large
                preloader
                loading={
                  resetOsMutation.isLoading ||
                  updateMutation.isLoading ||
                  Os?.isLoading ||
                  Os?.isFetching
                }
                disabled={
                  resetOsMutation.isLoading ||
                  updateMutation.isLoading ||
                  Os?.isLoading ||
                  Os?.isFetching
                }
                type="button"
                className="bg-danger w-[115px]"
                onClick={resetOs}
              >
                Chỉnh sửa
              </Button>
            )}

          <Button
            type="button"
            className={clsx(
              "flex-1 [&>span:not(.preloader)]:w-full px-0",
              !Os?.data?.Status && "bg-primary",
              Os?.data?.Status === "doing" && "bg-success",
              Os?.data?.Status === "done" && "bg-black",
              Os?.data?.Status !== "done" && "[&>span:not(.preloader)]:pr-12"
            )}
            fill
            large
            preloader
            loading={
              Os?.isLoading ||
              Os?.isFetching ||
              updateMutation.isLoading ||
              CheckIn?.isLoading
            }
            disabled={
              CheckIn?.isLoading ||
              Os?.isLoading ||
              Os?.data?.Status === "done" ||
              updateMutation.isLoading
            }
            onClick={() =>
              handleSubmit((data) =>
                onSubmit({
                  ...data,
                  btn: !Os?.data?.Status ? "CHUYEN" : "HOAN_THANH",
                })
              )()
            }
          >
            {!Os?.data?.Status && "Giao ca nhân viên"}
            {Os?.data?.Status === "doing" && "Hoàn thành ca"}
            {Os?.data?.Status === "done" && "Đã hoàn thành"}
            {Os?.data?.Status !== "done" && (
              <Link
                className="absolute right-0 w-12 h-full flex items-center justify-center after:content-[''] after:w-[1px] after:h-[65%] after:bg-white after:left-0 after:absolute after:opacity-90 opacity-90"
                popoverOpen=".popover-os-action"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronUpIcon className="w-6" />
              </Link>
            )}
          </Button>
          <Popover className="popover-os-action">
            <div className="flex flex-col py-1">
              <Link
                popoverClose
                className="flex justify-between p-3 font-medium border-b last:border-0 text-primary"
                noLinkClass
                onClick={() =>
                  handleSubmit((data) =>
                    onSubmit({
                      ...data,
                      btn: "CHUYEN",
                    })
                  )()
                }
              >
                Giao ca nhân viên
              </Link>
              <Link
                popoverClose
                className="flex justify-between p-3 font-medium border-b last:border-0 text-success"
                noLinkClass
                onClick={() =>
                  handleSubmit((data) =>
                    onSubmit({
                      ...data,
                      btn: "HOAN_THANH",
                    })
                  )()
                }
              >
                Hoàn thành
              </Link>
              <Link
                popoverClose
                className="flex justify-between p-3 font-medium border-b last:border-0 text-danger"
                noLinkClass
                onClick={() =>
                  handleSubmit((data) =>
                    onSubmit({
                      ...data,
                      btn: "HUY_BUOI",
                    })
                  )()
                }
              >
                Huỷ buổi
              </Link>
            </div>
          </Popover>
        </div>
      </form>
    </Page>
  );
}

export default EditOsCalendar;

import PromHelpers from "@/helpers/PromHelpers";
import { ChevronLeftIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Popover,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import {
  SelectBookingClients,
  SelectMembersServices,
  SelectServiceRoots,
} from "@/partials/forms/select";
import { DatePicker, SelectPicker, SelectPickersGroup } from "@/partials/forms";
import { useMutation, useQuery, useQueryClient } from "react-query";
import ConfigsAPI from "@/api/Configs.api";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import clsx from "clsx";
import { RolesHelpers } from "@/helpers/RolesHelpers";

const schemaAdd = yup
  .object({
    BookDate: yup.string().required("Vui lòng chọn ngày đặt lịch."),
    MemberID: yup.object().nullable().required("Vui lòng chọn khách hàng"),
    StockID: yup.object().nullable().required("Vui lòng chọn cơ sở."),
  })
  .required();

const getQueryPost = (values, Auth) => {
  let newDesc = "";
  if (values?.AmountPeople?.value) {
    newDesc =
      (newDesc ? newDesc + "\n" : "") +
      `Số lượng khách: ${values.AmountPeople.value}`;
  }
  if (values?.Tags && values.Tags.length > 0) {
    newDesc =
      (newDesc ? newDesc + "\n" : "") +
      `Tags: ${values.Tags.map((x) => x.value).toString()}`;
  }
  newDesc =
    (newDesc ? newDesc + "\n" : "") +
    `Ghi chú: ${values.Desc.replaceAll("\n", "</br>")}`;

  const obj = {
    ...values,
    MemberID: values?.MemberID?.value,
    Member: values?.MemberID,
    StockID: values?.StockID?.value,
    RootIdS: values?.RootIdS
      ? values.RootIdS.map((item) => item.value).toString()
      : "",
    Roots: values?.RootIdS,
    UserServiceIDs:
      values?.UserServiceIDs && values?.UserServiceIDs.length > 0
        ? values.UserServiceIDs.map((item) => item.value).toString()
        : "",
    BookDate: moment(values.BookDate).format("YYYY-MM-DD HH:mm"),
    Status:
      values.Status && values?.Status !== "CHUA_XAC_NHAN"
        ? values.Status
        : "XAC_NHAN",
    Desc: newDesc,
    IsAnonymous: values?.MemberID?.label === "Khách vãng lai",
    TreatmentJson: values?.TreatmentJson
      ? JSON.stringify(values.TreatmentJson)
      : "",
  };

  let History = {
    ...(values?.History || {}),
    Edit: values?.History?.Edit
      ? [
          ...values?.History?.Edit,
          {
            CreateDate: moment().format("HH:mm DD-MM-YYYY"),
            Staff: {
              ID: Auth?.ID,
              FullName: Auth?.FullName,
            },
            Booking: {
              ...obj,
              Members: values.MemberID,
              UserServices: values.UserServiceIDs,
            },
          },
        ]
      : [
          {
            CreateDate: moment().format("HH:mm DD-MM-YYYY"),
            Staff: {
              ID: Auth?.ID,
              FullName: Auth?.FullName,
            },
            Booking: {
              ...obj,
              Members: values.MemberID,
              UserServices: values.UserServiceIDs,
            },
          },
        ],
  };

  obj.History = History;

  obj.Tags && delete obj.Tags;
  obj.AmountPeople && delete obj.AmountPeople;
  return obj;
};

let OptionsStatus = [
  {
    value: "XAC_NHAN",
    label: "Đã xác nhận",
  },
  {
    value: "KHACH_KHONG_DEN",
    label: "Khách không đến",
  },
  {
    value: "TU_CHOI",
    label: "Khách huỷ lịch",
  },
  {
    value: "KHACH_DEN",
    label: "Khách có đến",
  },
];

function AddEditCalendar({ f7route, f7router }) {
  const queryClient = useQueryClient();

  let [RoomsList, setRoomsList] = useState([]);

  let isAddMode = !f7route?.query?.formState;
  let prevState = f7route?.query?.prevState
    ? JSON.parse(f7route?.query?.prevState)
    : null;

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Stocks = useStore("Stocks");
  let Brand = useStore("Brand");

  const { pos_mng } = RolesHelpers.useRoles({
    nameRoles: ["pos_mng"],
    auth: Auth,
    CrStocks,
  });

  const memberRef = useRef("");

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      ID: 0,
      MemberID: null,
      RootIdS: "",
      BookDate: new Date(),
      Desc: "",
      StockID: {
        ...CrStocks,
        label: CrStocks?.Title,
        value: CrStocks?.ID,
      },
      UserServiceIDs: "",
      AtHome: false,
      AmountPeople: {
        label: "1 khách",
        value: 1,
      },
      Tags: "",
      FullName: "",
      Phone: "",
      Status: "",
      TreatmentJson: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  let { MemberID, Status, Desc, StockID } = watch();

  useEffect(() => {
    if (f7route?.query?.BookDate) {
      setValue("BookDate", f7route?.query?.BookDate);
    }
    if (f7route?.query?.resource) {
      let newUserServiceIDs = JSON.parse(f7route?.query?.resource);

      setValue("UserServiceIDs", [newUserServiceIDs]);
    }
    if (f7route?.query?.client) {
      let newClient = JSON.parse(f7route?.query?.client);

      setValue("MemberID", {
        ...newClient,
        suffix: newClient?.MobilePhone,
      });
    }

    if (f7route?.query?.formState) {
      let initialValues = JSON.parse(f7route?.query?.formState);

      let newDesc = initialValues.Desc;
      let AmountPeople = {
        label: "1 khách",
        value: 1,
      };
      let TagSetting = [];
      let descSplit = newDesc.split("\n");
      for (let i of descSplit) {
        if (i.includes("Số lượng khách:")) {
          let SL = Number(i.match(/\d+/)[0]);
          AmountPeople = {
            label: SL + " khách",
            value: SL,
          };
        }
        if (i.includes("Tags:")) {
          let newTagSetting = i.replaceAll("Tags: ", "");
          TagSetting = newTagSetting
            .split(",")
            .map((x) => ({ label: x, value: x }));
        }
        if (i.includes("Ghi chú:")) {
          newDesc = i.replaceAll("Ghi chú: ", "");
        }
      }

      reset({
        ID: initialValues?.ID,
        MemberID: {
          ...initialValues?.Member,
          label: initialValues?.Member?.FullName,
          value: initialValues?.Member?.ID,
          suffix: initialValues?.Member?.MobilePhone,
        },
        RootIdS:
          initialValues.Roots && initialValues.Roots.length > 0
            ? initialValues.Roots.map((x) => ({
                value: x.ID,
                label: x.Title,
              }))
            : null,
        BookDate: initialValues?.BookDate
          ? moment(initialValues?.BookDate, "YYYY-MM-DD HH:mm")
          : new Date(),
        Desc: newDesc.replaceAll("</br>", "\n"),
        StockID: initialValues.Stock
          ? {
              label: initialValues?.Stock?.Title,
              value: initialValues?.Stock?.ID,
            }
          : {
              ...CrStocks,
              label: CrStocks?.Title,
              value: CrStocks?.ID,
            },
        UserServiceIDs:
          initialValues?.UserServices && initialValues?.UserServices.length > 0
            ? initialValues?.UserServices.map((x) => ({
                label: x.FullName,
                value: x.ID,
              }))
            : null,
        AtHome: initialValues?.AtHome || false,
        AmountPeople: AmountPeople,
        Tags: TagSetting,
        FullName: initialValues?.FullName || "",
        Phone: initialValues?.Phone || "",
        Status: initialValues?.Status || "",
        TreatmentJson: initialValues?.TreatmentJson
          ? JSON.parse(initialValues?.TreatmentJson)
          : "",
        History: initialValues?.HistoryJSON
          ? JSON.parse(initialValues?.HistoryJSON)
          : "",
      });
    }
  }, [f7route?.query]);

  useEffect(() => {
    if (
      !f7route?.query?.formState &&
      !f7route?.query?.client &&
      memberRef?.current
    ) {
      memberRef?.current?.click();
    }
  }, [memberRef]);

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

  const SettingCalendar = useQuery({
    queryKey: ["SettingCalendarBook", CrStocks],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`ArticleRel`);
      let rs = {
        Tags: "",
        OriginalServices: [],
      };
      if (data?.data && data?.data.length > 0) {
        const result = JSON.parse(data?.data[0].Value);

        if (result) {
          rs = result;
        }
      }
      return rs;
    },
    initialData: {
      Tags: "",
      OriginalServices: [],
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addBookings(body);
      if (prevState && prevState.invalidateQueries) {
        await Promise.all(
          prevState.invalidateQueries.map((key) =>
            queryClient.invalidateQueries([key])
          )
        );
      } else {
        await queryClient.invalidateQueries(["CalendarBookings"]);
      }

      return data;
    },
  });

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addBookings(body);
      if (prevState && prevState.invalidateQueries) {
        await Promise.all(
          prevState.invalidateQueries.map((key) =>
            queryClient.invalidateQueries([key])
          )
        );
      } else {
        await queryClient.invalidateQueries(["CalendarBookings"]);
      }
      return data;
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addBookings(body);
      await AdminAPI.checkinMember(body);
      if (prevState && prevState.invalidateQueries) {
        await Promise.all(
          prevState.invalidateQueries.map((key) =>
            queryClient.invalidateQueries([key])
          )
        );
      } else {
        await queryClient.invalidateQueries(["CalendarBookings"]);
      }
      return data;
    },
  });

  const changeTagMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.changeTagsTelesales(body);
      return data;
    },
  });

  const changeTagsTelesales = ({ ID, Status }) =>
    new Promise(async (resolve, reject) => {
      let obj = null;
      if (
        Status === "KHACH_KHONG_DEN" &&
        Brand?.Global?.Admin?.kpiCancelFinish
      ) {
        obj = {
          BookId: ID,
          Status: Brand?.Global?.Admin?.kpiCancelFinish,
        };
      }
      if (Status === "KHACH_DEN" && Brand?.Global?.Admin?.kpiFinish) {
        obj = {
          BookId: ID,
          Status: Brand?.Global?.Admin?.kpiFinish,
        };
      }
      if (Status === "TU_CHOI" && Brand?.Global?.Admin?.kpiCancel) {
        obj = {
          BookId: ID,
          Status: Brand?.Global?.Admin?.kpiCancel,
        };
      }
      if (obj) {
        let rs = changeTagMutation.mutate(
          {
            Token: Auth?.token,
            data: {
              update: [obj],
            },
          },
          {
            onSuccess: () => resolve(rs),
          }
        );
      } else {
        resolve();
      }
    });

  const onSubmit = async (values) => {
    let obj = getQueryPost(values, Auth);

    if (values.ID) {
      await changeTagsTelesales(obj);
    }
    addMutation.mutate(
      {
        data: {
          booking: [obj],
        },
        Token: Auth?.token,
        CrStockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          window?.noti27?.TIN_NHAN &&
            window?.noti27?.TIN_NHAN({
              type: values.ID ? "UPDATE_BOOK_POS" : "ADD_BOOK_POS",
              data: obj,
            });
          toast.success("Lịch đã được đặt thành công.");
          f7router.back();
        },
      }
    );
  };

  const onChangeStatus = async (Status) => {
    let values = watch();
    let obj = getQueryPost(
      {
        ...values,
        Status: Status,
      },
      Auth
    );

    if (values.ID) {
      await changeTagsTelesales(obj);
    }

    changeMutation.mutate(
      {
        data: {
          booking: [obj],
        },
        Token: Auth?.token,
        CrStockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          window?.noti27?.TIN_NHAN &&
            window?.noti27?.TIN_NHAN({ type: "UPDATE_BOOK_POS", data: obj });
          toast.success("Lịch đã được cập nhật thành công.");
          f7router.back();
        },
      }
    );
  };

  const onCheckIn = async () => {
    let values = watch();
    let obj = getQueryPost(
      {
        ...values,
        Status: "KHACH_DEN",
      },
      Auth
    );

    if (values.ID) {
      await changeTagsTelesales(obj);
    }

    let dataCheckin = new FormData();
    dataCheckin.append("cmd", "checkin");
    dataCheckin.append("mid", obj.MemberID);
    dataCheckin.append("desc", "");

    checkinMutation.mutate(
      {
        data: {
          booking: [obj],
        },
        CheckIn: dataCheckin,
        Token: Auth?.token,
        CrStockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          window?.noti27?.TIN_NHAN &&
            window?.noti27?.TIN_NHAN({ type: "UPDATE_BOOK_POS", data: obj });
          toast.success("Xác nhận khách đến thành công.");
          f7router.back();
          //f7.views.main.router.navigate("/admin/pos/calendar/");
        },
      }
    );
  };

  const getStatusClass = (Status) => {
    const isAuto = Desc && Desc.toUpperCase().indexOf("TỰ ĐỘNG ĐẶT LỊCH");

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
      name="add-edit-calendar"
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
          {isAddMode ? "Đặt lịch dịch vụ" : "Chỉnh sửa đặt lịch"}
        </NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form
        className="flex flex-col h-full pb-safe-b"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="p-4 overflow-auto grow page-scrollbar">
          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Khách hàng</div>
            <Controller
              name="MemberID"
              control={control}
              render={({ field, fieldState }) => (
                <SelectBookingClients
                  ref={memberRef}
                  placeholderInput="Tên khách hàng"
                  placeholder="Chọn khách hàng"
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  value={field.value}
                  label="Chọn khách hàng"
                  onChange={(val) => {
                    field.onChange(val || null);
                    setValue("FullName", "");
                    setValue("Phone", "");
                  }}
                  isFilter
                />
              )}
            />
          </div>
          {MemberID && (
            <div className="grid grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <div className="mb-px">Tên khách hàng</div>
                {MemberID?.label === "Khách vãng lai" && (
                  <Controller
                    name="FullName"
                    control={control}
                    render={({ field: { ref, ...field }, fieldState }) => (
                      <Input
                        clearButton
                        className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                        type="input"
                        placeholder="Nhập tên khách"
                        value={field.value}
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                        onInput={field.onChange}
                        onFocus={(e) =>
                          KeyboardsHelper.setAndroid({
                            Type: "body",
                            Event: e,
                          })
                        }
                      />
                    )}
                  />
                )}
                {MemberID?.label !== "Khách vãng lai" && (
                  <div
                    className="relative"
                    onClick={() =>
                      f7router.navigate(
                        `/admin/pos/manage/${
                          MemberID?.ID
                        }/?state=${JSON.stringify({
                          MobilePhone:
                            MemberID?.MobilePhone || MemberID?.suffix,
                          FullName: MemberID?.FullName || MemberID?.label,
                        })}`
                      )
                    }
                  >
                    <Input
                      className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                      type="input"
                      placeholder="Nhập tên khách"
                      value={MemberID?.label}
                      readonly
                      disabled
                    />
                    <div className="absolute top-0 left-0 w-full h-full"></div>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-px">Số điện thoại</div>
                {MemberID?.label === "Khách vãng lai" && (
                  <Controller
                    name="Phone"
                    control={control}
                    render={({ field: { ref, ...field }, fieldState }) => (
                      <Input
                        clearButton
                        className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                        type="number"
                        placeholder="Nhập số điện thoại"
                        value={field.value}
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                        onInput={field.onChange}
                        onFocus={(e) =>
                          KeyboardsHelper.setAndroid({
                            Type: "body",
                            Event: e,
                          })
                        }
                      />
                    )}
                  />
                )}
                {MemberID?.label !== "Khách vãng lai" && (
                  <div
                    className="relative"
                    onClick={() =>
                      f7router.navigate(
                        `/admin/pos/manage/${
                          MemberID?.ID
                        }/?state=${JSON.stringify({
                          MobilePhone:
                            MemberID?.MobilePhone || MemberID?.suffix,
                          FullName: MemberID?.FullName || MemberID?.label,
                        })}`
                      )
                    }
                  >
                    <Input
                      className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                      type="input"
                      placeholder="Nhập số điện thoại"
                      value={MemberID?.suffix}
                      readonly
                      disabled
                    />
                    <div className="absolute top-0 left-0 w-full h-full"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Thời gian</div>
            <Controller
              name="BookDate"
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <DatePicker
                  format="HH:mm DD-MM-YYYY"
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn thời gian"
                  showHeader
                  minDate={new Date()}
                />
              )}
            />
          </div>
          {!isAddMode && (
            <div className="mb-3.5 last:mb-0">
              <div className="mb-px">Trạng thái</div>
              <Controller
                name="Status"
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <Controller
                    name="Status"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectPicker
                        isClearable={false}
                        placeholder="Chọn trạng thái"
                        value={
                          field.value
                            ? OptionsStatus.map((x) => {
                                let obj = { ...x };
                                if (
                                  Desc &&
                                  Desc.toUpperCase().indexOf(
                                    "TỰ ĐỘNG ĐẶT LỊCH"
                                  ) > -1
                                ) {
                                  if (obj.value === "XAC_NHAN") {
                                    obj.label = "Đặt lịch dự kiến";
                                  }
                                }
                                return obj;
                              }).filter((x) => x.value === field.value)[0]
                            : null
                        }
                        options={OptionsStatus.map((x) => {
                          let obj = { ...x };
                          if (
                            Desc &&
                            Desc.toUpperCase().indexOf("TỰ ĐỘNG ĐẶT LỊCH") > -1
                          ) {
                            if (obj.value === "XAC_NHAN") {
                              obj.label = "Đặt lịch dự kiến";
                            }
                          }
                          return obj;
                        })}
                        label="Trạng thái"
                        onChange={(val) => {
                          field.onChange(val?.value || null);
                        }}
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                      />
                    )}
                  />
                  // <Input
                  //   //clearButton
                  //   className={clsx(
                  //     "[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case text-danger [&_input]:font-medium",
                  //     "text-" + getStatusClass(field.value).Color
                  //   )}
                  //   type="input"
                  //   placeholder="Nhập trạng thái"
                  //   value={getStatusClass(field.value).Text}
                  //   errorMessage={fieldState?.error?.message}
                  //   errorMessageForce={fieldState?.invalid}
                  //   onInput={field.onChange}
                  //   onFocus={(e) =>
                  //     KeyboardsHelper.setAndroid({
                  //       Type: "body",
                  //       Event: e,
                  //     })
                  //   }
                  //   //readonly
                  //   //disabled
                  // />
                )}
              />
            </div>
          )}

          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Cơ sở</div>
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
                  }}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                />
              )}
            />
          </div>
          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Dịch vụ</div>
            <Controller
              name="RootIdS"
              control={control}
              render={({ field, fieldState }) => (
                <SelectServiceRoots
                  placeholderInput="Tên dịch vụ"
                  placeholder="Chọn dịch vụ"
                  value={field.value}
                  label="Chọn dịch vụ"
                  onChange={(val) => {
                    field.onChange(val);
                  }}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  isFilter
                  isMulti
                />
              )}
            />
          </div>
          {Brand?.Global?.APP?.Booking?.AtHome && (
            <div className="flex items-end justify-between mb-3.5 last:mb-0">
              <div>Sử dụng dịch vụ tại nhà</div>
              <Controller
                name="AtHome"
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...field}
                      checked={field.value}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                )}
              />
            </div>
          )}

          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Nhân viên thực hiện</div>
            <Controller
              name="UserServiceIDs"
              control={control}
              render={({ field, fieldState }) => (
                <SelectMembersServices
                  isMulti
                  isRequired={false}
                  placeholderInput="Tên nhân viên"
                  placeholder="Chọn nhân viên"
                  value={field.value}
                  label="Chọn nhân viên"
                  onChange={(val) => {
                    field.onChange(val);
                  }}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  isFilter
                />
              )}
            />
          </div>

          {Brand?.Global?.Admin?.isRooms &&
            RoomsList &&
            RoomsList.length > 0 && (
              <div className="mb-3.5 last:mb-0">
                <div className="mb-px">Giường</div>
                <Controller
                  name="TreatmentJson"
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
          {Brand?.Global?.APP?.SL_khach && (
            <div className="mb-3.5 last:mb-0">
              <div className="mb-px">Số lượng khách</div>
              <Controller
                name="AmountPeople"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectPicker
                    placeholder="Chọn số lượng"
                    value={field.value}
                    options={Array(9)
                      .fill()
                      .map((_, index) => ({
                        value: index + 1,
                        label: index + 1 + " khách",
                      }))}
                    label="Số lượng khách"
                    onChange={(val) => {
                      field.onChange(val);
                    }}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    isClearable={false}
                  />
                )}
              />
            </div>
          )}

          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Tags</div>
            <Controller
              name="Tags"
              control={control}
              render={({ field, fieldState }) => (
                <SelectPicker
                  placeholder="Chọn tags"
                  value={field.value}
                  options={
                    SettingCalendar?.data?.Tags
                      ? SettingCalendar?.data?.Tags.split(",").map((x) => ({
                          label: x,
                          value: x,
                        }))
                      : []
                  }
                  label="Tags"
                  onChange={(val) => {
                    field.onChange(val);
                  }}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  isMulti
                />
              )}
            />
          </div>
          <div className="mb-3.5 last:mb-0">
            <div className="mb-px font-light">Ghi chú</div>
            <Controller
              name="Desc"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case"
                  type="textarea"
                  placeholder="Nhập ghi chú"
                  value={field.value}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  onInput={field.onChange}
                  onFocus={(e) =>
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                  }
                  resizable
                />
              )}
            />
          </div>
        </div>
        {Status !== "CHUA_XAC_NHAN" && (
          <div className="p-4">
            {isAddMode && (
              <Button
                type="submit"
                className="rounded-full bg-app"
                fill
                large
                preloader
                loading={addMutation.isLoading}
                disabled={addMutation.isLoading}
              >
                Đặt lịch ngay
              </Button>
            )}

            {!isAddMode && (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className={clsx(
                    "bg-app",
                    Status === "KHACH_DEN" && "rounded-full"
                  )}
                  fill
                  large
                  preloader
                  loading={addMutation.isLoading}
                  disabled={addMutation.isLoading}
                >
                  {Status === "CHUA_XAC_NHAN" ? "Xác nhận" : "Cập nhật"}
                </Button>
                {Status === "CHUA_XAC_NHAN" ? (
                  <>
                    <Button
                      type="button"
                      className="bg-danger max-w-[110px]"
                      fill
                      large
                      preloader
                      loading={changeMutation.isLoading}
                      disabled={changeMutation.isLoading}
                      onClick={() => onChangeStatus("KHACH_KHONG_DEN")}
                    >
                      Huỷ lịch
                    </Button>
                  </>
                ) : (
                  <>
                    {Status !== "KHACH_DEN" && (
                      <>
                        <Button
                          popoverOpen=".popover-booking-status"
                          type="button"
                          className="bg-danger max-w-[80px]"
                          fill
                          large
                          preloader
                          loading={changeMutation.isLoading}
                          disabled={changeMutation.isLoading}
                        >
                          Huỷ <ChevronUpIcon className="w-5 ml-1" />
                        </Button>
                        <Popover className="popover-booking-status">
                          <div className="flex flex-col py-1 text-center">
                            <Link
                              popoverClose
                              className="py-3 font-medium border-b last:border-0"
                              noLinkClass
                              onClick={() => onChangeStatus("KHACH_KHONG_DEN")}
                            >
                              Khách không đến
                            </Link>
                            <Link
                              popoverClose
                              className="py-3 font-medium border-b last:border-0 text-danger"
                              noLinkClass
                              onClick={() => onChangeStatus("TU_CHOI")}
                            >
                              Khách huỷ lịch
                            </Link>
                          </div>
                        </Popover>
                        <Button
                          type="button"
                          className="bg-primary"
                          fill
                          large
                          preloader
                          loading={checkinMutation.isLoading}
                          disabled={checkinMutation.isLoading}
                          onClick={onCheckIn}
                        >
                          Khách đến
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </Page>
  );
}

export default AddEditCalendar;

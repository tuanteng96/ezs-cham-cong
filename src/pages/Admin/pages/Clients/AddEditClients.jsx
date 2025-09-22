import PromHelpers from "@/helpers/PromHelpers";
import {
  ChevronLeftIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  SelectClients,
  SelectDistricts,
  SelectGender,
  SelectMembersCharge,
  SelectProvinces,
} from "@/partials/forms/select";
import { DatePicker, SelectPicker } from "@/partials/forms";
import { useMutation, useQuery, useQueryClient } from "react-query";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import moment from "moment";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import {
  ClientFieldPhone,
  PickerHistoryAff,
  PickerShowPass,
} from "./components";
import clsx from "clsx";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { UploadImages } from "@/partials/forms/files";
import { MinusCircleIcon } from "@heroicons/react/24/outline";
import { Disclosure } from "@/partials/components";

const initialValues = {
  InputGroups: "",
  Desc: "",
  ID: 0,
  FullName: "",
  MobilePhone: "",
  FixedPhone: "",
  Email: "",
  HomeAddress: "",
  DistrictID: "",
  ProvinceID: "",
  Jobs: "",
  Gender: 0,
  Photo: "",
  ByStockID: "",
  ByUserID: "",
  HandCardID: "",
  Source: "",
  Book: { Desc: "" },
  Birth: "",
  IsKeepGroup: false,
  AFFMemberID: "",
};

const schemaAdd = yup
  .object({
    FullName: yup.string().required("Vui lòng nhập họ tên."),
  })
  .required();

function AddEditClients({ f7router, f7route }) {
  const queryClient = useQueryClient();

  let isAddMode = f7route?.params?.id === "add";

  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const { pos_mng } = RolesHelpers.useRoles({
    nameRoles: ["pos_mng"],
    auth: Auth,
    CrStocks,
  });

  const methods = useForm({
    defaultValues: {
      ...initialValues,
      ByStockID: CrStocks
        ? {
            ...CrStocks,
            label: CrStocks?.Title,
            value: CrStocks?.ID,
          }
        : "",
      Gender: Brand?.Global?.Admin?.thong_tin_bat_buoc_nhap_them_khach_hang
        ? ""
        : 0,
    },
    resolver: yupResolver(schemaAdd),
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = methods;

  const {
    isLoading,
    data: Member,
    refetch,
  } = useQuery({
    queryKey: ["memberSearchID", { Key: f7route?.params?.id }],
    queryFn: async () => {
      let data = await AdminAPI.clientsId({
        pi: 1,
        ps: 1,
        Token: Auth.token,
        Key: "#" + f7route?.params?.id,
      });
      return data?.data?.data && data?.data?.data.length > 0
        ? data?.data?.data[0]
        : null;
    },
    onSuccess: (data) => {
      if (data) {
        let initialValues = data;

        reset({
          ...initialValues,
          Book: initialValues?.BookInfo
            ? JSON.parse(initialValues?.BookInfo)
            : { Desc: "" },
          Birth: initialValues.Birth
            ? moment(initialValues.Birth, "YYYY-MM-DD HH:mm").toDate()
            : "",
          DistrictID:
            initialValues?.DistrictJSON && initialValues?.DistrictJSON?.Title
              ? {
                  ...initialValues?.DistrictJSON,
                  value: initialValues?.DistrictJSON?.ID,
                  label: initialValues?.DistrictJSON?.Title,
                }
              : "",
          ProvinceID:
            initialValues?.ProvinceJSON && initialValues?.ProvinceJSON?.Title
              ? {
                  ...initialValues?.ProvinceJSON,
                  value: initialValues?.ProvinceJSON?.ID,
                  label: initialValues?.ProvinceJSON?.Title,
                }
              : "",
          ByStockID: initialValues?.Stock
            ? {
                ...initialValues?.Stock,
                value: initialValues?.Stock?.ID,
                label: initialValues?.Stock?.Title,
              }
            : "",
          ByUserID: initialValues?.ByUserJSON?.ID
            ? {
                ...initialValues?.ByUserJSON,
                value: initialValues?.ByUserJSON?.ID,
                label: initialValues?.ByUserJSON?.FullName,
              }
            : "",
          InputGroups: initialValues?.GroupJSON
            ? initialValues?.GroupJSON.map((x) => ({
                ...x,
                label: x.Title,
                value: x.ID,
              }))[0]
            : "",
          AFFMemberID: initialValues?.AFFMemberID
            ? {
                label: JSON.parse(initialValues?.AFFJSON)?.Name,
                value: JSON.parse(initialValues?.AFFJSON)?.MID,
              }
            : "",
        });
      } else {
        toast.warning("Không tìm thấy khách hàng");
      }
    },
    enabled: f7route?.params?.id !== "add",
  });

  const dataAdd = useQuery({
    queryKey: ["memberDataAdd"],
    queryFn: async () => {
      const data = await AdminAPI.memberDataAdd();
      return data?.data
        ? {
            ...data?.data,
            MemberGroups: data?.data.MemberGroups.map((x) => ({
              ...x,
              value: x.ID,
              label: x.Title,
            })),
            Sources: data?.data.Sources.map((x) => ({
              ...x,
              value: x.text,
              label: x.text,
            })),
            Jobs: data?.data.Jobs.map((x) => ({
              ...x,
              value: x.text,
              label: x.text,
            })),
          }
        : {
            MemberGroups: [],
            Jobs: [],
            Sources: [],
          };
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addEditClients(body);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsResetPwd(body);
      return data;
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsDeleteDevice(body);
      await refetch();
      return data;
    },
  });

  const ChangePassword = (open) => {
    f7.dialog.confirm(
      "Bạn đang thực hiện reset mật khẩu cho khách hàng " + watch().FullName,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");

        var bodyFormData = new FormData();
        bodyFormData.append("cmd", "setpwd_member");
        bodyFormData.append("MemberID", f7route?.params?.id);
        resetMutation.mutate(
          { data: bodyFormData, Token: Auth?.token },
          {
            onSuccess: ({ data }) => {
              f7.dialog.close();
              if (data?.newpass) {
                open(data?.newpass);
              } else {
                toast.error("Xảy ra lỗi.");
              }
            },
          }
        );
      }
    );
  };

  const onDeleteDevice = () => {
    f7.dialog.confirm(
      "Bạn đang thực xoá mã máy đăng nhập cho khách hàng " + watch().FullName,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");

        deleteDeviceMutation.mutate(
          {
            data: {
              MemberID: f7route?.params?.id,
            },
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              toast.success("Xoá mã máy thành công.");
              f7.dialog.close();
            },
          }
        );
      }
    );
  };

  const onSubmit = (values) => {
    const newValues = {
      ...values,
      Birth: values.Birth ? moment(values.Birth).format("DD/MM/YYYY") : "",
      ByStockID: values?.ByStockID?.value || "",
      ByUserID: values?.ByUserID?.value || "",
      DistrictID: values?.DistrictID?.value || "",
      InputGroups: values?.InputGroups?.value || "",
      ProvinceID: values?.ProvinceID?.value || "",
      AFFMemberID: values?.AFFMemberID?.value || "",
    };

    let hasErrors = false;

    if (Brand?.Global?.Admin?.thong_tin_bat_buoc_nhap_them_khach_hang) {
      for (let key of Brand?.Global?.Admin?.thong_tin_bat_buoc_nhap_them_khach_hang.split(
        ","
      )) {
        if (typeof newValues[key] !== "undefined" && newValues[key] === "") {
          setError(key, {
            type: "Client",
            message: "Trường không được bỏ trống",
          });

          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      toast.error("Vui lòng nhập đầy đủ thông tin khách hàng.");
      return;
    }

    addMutation.mutate(
      {
        data: {
          member: newValues,
        },
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.error) {
            if (data.error.includes("Số điện thoại")) {
              setError("MobilePhone", {
                type: "Server",
                message: "Số điện thoại không hợp lệ hoặc đã sử dụng",
              });
            } else if (data.error.includes("Email sai định dạng")) {
              setError("Email", {
                type: "Server",
                message: "Email không hợp lệ hoặc đã sử dụng",
              });
            } else {
              toast.error(data?.error);
            }
          } else {
            toast.success(
              isAddMode
                ? "Tạo mới khách hàng thành công."
                : "Cập nhật khách hàng thành công."
            );
            reset();
            if (isAddMode) {
              const router = f7.views.main.router;

              const handler = () => {
                router.off("routeChanged", handler);
                router.navigate(
                  `/admin/pos/manage/${data?.Member?.ID}/add-prods`
                );
              };

              router.on("routeChanged", handler);
              router.navigate(
                `/admin/pos/manage/${data?.Member?.ID}/?state=${JSON.stringify({
                  MobilePhone: data?.Member?.MobilePhone,
                  FullName: data?.Member?.FullName,
                })}&add=prods`,
                {
                  replaceState: true, // 🔹 không thêm entry mới vào lịch sử
                }
              );

              // f7router.navigate(
              //   `/admin/pos/manage/${data?.Member?.ID}/?state=${JSON.stringify({
              //     MobilePhone: data?.Member?.MobilePhone,
              //     FullName: data?.Member?.FullName,
              //   })}`
              // );
            } else {
              f7router.back();
            }
            document.body.click();
          }
        },
      }
    );
  };

  let {
    ProvinceID,
    DistrictID,
    HomeAddress,
    HandCardID,
    Email,
    InputGroups,
    AFFMemberID,
    Book,
    Desc,
  } = watch();

  let HistoryEditAff = Member?.AFFJSON && JSON.parse(Member?.AFFJSON);

  return (
    <Page
      className="bg-[var(--f7-page-bg-color)]"
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
          {isAddMode ? "Tạo mới khách hàng" : "Chỉnh sửa khách hàng"}
        </NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          className="relative flex flex-col h-full pb-safe-b"
          onSubmit={handleSubmit(onSubmit)}
        >
          {(isAddMode || !isLoading) && (
            <div className="relative p-4 overflow-auto grow page-scrollbar">
              <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Ảnh khách hàng</div>
                  <Controller
                    name="Photo"
                    control={control}
                    render={({ field, fieldState }) => (
                      <UploadImages
                        width="w-[120px]"
                        height="h-[120px]"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                </div>
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Họ và tên</div>
                  <Controller
                    name="FullName"
                    control={control}
                    render={({ field: { ref, ...field }, fieldState }) => (
                      <Input
                        clearButton
                        className="[&_input]:rounded [&_input]:placeholder:normal-case"
                        type="text"
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
                        enterkeyhint="next"
                      />
                    )}
                  />
                </div>
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Số điện thoại</div>
                  <ClientFieldPhone isAddMode={isAddMode} />
                </div>
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Ngày sinh</div>
                  <Controller
                    name="Birth"
                    control={control}
                    render={({ field: { ref, ...field }, fieldState }) => (
                      <DatePicker
                        format="DD/MM/YYYY"
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Chọn ngày"
                        showHeader
                        clear
                        disabled={
                          !isAddMode &&
                          Brand?.Global?.Admin
                            ?.chi_admin_chinh_sua_khach_hang === "Birth" &&
                          Auth?.ID !== 1
                        }
                      />
                    )}
                  />
                </div>
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Giới tính</div>
                  <Controller
                    name="Gender"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <SelectGender
                          placeholder="Chọn giới tính"
                          value={field.value}
                          label="Số giới tính"
                          onChange={(val) => {
                            field.onChange(val?.value !== "" ? val?.value : "");
                          }}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          isClearable={false}
                          autoHeight
                        />
                      </>
                    )}
                  />
                </div>
              </div>
              <Disclosure initialState={Boolean(HandCardID)}>
                {({ isOpen, toggle }) => (
                  <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
                    {!isOpen && (
                      <div
                        className="font-medium text-primary"
                        onClick={toggle}
                      >
                        {HandCardID
                          ? "Thay đổi thành viên"
                          : "Thêm mã thành viên"}
                      </div>
                    )}

                    {isOpen && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>Mã thành viên</div>
                          <div onClick={toggle}>
                            <MinusCircleIcon className="w-6" />
                          </div>
                        </div>
                        <Controller
                          name="HandCardID"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <Input
                              clearButton
                              className="[&_input]:rounded [&_input]:placeholder:normal-case"
                              type="input"
                              placeholder="Nhập mã thành viên"
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
                      </div>
                    )}
                  </div>
                )}
              </Disclosure>

              <Disclosure initialState={Boolean(Email)}>
                {({ isOpen, toggle }) => (
                  <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
                    {!isOpen && (
                      <div
                        className="font-medium text-primary"
                        onClick={toggle}
                      >
                        {Email ? "Thay đổi Email" : "Thêm Email"}
                      </div>
                    )}

                    {isOpen && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>Email</div>
                          <div onClick={toggle}>
                            <MinusCircleIcon className="w-6" />
                          </div>
                        </div>
                        <Controller
                          name="Email"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <Input
                              clearButton
                              className="[&_input]:rounded [&_input]:placeholder:normal-case"
                              type="input"
                              placeholder="Nhập Email"
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
                      </div>
                    )}
                  </div>
                )}
              </Disclosure>

              <Disclosure
                initialState={Boolean(ProvinceID || DistrictID || HomeAddress)}
              >
                {({ isOpen, toggle }) => (
                  <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
                    {!isOpen && (
                      <div
                        className="font-medium text-primary"
                        onClick={toggle}
                      >
                        {ProvinceID || DistrictID || HomeAddress
                          ? "Thay đổi địa chỉ"
                          : "Thêm địa chỉ"}
                      </div>
                    )}

                    {isOpen && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>Địa chỉ</div>
                          <div onClick={toggle}>
                            <MinusCircleIcon className="w-6" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-3 last:mb-0">
                            <Controller
                              name="ProvinceID"
                              control={control}
                              render={({ field, fieldState }) => (
                                <SelectProvinces
                                  placeholderInput="Tên tỉnh / thành phố"
                                  placeholder="Chọn tỉnh / thành phố"
                                  value={field.value}
                                  label="Chọn tỉnh / thành phố"
                                  onChange={(val) => {
                                    setValue("DistrictID", "");
                                    field.onChange(val);
                                  }}
                                  errorMessage={fieldState?.error?.message}
                                  errorMessageForce={fieldState?.invalid}
                                  isFilter
                                />
                              )}
                            />
                          </div>
                          <div className="mb-3 last:mb-0">
                            <Controller
                              name="DistrictID"
                              control={control}
                              render={({ field, fieldState }) => (
                                <SelectDistricts
                                  ProvinceID={ProvinceID?.value || ""}
                                  placeholderInput="Tên Quận / Huyện"
                                  placeholder="Chọn Quận / Huyện"
                                  value={field.value}
                                  label="Chọn Quận / Huyện"
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
                          <div className="mb-3 last:mb-0">
                            <Controller
                              name="HomeAddress"
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <Input
                                  clearButton
                                  className="[&_input]:rounded [&_input]:placeholder:normal-case"
                                  type="input"
                                  placeholder="Nhập địa chỉ"
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
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Disclosure>

              <div className="mb-3.5 last:mb-3.5 bg-white rounded-lg p-4">
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Cơ sở</div>
                  <Controller
                    name="ByStockID"
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
                  <div className="mb-px">Nhân viên phụ trách</div>
                  <Controller
                    name="ByUserID"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectMembersCharge
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
                        //isMulti
                      />
                    )}
                  />
                </div>
              </div>
              <div className="mb-3.5 last:mb-3.5 bg-white rounded-lg p-4">
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Nguồn</div>
                  <Controller
                    name="Source"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectPicker
                        placeholder="Chọn nguồn"
                        value={
                          dataAdd?.data?.Sources?.filter(
                            (x) => x.value === field.value
                          ) || null
                        }
                        options={dataAdd?.data?.Sources || []}
                        label="Nguồn khách hàng"
                        onChange={(val) => {
                          field.onChange(val?.value || "");
                        }}
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                        autoHeight
                      />
                    )}
                  />
                </div>
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Nghề nghiệp</div>
                  <Controller
                    name="Jobs"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectPicker
                        placeholder="Chọn nghề nghiệp"
                        value={
                          dataAdd?.data?.Jobs?.filter(
                            (x) => x.value === field.value
                          ) || null
                        }
                        options={dataAdd?.data?.Jobs || []}
                        label="Nghề nghiệp"
                        onChange={(val) => {
                          field.onChange(val?.value || "");
                        }}
                        errorMessage={fieldState?.error?.message}
                        errorMessageForce={fieldState?.invalid}
                        autoHeight
                      />
                    )}
                  />
                </div>
              </div>

              <Disclosure initialState={Boolean(InputGroups)}>
                {({ isOpen, toggle }) => (
                  <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
                    {!isOpen && (
                      <div
                        className="font-medium text-primary"
                        onClick={toggle}
                      >
                        {InputGroups
                          ? "Thay đổi nhóm thành viên"
                          : "Thêm nhóm thành viên"}
                      </div>
                    )}

                    {isOpen && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>Nhóm thành viên</div>
                          <div onClick={toggle}>
                            <MinusCircleIcon className="w-6" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-3.5 last:mb-0">
                            <Controller
                              name="InputGroups"
                              control={control}
                              render={({ field, fieldState }) => (
                                <SelectPicker
                                  placeholder="Chọn nhóm"
                                  value={field.value}
                                  options={dataAdd?.data?.MemberGroups || []}
                                  label="Nhóm thành viên"
                                  onChange={(val) => {
                                    field.onChange(val);
                                  }}
                                  errorMessage={fieldState?.error?.message}
                                  errorMessageForce={fieldState?.invalid}
                                  autoHeight
                                />
                              )}
                            />
                          </div>
                          <div className="flex items-end justify-between mb-3.5 last:mb-0">
                            <div>Giữ nhóm không bị hạ cấp</div>
                            <Controller
                              name="IsKeepGroup"
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
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
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Disclosure>

              <Disclosure initialState={Boolean(Desc || Book.Desc)}>
                {({ isOpen, toggle }) => (
                  <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
                    {!isOpen && (
                      <div
                        className="font-medium text-primary"
                        onClick={toggle}
                      >
                        {Desc || Book.Desc
                          ? "Thay đổi ghi chú"
                          : "Thêm ghi chú"}
                      </div>
                    )}
                    {isOpen && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>Ghi chú</div>
                          <div onClick={toggle}>
                            <MinusCircleIcon className="w-6" />
                          </div>
                        </div>
                        <div className="mb-3.5 last:mb-0">
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
                                  KeyboardsHelper.setAndroid({
                                    Type: "body",
                                    Event: e,
                                  })
                                }
                                resizable
                              />
                            )}
                          />
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Ghi chú lịch trình</div>
                          <Controller
                            name="Book.Desc"
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
                                  KeyboardsHelper.setAndroid({
                                    Type: "body",
                                    Event: e,
                                  })
                                }
                                resizable
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Disclosure>
              {Brand?.Global?.Admin?.maff && (
                <Disclosure initialState={Boolean(AFFMemberID)}>
                  {({ isOpen, toggle }) => (
                    <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
                      {!isOpen && (
                        <div
                          className="font-medium text-primary"
                          onClick={toggle}
                        >
                          {AFFMemberID
                            ? "Thay đổi khách hàng giới thiệu"
                            : "Thêm khách hàng giới thiệu"}
                        </div>
                      )}

                      {isOpen && (
                        <div>
                          <PickerHistoryAff data={HistoryEditAff}>
                            {({ open }) => (
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className="flex gap-1"
                                  onClick={() => HistoryEditAff && open()}
                                >
                                  Khách hàng giới thiệu
                                  {HistoryEditAff && (
                                    <ExclamationCircleIcon className="w-5 text-warning" />
                                  )}
                                </div>
                                <div onClick={toggle}>
                                  <MinusCircleIcon className="w-6" />
                                </div>
                              </div>
                            )}
                          </PickerHistoryAff>
                          <div>
                            <Controller
                              name="AFFMemberID"
                              control={control}
                              render={({ field, fieldState }) => (
                                <SelectClients
                                  placeholderInput="Tên khách hàng"
                                  placeholder="Chọn khách hàng"
                                  value={field.value}
                                  label="Chọn khách hàng"
                                  onChange={(val) => {
                                    field.onChange(val);
                                  }}
                                  isFilter
                                  isClearable={true}
                                  isDisabled={
                                    Brand?.Global?.Admin?.maffadmin
                                      ? Auth?.ID !== 1
                                      : Brand?.Global?.Admin?.maffadmin
                                  }
                                />
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Disclosure>
              )}
            </div>
          )}
          {!isAddMode && isLoading && (
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
                Thêm mới
              </Button>
            )}
            {!isAddMode && (
              <div className="flex gap-2">
                {Brand?.Global?.APP?.DeviceCheck && Member?.DeviceIDs && (
                  <Button
                    type="button"
                    className="bg-danger w-[130px]"
                    fill
                    large
                    preloader
                    loading={deleteDeviceMutation.isLoading}
                    disabled={deleteDeviceMutation.isLoading}
                    onClick={() => onDeleteDevice()}
                  >
                    Xoá mã máy
                  </Button>
                )}

                <PickerShowPass>
                  {({ open }) => (
                    <Button
                      type="button"
                      className="bg-primary w-14"
                      fill
                      large
                      preloader
                      loading={resetMutation.isLoading}
                      disabled={resetMutation.isLoading}
                      onClick={() => ChangePassword(open)}
                    >
                      <LockClosedIcon className="w-6" />
                    </Button>
                  )}
                </PickerShowPass>

                <Button
                  type="submit"
                  className="flex-1 bg-app"
                  fill
                  large
                  preloader
                  loading={addMutation.isLoading}
                  disabled={
                    addMutation.isLoading ||
                    (Brand?.Global?.Admin?.admin_chinh_sua_thong_tin &&
                      Auth?.ID !== 1)
                  }
                >
                  Cập nhật
                </Button>
              </div>
            )}
          </div>
        </form>
      </FormProvider>
    </Page>
  );
}

export default AddEditClients;

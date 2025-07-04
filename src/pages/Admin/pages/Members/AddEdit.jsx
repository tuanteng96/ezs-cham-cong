import React, { useRef, useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  Button,
  f7,
  Input,
  Link,
  Navbar,
  NavLeft,
  NavTitle,
  Page,
  useStore,
} from "framework7-react";
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import clsx from "clsx";
import { PickerShare } from "./components";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { UploadImages } from "@/partials/forms/files";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import { SelectPicker } from "@/partials/forms";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import {
  SelectGroupRoles,
  SelectUserLevels,
  SelectUserShifts,
} from "@/partials/forms/select";
import { NumericFormat } from "react-number-format";
import { useDebounceKey } from "@/hooks";

const schemaAddEdit = yup
  .object({
    fn: yup.string().required("Vui lòng nhập tên"),
    GroupIDs: yup
      .array()
      .min(1, "Vui lòng chọn vai trò")
      .required("Vui lòng chọn vai trò"),
  })
  .required();

function MembersAdminAddEdit({ f7route, f7router }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");
  let StocksAll = useStore("StocksAll");

  const { usrmng, csluong_bangluong, cong_ca } = RolesHelpers.useRoles({
    nameRoles: ["usrmng", "csluong_bangluong", "cong_ca"],
    auth: Auth,
    CrStocks,
  });

  let id = f7route.params?.id || null;

  const queryClient = useQueryClient();

  const [suggestLoading, setSuggestLoading] = useState(false);
  const [isEditPwd, setIsEditPwd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["MembersListEdit", id],
    queryFn: async () => {
      const { data } = await AdminAPI.listMembers({
        data: {
          Key: f7route?.query?.UserName,
          Pi: 1,
          Ps: 50,
          GroupIDs: [],
          Levels: [],
          Status: [],
          StockIDs: [],
        },
        Token: Auth.token,
      });

      let { data: UserInfo } = await AdminAPI.userInfoId({
        data: { UserID: id },
        Token: Auth.token,
      });

      let rs = null;
      if (data.Items && data.Items.length > 0) {
        let index = data.Items.findIndex((x) => x.ID === Number(id));
        if (index > -1) rs = data.Items[index];
      }
      return rs
        ? { ...rs, salaryConfig: UserInfo?.salaryConfig, User: UserInfo?.User }
        : null;
    },
    onSuccess: (rs) => {
      if (!rs) {
        f7.dialog.alert("Không tìm thấy nhân viên này ?", () => {
          f7router.back();
        });
      } else {
        setValue("id", rs?.ID);
        setValue("Avatar", rs?.Avatar);
        setValue("fn", rs?.FullName);
        setValue("usn", rs?.UserName);

        let index = StocksAll?.findIndex((x) => x.ID === rs?.StockID);
        if (index > -1) {
          setValue("stockid", {
            ...StocksAll[index],
            label: StocksAll[index].Title,
            value: StocksAll[index].ID,
          });
        } else {
          setValue("stockid", null);
        }
        setValue("IsOPTLogin", rs?.IsOPTLogin);
        setValue("pwd", "");
        setValue(
          "GroupIDs",
          rs?.GroupList && rs?.GroupList.length > 0
            ? rs?.GroupList.map((x) => ({
                label: `${x.TitleStock || x.GroupTitle} - ${
                  x.StockTitle || "Hệ thống"
                }`,
                value: x.GroupID,
              }))
            : null
        );

        if (rs?.salaryConfig) {
          for (let key of rs?.salaryConfig) {
            if (key.Name === "LUONG") {
              setValue("LUONG", key.Value);
            }
            if (key.Name === "PHU_CAP") {
              setValue("PHU_CAP", key.Value);
            }
            if (key.Name === "GIU_LUONG") {
              setValue("GIU_LUONG", key.Value);
            }
            if (key.Name === "SO_THANG_GIU_LUONG") {
              setValue("SO_THANG_GIU_LUONG", key.Value);
            }
            if (key.Name === "TRO_CAP_NGAY") {
              setValue("TRO_CAP_NGAY", key.Value);
            }
            if (key.Name === "NGAY_NGHI") {
              setValue("LOAI_TINH_LUONG", key.Name);
              setValue("SO_NGAY", key.Value);
            }
            if (key.Name === "NGAY_CONG") {
              setValue("LOAI_TINH_LUONG", key.Name);
              setValue("SO_NGAY", key.Value);
            }
          }
        }

        if (rs?.User) {
          setValue("chluongLevels", rs?.User?.Level);

          let WorkTimeSetting = rs?.User?.WorkTimeSetting
            ? JSON.parse(rs?.User?.WorkTimeSetting)
            : null;

          setValue("chamcong.SalaryHours", WorkTimeSetting?.SalaryHours || "");
          setValue(
            `chamcong.ShiftID`,
            WorkTimeSetting?.ShiftID
              ? {
                  label: WorkTimeSetting?.ShiftName,
                  value: WorkTimeSetting?.ShiftID,
                }
              : null
          );
        }
      }
    },
    enabled: Boolean(id),
  });

  const methods = useForm({
    defaultValues: {
      Avatar: "",
      id: 0,
      fn: "",
      pwd: 1234,
      usn: "",
      chk: "",
      unchk: "",
      disabled: "",
      stockid: CrStocks
        ? {
            ...CrStocks,
            label: CrStocks?.Title,
            value: CrStocks.ID,
          }
        : null,
      IsOPTLogin: false,
      chamcong: {
        ShiftName: "",
        ShiftID: "",
        SalaryHours: "",
        UserID: 0,
      }, //[{"ShiftName":"Ca hành chính","ShiftID":"a05a7af3-fa5c-8510-66c8-851574b0e960","SalaryHours":1,"UserID":0}]
      chluongData: "", //[{"id":0,"StockID":0,"LUONG":6000000},{"id":0,"StockID":0,"PHU_CAP":300000},{"id":0,"StockID":0,"GIU_LUONG":10},{"id":0,"StockID":0,"SO_THANG_GIU_LUONG":8},{"id":0,"StockID":0,"NGAY_NGHI":4},{"id":0,"StockID":0,"TRO_CAP_NGAY":20000},{"id":0,"StockID":0,"NGAY_PHEP":2}]
      chluongLevels: "", // [{"id":0,"Level":"Thử việc"}]
      chluongGr: "",
      LUONG: "",
      PHU_CAP: "",
      GIU_LUONG: "",
      SO_THANG_GIU_LUONG: "",
      NGAY_NGHI: "",
      TRO_CAP_NGAY: "",
      NGAY_PHEP: "",
      LOAI_TINH_LUONG: "NGAY_CONG",
      SO_NGAY: "",
      GroupIDs: null,
    },
    resolver: yupResolver(schemaAddEdit),
  });

  const { control, handleSubmit, setValue, watch } = methods;

  const addEditMutation = useMutation({
    mutationFn: async ({ data, GroupIDs, Token }) => {
      let rs = await AdminAPI.addEditMembers({
        data: data,
        Token,
      });
      let rsRoles = await AdminAPI.updateMembers({
        data: {
          updates:
            GroupIDs.updates && GroupIDs.updates.length > 0
              ? GroupIDs.updates.map((x) => ({
                  ...x,
                  UserID: x.UserID || rs?.data?.data?.UserID,
                }))
              : null,
        },
        Token,
        StockID: CrStocks?.ID,
      });

      await queryClient.invalidateQueries({
        queryKey: ["MembersLists"],
      });
      return {
        rs,
        rsRoles,
      };
    },
  });

  const suggestMutation = useMutation({
    mutationFn: (body) => AdminAPI.suggestMemberUsename(body),
  });

  const debounce = useDebounceKey((e) => {
    var bodyFormData = new FormData();
    bodyFormData.append("fullname", e);

    suggestMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: (rs) => {
          console.log(rs);
          setValue("usn", rs?.data?.data || "");
          setSuggestLoading(false);
        },
      }
    );
  }, 500);

  const onSubmit = ({ values, open }) => {
    var bodyFormData = new FormData();
    bodyFormData.append("id", values?.id);
    bodyFormData.append("Avatar", values?.Avatar);
    bodyFormData.append("fn", values?.fn);
    bodyFormData.append("pwd", values?.pwd);
    bodyFormData.append("usn", values?.usn);
    bodyFormData.append("chk", "");
    bodyFormData.append("unchk", "");
    bodyFormData.append("stockid", values?.stockid?.value || "");
    bodyFormData.append("IsOPTLogin", values?.IsOPTLogin ? "1" : "0");
    bodyFormData.append("disabled", values?.disabled ? "1" : "0");
    bodyFormData.append(
      "chamcong",
      JSON.stringify([
        {
          ShiftName: values?.chamcong?.ShiftID?.label,
          ShiftID: values?.chamcong?.ShiftID?.value || "",
          SalaryHours: values?.chamcong?.SalaryHours || 0,
          UserID: 0,
        },
      ])
    );
    bodyFormData.append(
      "chluongLevels",
      JSON.stringify(
        values?.chluongLevels
          ? [{ id: values?.id || 0, Level: values?.chluongLevels || "" }]
          : []
      )
    );
    let newchluongData = [];
    if (values?.LUONG) {
      newchluongData.push({
        id: values?.id || 0,
        StockID: 0,
        LUONG: values?.LUONG,
      });
    }
    if (values?.PHU_CAP) {
      newchluongData.push({
        id: values?.id || 0,
        StockID: 0,
        PHU_CAP: values?.PHU_CAP,
      });
    }
    if (values?.GIU_LUONG) {
      newchluongData.push({
        id: values?.id || 0,
        StockID: 0,
        GIU_LUONG: values?.GIU_LUONG,
      });
    }
    if (values?.SO_THANG_GIU_LUONG) {
      newchluongData.push({
        id: values?.id || 0,
        StockID: 0,
        SO_THANG_GIU_LUONG: values?.SO_THANG_GIU_LUONG,
      });
    }
    if (values?.NGAY_NGHI) {
      newchluongData.push({
        id: values?.id || 0,
        StockID: 0,
        NGAY_NGHI: values?.NGAY_NGHI,
      });
    }
    if (values?.TRO_CAP_NGAY) {
      newchluongData.push({
        id: values?.id || 0,
        StockID: 0,
        TRO_CAP_NGAY: values?.TRO_CAP_NGAY,
      });
    }
    if (values?.LOAI_TINH_LUONG) {
      if (values?.LOAI_TINH_LUONG === "NGAY_NGHI") {
        newchluongData.push({
          id: values?.id || 0,
          StockID: 0,
          NGAY_NGHI: values?.SO_NGAY || 0,
        });
      } else {
        newchluongData.push({
          id: values?.id || 0,
          StockID: 0,
          NGAY_CONG: values?.SO_NGAY || 0,
        });
      }
    }

    bodyFormData.append("chluongData", JSON.stringify(newchluongData));
    bodyFormData.append("chluongGr", JSON.stringify([]));

    addEditMutation.mutate(
      {
        data: bodyFormData,
        GroupIDs: {
          updates: [
            {
              UserID: values?.id,
              GroupIDs: values.GroupIDs
                ? values.GroupIDs.map((x) => x.value)
                : [],
            },
          ],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: (data) => {
          if (data?.rs?.data?.error) {
            toast.error(data?.rs?.data?.error);
          } else {
            toast.success(id ? "Cập nhật thành công." : "Thêm mới thành công.");
            if (id) {
              f7router.back();
            }

            if (!id) {
              open({ FullName: values?.fn, UserName: values?.usn });
            }
          }
        },
      }
    );
  };

  let { stockid } = watch();

  return (
    <Page
      className="bg-white"
      name="MembersAdminAddEdit"
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
        <NavTitle>{f7route?.query?.FullName || "Thêm mới nhân viên"}</NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <PickerShare callback={() => f7router.back()}>
        {({ open }) => (
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit((values) =>
                onSubmit({
                  values,
                  open: open,
                })
              )}
              className="relative flex flex-col h-full pb-safe-b"
              autoComplete="off"
            >
              {(!id || !isLoading) && (
                <div className="p-4 overflow-auto grow">
                  <div className="border-b mb-3.5 pb-4">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Ảnh nhân viên</div>
                      <Controller
                        name="Avatar"
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
                      <div className="mb-px">Tên nhân viên *</div>
                      <Controller
                        name="fn"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type="text"
                            placeholder="Nhập họ và tên nhân viên"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={(val) => {
                              field.onChange(val.target.value);
                              if (!id) {
                                setSuggestLoading(true);
                                debounce(val.target.value, 600);
                              }
                            }}
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
                      <div className="mb-px">Tài khoản đăng nhập *</div>
                      <Controller
                        name="usn"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <div className="relative">
                            <Input
                              disabled
                              clearButton={false}
                              className="[&_input]:rounded [&_input]:placeholder:normal-case"
                              type="text"
                              placeholder="Tự động sinh ra khi nhập tên"
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
                            {suggestLoading && (
                              <div className="absolute top-0 right-0 flex items-center w-10 h-full pointer-events-none">
                                <div role="status">
                                  <svg
                                    aria-hidden="true"
                                    className="text-white w-7 h-7 animate-spin fill-primary"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
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
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      {id ? (
                        <div className="mb-2 font-light text-muted2">
                          Bạn muốn thay đổi mật khẩu .
                          <span
                            className="px-1 font-medium cursor-pointer text-primary"
                            onClick={() => setIsEditPwd(!isEditPwd)}
                          >
                            Bấm vào đây
                          </span>
                          nếu bạn muốn đặt mật khẩu khác cho tài khoản này.
                        </div>
                      ) : (
                        <div className="mb-2 font-light text-muted2">
                          Mật khẩu đăng nhập APP mặc định là
                          <span className="pl-1 font-semibold font-number text-danger">
                            1234
                          </span>
                          .
                          <span
                            className="px-1 font-medium cursor-pointer text-primary"
                            onClick={() => setIsEditPwd(!isEditPwd)}
                          >
                            Bấm vào đây
                          </span>
                          nếu bạn muốn thay đổi.
                        </div>
                      )}
                      {isEditPwd && (
                        <div>
                          <div className="mb-px">Mật khẩu</div>
                          <div>
                            <Controller
                              name="pwd"
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <Input
                                  clearButton
                                  className="[&_input]:rounded [&_input]:placeholder:normal-case"
                                  type="password"
                                  placeholder="Nhập mật khẩu"
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
                      )}
                    </div>
                    {Brand?.Global?.Admin?.OTP_USER && (
                      <div className="flex items-end justify-between mb-3.5 last:mb-0">
                        <div className="flex items-end">
                          Kiểm soát đăng nhập qua OTP
                          <QuestionMarkCircleIcon
                            className="w-6 ml-1 cursor-pointer text-warning"
                            onClick={() =>
                              f7.dialog
                                .alert(`Mỗi lần đăng nhập nhân viên sẽ có 1 mã OTP
                                    gửi về Email của quản lý, Nhân viên sẽ phải
                                    xin OTP này để đăng nhập tránh việc tự do
                                    đăng nhập tại nhiều nơi.`)
                            }
                          />
                        </div>
                        <Controller
                          name="IsOPTLogin"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
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
                    )}
                  </div>
                  <div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Nhân viên thuộc cơ sở</div>
                      <Controller
                        name="stockid"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={false}
                            placeholder="Chọn cơ sở"
                            value={field.value}
                            options={usrmng?.StockRolesAll || []}
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
                      <div className="mb-1">
                        Vai trò nhân viên (Chọn 1 hoặc nhiều) *
                      </div>
                      <Controller
                        name="GroupIDs"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectGroupRoles
                            placeholderInput="Tên vai trò"
                            placeholder="Chọn vai trò"
                            value={field.value}
                            label="Chọn vai trò"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            isFilter
                            isMulti
                            StockRoles={usrmng?.StockRolesAll || []}
                            Params={{
                              StockID: stockid?.value || null,
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {csluong_bangluong?.hasRight && (
                    <div className="pt-5 border-t mt-7 border-t-separator">
                      <div className="mb-4">
                        <div className="mb-1 text-lg font-semibold">
                          Cài đặt chính sách lương
                        </div>
                        <div className="font-light text-muted2">
                          Cài đặt lương cơ bản, số ngày công quy định trên tháng
                          & ăn trưa.
                        </div>
                      </div>
                      <div>
                        <SelectUserLevels
                          isClearable={true}
                          placeholder="Chọn cấp bậc"
                          label="Cấp bậc"
                          wrapClassName="mb-3.5 last:mb-0"
                          name={`chluongLevels`}
                          autoSet={!id}
                        />
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Lương cơ bản</div>
                          <div>
                            <Controller
                              name={`LUONG`}
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <div className="relative">
                                  <NumericFormat
                                    className={clsx(
                                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
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
                                        typeof val.floatValue !== "undefined"
                                          ? val.floatValue
                                          : ""
                                      )
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
                              )}
                            />
                          </div>
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="flex justify-between">
                            <Controller
                              name={`LOAI_TINH_LUONG`}
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <>
                                  <span>
                                    {field.value === "NGAY_CONG"
                                      ? "Ngày công cố định"
                                      : "Ngày nghỉ cố định"}
                                    <span className="pl-1">/ tháng</span>
                                  </span>
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                      field.onChange(
                                        field.value === "NGAY_CONG"
                                          ? "NGAY_NGHI"
                                          : "NGAY_CONG"
                                      );
                                      setValue("SO_NGAY", "");
                                    }}
                                  >
                                    <ArrowPathIcon className="w-5" />
                                  </div>
                                </>
                              )}
                            />
                          </div>
                          <div className="mt-1">
                            <Controller
                              name={`SO_NGAY`}
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <div className="relative">
                                  <NumericFormat
                                    className={clsx(
                                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                      fieldState?.invalid
                                        ? "border-danger"
                                        : "border-[#d5d7da]"
                                    )}
                                    type="text"
                                    autoComplete="off"
                                    thousandSeparator={false}
                                    placeholder="Nhập số ngày"
                                    value={field.value}
                                    onValueChange={(val) =>
                                      field.onChange(
                                        typeof val.floatValue !== "undefined"
                                          ? val.floatValue
                                          : ""
                                      )
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
                              )}
                            />
                          </div>
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="flex items-end mb-px">
                            <span>Phụ cấp tháng</span>
                            <QuestionMarkCircleIcon
                              onClick={() =>
                                f7.dialog.alert(
                                  "Không phụ thuộc vào ngày chấm công"
                                )
                              }
                              className="w-[22px] ml-1.5 text-warning cursor-pointer"
                            />
                          </div>
                          <div>
                            <Controller
                              name={`PHU_CAP`}
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <div className="relative">
                                  <NumericFormat
                                    className={clsx(
                                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
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
                                        typeof val.floatValue !== "undefined"
                                          ? val.floatValue
                                          : ""
                                      )
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
                              )}
                            />
                          </div>
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="flex items-end mb-px">
                            <span>Phụ cấp ngày (Ăn trưa)</span>
                            <QuestionMarkCircleIcon
                              onClick={() =>
                                f7.dialog.alert("Tính theo số ngày chấm công")
                              }
                              className="w-[22px] ml-1.5 text-warning cursor-pointer"
                            />
                          </div>
                          <div>
                            <Controller
                              name={`TRO_CAP_NGAY`}
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <div className="relative">
                                  <NumericFormat
                                    className={clsx(
                                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
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
                                        typeof val.floatValue !== "undefined"
                                          ? val.floatValue
                                          : ""
                                      )
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
                              )}
                            />
                          </div>
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="flex items-end mb-px">
                            <span>Giữ lương hàng tháng</span>
                            <QuestionMarkCircleIcon
                              onClick={() =>
                                f7.dialog
                                  .alert(`Trường hợp nhân viên bị cam kết làm 12 tháng thì
                                bạn có thể cài đặt giữ lương theo số tiền cố
                                định hàng tháng hoặc theo % lương thu nhập trong
                                1 khoảng thời gian 6 tháng, 1 năm. Lương sẽ được
                                giữ lại và thanh toán cho nhân viên khi đủ thời
                                gian`)
                              }
                              className="w-[22px] ml-1.5 text-warning cursor-pointer"
                            />
                          </div>
                          <Controller
                            name={`GIU_LUONG`}
                            control={control}
                            render={({
                              field: { ref, ...field },
                              fieldState,
                            }) => (
                              <div className="relative">
                                <NumericFormat
                                  className={clsx(
                                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
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
                                      typeof val.floatValue !== "undefined"
                                        ? val.floatValue
                                        : ""
                                    )
                                  }
                                />
                                {field.value !== "" && (
                                  <div className="absolute top-0 right-0 flex items-center justify-center w-10 h-12 pointer-events-none font-number">
                                    {field.value > 100 ? "đ" : "%"}
                                  </div>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Số tháng giữ lương</div>
                          <Controller
                            name={`SO_THANG_GIU_LUONG`}
                            control={control}
                            render={({
                              field: { ref, ...field },
                              fieldState,
                            }) => (
                              <div className="relative">
                                <NumericFormat
                                  className={clsx(
                                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                    fieldState?.invalid
                                      ? "border-danger"
                                      : "border-[#d5d7da]"
                                  )}
                                  type="text"
                                  autoComplete="off"
                                  thousandSeparator={false}
                                  placeholder="Nhập số tháng"
                                  value={field.value}
                                  onValueChange={(val) =>
                                    field.onChange(
                                      typeof val.floatValue !== "undefined"
                                        ? val.floatValue
                                        : ""
                                    )
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
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {cong_ca?.hasRight && (
                    <div className="pt-5 border-t mt-7 border-t-separator">
                      <div className="mb-4">
                        <div className="mb-1 text-lg font-semibold">
                          Cài đặt chấm công
                        </div>
                      </div>
                      <div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Ca làm việc</div>
                          <div>
                            <Controller
                              name={`chamcong.ShiftID`}
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <>
                                  <SelectUserShifts
                                    isClearable={true}
                                    placeholder="Chọn ca làm việc"
                                    value={field.value}
                                    label="Ca làm việc"
                                    onChange={(val) => {
                                      field.onChange(val || null);
                                    }}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                  />
                                </>
                              )}
                            />
                          </div>
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">
                            Lương theo giờ (Tính tăng ca, phạt)
                          </div>
                          <div>
                            <Controller
                              name="chamcong.SalaryHours"
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <div className="relative">
                                  <NumericFormat
                                    className={clsx(
                                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
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
                                        typeof val.floatValue !== "undefined"
                                          ? val.floatValue
                                          : ""
                                      )
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
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {id && isLoading && (
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
                <Button
                  type="submit"
                  className="rounded-full bg-app"
                  fill
                  large
                  preloader
                  loading={addEditMutation.isLoading || isLoading}
                  disabled={addEditMutation.isLoading || isLoading}
                >
                  {id ? "Lưu thay đổi" : "Thêm mới"}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </PickerShare>
    </Page>
  );
}

export default MembersAdminAddEdit;

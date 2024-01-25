import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  TextEditor,
  f7,
} from "framework7-react";
import React, { useState } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import {
  DatePicker,
  SelectPicker,
  SelectPickersGroup,
} from "../../../../partials/forms";
import KeyboardsHelper from "../../../../helpers/KeyboardsHelper";
import { UploadFile } from "../../components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import NotificationsAPI from "../../../../api/Notifications.api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";

const TypeLinks = [
  //   {
  //     label: "Tới danh mục tin tức",
  //     value: "NEWS",
  //   },
  //   {
  //     label: "Tới bài viết tin tức",
  //     value: "NEWS_DETAIL",
  //   },
  {
    label: "Tới sản phẩm, dịch vụ khuyến mại",
    value: "SALE",
  },
  //   {
  //     label: "Tới nhóm sản phẩm, dịch vụ",
  //     value: "CATE_ID",
  //   },
  //   {
  //     label: "Tới chi tiết sản phẩm, dịch vụ",
  //     value: "PROD_ID",
  //   },
  //   {
  //     label: "Tới chi tiết Media, Video",
  //     value: "ADV_ID",
  //   },
  //   {
  //     label: "Tới chi tiết dịch vụ gốc",
  //     value: "SERVICE_ID",
  //   },
  {
    label: "Tới danh sách Voucher",
    value: "VOUCHER",
  },
  //   {
  //     label: "Tới dịch vụ gốc",
  //     value: "CATE_SERVICE_ID",
  //   },
  //   {
  //     label: "Tới đặt lịch dịch vụ",
  //     value: "BOOK_SERVICE",
  //   },
  {
    label: "Tới form đăng ký ưu đãi",
    value: "FORM_SALES",
  },
];

const schemaAdd = yup
  .object({
    Title: yup.string().required("Vui lòng nhập tiêu đề."),
  })
  .required();

function NotificationEditAdmin({ f7route }) {
  const queryClient = useQueryClient();
  const [isEditLink, setIsEditLink] = useState(true);

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      ID: 0,
      ToMembers: "", //gui cho kh
      SetNotiDate: false,
      ToUserText: "",
      ToMemberText: "",
      Title: "",
      Content: "",
      IsSendEmail: false,
      IsWrapedEmail: false,
      TitleEmail: "",
      ContentEmail: "",
      ToUsers: "",
      NotiDate: null,
      CreateDate: "",
      Type: "",
      Result: "",
      UserID: 0,
      Params: "",
      IsSent: false,
      SentDate: "",
      InVoucherCampaignID: 0,
      NotiData: "",
      AudioSrc: "",
      SumInfo: "",
      Link: "",
      TypeLink: "",
      Thumbnail: "",
      Html: "",
      PathFrame: "",
      IsSchedule: false,
    },
    resolver: yupResolver(schemaAdd),
  });

  let Members = useQuery({
    queryKey: ["MembersNotifications"],
    queryFn: async () => {
      const { data } = await NotificationsAPI.getMembersSend();
      let newData = [];
      if (data?.data) {
        for (let key of data?.data) {
          const { group, groupid, text, id } = key;
          const index = newData.findIndex((item) => item.groupid === groupid);
          if (index > -1) {
            newData[index].options.push({
              label: text === "TAT_CA" ? "Tất cả" : text,
              value: id,
              ...key,
            });
          } else {
            const newItem = {};
            newItem.label = group;
            newItem.groupid = groupid;
            newItem.options = [
              {
                label: text === "TAT_CA" ? "Tất cả khách hàng" : text,
                value: id,
                ...key,
              },
            ];
            newData.push(newItem);
          }
        }
      }
      return newData;
    },
  });

  let Users = useQuery({
    queryKey: ["UsersNotifications"],
    queryFn: async () => {
      const { data } = await NotificationsAPI.getUsersSend();
      let newData = [];
      if (data?.data) {
        for (let key of data?.data) {
          const { group, groupid, text, id } = key;
          const index = newData.findIndex((item) => item.groupid === groupid);
          if (index > -1) {
            newData[index].options.push({
              label: text === "TAT_CA" ? "Tất cả" : text,
              value: id,
              ...key,
            });
          } else {
            const newItem = {};
            newItem.label = group === "TAT_CA" ? "Tất cả" : text;
            newItem.groupid = groupid;
            newItem.options = [
              {
                label: text === "TAT_CA" ? "Tất cả nhân viên" : text,
                value: id,
                ...key,
              },
            ];
            newData.push(newItem);
          }
        }
      }
      return newData;
    },
  });

  let { data, refetch } = useQuery({
    queryKey: ["NotificationsDetail", f7route.params.id],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("ids", f7route.params.id);
      let { data } = await NotificationsAPI.getId(bodyFormData);
      return data ? data.data[0] : null;
    },
    onSuccess: (data) => {
      reset({
        ...data,
        ID: 0,
        NotiDate: data.NotiDate ? new Date(data.NotiDate) : "",
        SetNotiDate: Boolean(data.NotiDate),
        ToMembers: data?.ToMemberText
          ? JSON.parse(data?.ToMemberText).map((x) => ({
              ...x,
              label: x?.text === "TAT_CA" ? "Tất cả khách hàng" : x?.text,
              value: x?.id,
            }))
          : "",
        ToUsers: data?.ToUserText
          ? JSON.parse(data?.ToUserText).map((x) => ({
              ...x,
              label: x?.text === "TAT_CA" ? "Tất cả nhân viên" : x?.text,
              value: x?.id,
            }))
          : "",
      });
      data?.Link && setIsEditLink(false);
    },
    enabled: Boolean(f7route.params.id),
  });

  const watchForm = watch();

  const updateMutation = useMutation({
    mutationFn: (body) => NotificationsAPI.send(body),
  });

  const onSubmit = (values) => {
    updateMutation.mutate(
      {
        noti: {
          ...values,
          ToMembers: values.ToMembers
            ? values.ToMembers.map((x) => x.value).toString()
            : "",
          ToUsers: values.ToUsers
            ? values.ToUsers.map((x) => x.value).toString()
            : "",
          NotiDate: values.NotiDate
            ? moment(values.NotiDate).format("YYYY-MM-DD HH:mm")
            : null,
        },
      },
      {
        onSuccess: (data) => {
          queryClient
            .invalidateQueries({ queryKey: ["NotificationsAdmin"] })
            .then(() => {
              toast.success("Thực hiện thành công.");
              f7.views.main.router.navigate("/admin/notifications/");
            });
        },
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="Notifications"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
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
        <NavTitle>Chỉnh sửa thông báo</NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4 overflow-auto grow">
          <div className="mb-4">
            <div className="mb-px font-light">Tiêu đề</div>
            <Controller
              name="Title"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  lab
                  className="[&_input]:rounded [&_input]:lowercase [&_input]:placeholder:normal-case"
                  type="text"
                  placeholder="Nhập tiêu đề"
                  value={field.value}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  onInput={field.onChange}
                  onFocus={(e) =>
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                  }
                />
              )}
            />
          </div>
          <div className="mb-4">
            <div className="mb-px font-light">Tóm tắt</div>
            <Controller
              name="Content"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case"
                  type="textarea"
                  placeholder="Nhập tóm tắt"
                  value={field.value}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  onInput={field.onChange}
                  onFocus={(e) =>
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                  }
                />
              )}
            />
          </div>
          <div className="mb-4">
            <div className="mb-px font-light">Chi tiết</div>
            <Controller
              name="Html"
              control={control}
              render={({ field, fieldState }) => (
                <TextEditor
                  placeholder="Nhập chi tiết..."
                  buttons={[
                    ["bold", "italic", "underline", "strikeThrough"],
                    ["orderedList", "unorderedList"],
                  ]}
                  value={field.value}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  onInput={field.onChange}
                  onFocus={(e) =>
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                  }
                />
              )}
            />
          </div>
          {isEditLink && (
            <div className="mb-4">
              <div className="mb-px font-light">Loại Link</div>
              <Controller
                name="TypeLink"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectPicker
                    isRequired={false}
                    placeholder="Chọn loại Link"
                    value={field.value}
                    options={TypeLinks}
                    label="Chọn loại Link"
                    onChange={(val) => {
                      field.onChange(val);
                      if (!val?.value) {
                        setValue("Link", "");
                      } else if (
                        ["SALE", "VOUCHER", "FORM_SALES"].includes(val.value)
                      ) {
                        if (val.value === "SALE") {
                          setValue("Link", "/shop/hot");
                        }
                        if (val.value === "VOUCHER") {
                          setValue("Link", "/voucher/");
                        }
                        if (val.value === "FORM_SALES") {
                          setValue("Link", "/pupup-contact/");
                        }
                      }
                    }}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                  />
                )}
              />
            </div>
          )}
          {!isEditLink && (
            <div className="mb-4">
              <div className="mb-px font-light">Loại Link</div>
              <div className="w-full flex flex-wrap px-4 py-3.5 bg-gray-100 border rounded text-input focus:border-primary shadow-[0_4px_6px_0_rgba(16,25,40,.06) border-[#d5d7da]">
                <div className="flex-1 truncate">{watchForm.Link}</div>
                <div
                  className="px-2 text-success"
                  onClick={() => setIsEditLink(true)}
                >
                  Chỉnh sửa
                </div>
              </div>
            </div>
          )}
          <div className="mb-4">
            <div className="mb-px font-light">Hình ảnh</div>
            <Controller
              name="Thumbnail"
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <UploadFile {...field} />
              )}
            />
          </div>
          <div className="mb-4">
            <div className="mb-px font-light">Khách hàng</div>
            <Controller
              name="ToMembers"
              control={control}
              render={({ field, fieldState }) => (
                <SelectPickersGroup
                  isRequired={false}
                  placeholder="Chọn khách hàng"
                  value={field.value}
                  options={Members?.data || []}
                  label="Chọn khách hàng"
                  onChange={(val) => {
                    field.onChange(val);
                  }}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                />
              )}
            />
          </div>
          <div className="mb-4">
            <div className="mb-px font-light">Nhân viên</div>
            <Controller
              name="ToUsers"
              control={control}
              render={({ field, fieldState }) => (
                <SelectPickersGroup
                  isRequired={false}
                  placeholder="Chọn nhân viên"
                  value={field.value}
                  options={Users?.data || []}
                  label="Chọn nhân viên"
                  onChange={(val) => {
                    field.onChange(val);
                  }}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                />
              )}
            />
          </div>
          <div>
            <div className="flex items-end justify-between mb-2">
              <div>Hẹn thời gian gửi</div>
              <Controller
                name="IsSchedule"
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...field}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                )}
              />
            </div>
            <div>
              {watchForm.IsSchedule && (
                <Controller
                  name="NotiDate"
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
                    />
                  )}
                />
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <Button
            type="submit"
            className="rounded-full bg-app"
            fill
            large
            preloader
            loading={updateMutation.isLoading}
            disabled={updateMutation.isLoading}
          >
            {watchForm.IsSchedule ? "Đặt lịch gửi" : "Thực hiện gửi"}
          </Button>
        </div>
      </form>
    </Page>
  );
}

export default NotificationEditAdmin;

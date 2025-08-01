import {
  Button,
  Input,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  TextEditor,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  ChevronLeftIcon,
  ListBulletIcon,
  PhotoIcon,
  PlusIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import {
  DatePicker,
  SelectPickersGroup,
} from "../../../../partials/forms";
import KeyboardsHelper from "../../../../helpers/KeyboardsHelper";
import { UploadFile } from "../../components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import NotificationsAPI from "../../../../api/Notifications.api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import AssetsHelpers from "../../../../helpers/AssetsHelpers";
import MoresAPI from "../../../../api/Mores.api";

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
    ToMembers: yup
      .array()
      .test(
        "Vui lòng chọn khách hàng",
        "Vui lòng chọn khách hàng",
        function (value) {
          const { ToUsers } = this.parent;
          if (!ToUsers || ToUsers.length === 0) return value.length > 0;
          return true;
        }
      ),
    ToUsers: yup
      .array()
      .test(
        "Vui lòng chọn nhân viên",
        "Vui lòng chọn nhân viên",
        function (value) {
          const { ToMembers } = this.parent;
          if (!ToMembers || ToMembers.length === 0) return value.length > 0;
          return true;
        }
      ),
  })
  .required();

function NotificationAddAdmin({ f7router }) {
  const queryClient = useQueryClient();

  const [isTemplate, setIsTemplate] = useState(true);

  const { Global } = useStore("Brand");
  const Auth = useStore("Auth");

  const inputFileRef = useRef("");

  useEffect(() => {
    if (Global?.TemplatesNoti && Global.TemplatesNoti.length > 0) {
      setIsTemplate(true);
    }
  }, []);

  const { control, handleSubmit, setValue, watch, reset, trigger } = useForm({
    defaultValues: {
      ID: 0,
      ToMembers: [], //gui cho kh
      SetNotiDate: false,
      ToUserText: "",
      ToMemberText: "",
      Title: "",
      Content: "",
      IsSendEmail: false,
      IsWrapedEmail: false,
      TitleEmail: "",
      ContentEmail: "",
      ToUsers: [],
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

  const watchForm = watch();

  const updateMutation = useMutation({
    mutationFn: (body) => NotificationsAPI.send(body),
  });

  const uploadMutation = useMutation({
    mutationFn: (body) => MoresAPI.upload(body),
  });

  const uploadFileEditor = (e) => {
    f7.dialog.preloader("Đang upload...");
    const files = event.target.files;
    var bodyFormData = new FormData();
    bodyFormData.append("file", files[0]);

    uploadMutation.mutate(
      {
        Token: Auth?.token,
        File: bodyFormData,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.error) {
            toast.error(data.error);
          } else {
            setValue(
              "Html",
              `${watchForm.Html} <div><img src="${AssetsHelpers.toAbsoluteUrl(
                data.data
              )}" /></div>`
            );
          }
          f7.dialog.close();
        },
        onError: (error) => {
          console.log(error);
        },
      }
    );
  };

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
      name="NotificationsAdd"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      onPageAfterOut={() => {
        reset();
      }}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            onClick={() => {
              if (!isTemplate) {
                setIsTemplate(true);
                reset();
              } else {
                f7router.back();
              }
            }}
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Thêm mới thông báo</NavTitle>
        <NavRight className="h-full">
          <Link
            href="/admin/notifications/"
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <ListBulletIcon className="w-6" />
          </Link>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {!isTemplate && (
        <form
          className="flex flex-col h-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="p-4 overflow-auto grow">
            <div className="mb-4">
              <div className="mb-px font-light">Tiêu đề</div>
              <Controller
                name="Title"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
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
                    // clearButton={true}
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
                    resizable
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
              <input
                type="file"
                name="uploadfile"
                accept="image/*"
                className="hidden w-full h-full opacity-0"
                ref={inputFileRef}
                onChange={uploadFileEditor}
              />
              <Controller
                name="Html"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="relative">
                    <TextEditor
                      resizable
                      placeholder="Nhập chi tiết..."
                      buttons={[
                        ["bold", "italic", "underline"],
                        ["orderedList", "unorderedList"],
                      ]}
                      value={field.value}
                      errorMessage={fieldState?.error?.message}
                      errorMessageForce={fieldState?.invalid}
                      onTextEditorChange={field.onChange}
                      // onTextEditorFocus={(e) => {
                      //   KeyboardsHelper.setAndroid({ Type: "body", Event: e });
                      // }}
                    />
                    <div className="absolute top-0 right-0 z-[1000] flex h-[44px] pr-2">
                      <div
                        className="flex items-center justify-center h-full w-[35px]"
                        onClick={() => inputFileRef?.current.click()}
                      >
                        <PhotoIcon className="w-6" />
                      </div>
                      <div
                        className="flex items-center justify-center h-full w-[35px]"
                        onClick={() => {
                          f7.dialog.prompt(
                            "Nhập URL Video Youtube",
                            (video) => {
                              setValue(
                                "Html",
                                `${watchForm.Html} <div><iframe class="w-full" height="200" src="${video}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
                              );
                            }
                          );
                        }}
                      >
                        <VideoCameraIcon className="w-6" />
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
            {/* <div className="mb-4">
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
            </div> */}
            <div className="mb-4">
              <div className="mb-px font-light">Hình ảnh</div>
              <Controller
                name="Thumbnail"
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <UploadFile {...field} PathFrame={watchForm.PathFrame} />
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
                      field.onChange(val ? [val] : []);
                      trigger("ToUsers");
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
                      field.onChange(val ? [val] : []);
                      trigger("ToMembers");
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
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
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
      )}
      {isTemplate && (
        <div className="relative p-4">
          <div className="grid mb-4">
            <div
              className="flex flex-col items-center justify-center h-32 border-[1px] border-[#d5d7da] border-dashed rounded cursor-pointer"
              onClick={() => setIsTemplate(false)}
            >
              <PlusIcon className="w-8 mb-2 text-muted" />
              <div className="font-meidum text-[15px] mb-px">Tạo mới mặc định</div>
              <div className="text-muted text-[13px]">Hoặc chọn mẫu bên dưới</div>
            </div>
          </div>
          <div>
            {Global?.TemplatesNoti &&
              Global?.TemplatesNoti.map((group, i) => (
                <div className="mb-5 last:mb-0" key={i}>
                  <div className="uppercase text-[13px] font-bold mb-2">
                    {group.Title}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {group.Children &&
                      group.Children.map((item, index) => (
                        <div
                          className="cursor-pointer"
                          key={index}
                          onClick={() => {
                            setValue("Title", item.Title);
                            setValue("Content", item.Desc);
                            setValue("Html", item.Html);
                            setValue("Thumbnail", item.Thumbnail);
                            setValue("PathFrame", item.PathFrame);
                            setIsTemplate(false);
                          }}
                        >
                          <div>
                            <img
                              className="rounded-sm"
                              src={AssetsHelpers.toAbsoluteUrl(
                                item.Thumbnail,
                                ""
                              )}
                              alt={item.Title}
                            />
                          </div>
                          <div className="pt-2.5">
                            <div className="mb-1 font-medium line-clamp-2">
                              {item.Title}
                            </div>
                            <div className="text-sm font-light text-muted2 line-clamp-2">
                              {item.Desc}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </Page>
  );
}

export default NotificationAddAdmin;

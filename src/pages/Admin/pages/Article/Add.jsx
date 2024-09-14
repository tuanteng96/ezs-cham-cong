import {
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
import React, { useEffect, useState } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  ChevronLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import AssetsHelpers from "../../../../helpers/AssetsHelpers";
import MoresAPI from "../../../../api/Mores.api";
import ArticleAPI from "../../../../api/Article.api";
import moment from "moment";
import StringHelpers from "../../../../helpers/StringHelpers";
import clsx from "clsx";

const schemaAdd = yup
  .object({
    Title: yup.string().required("Vui lòng nhập tên bài viết."),
  })
  .required();

function ArticleAddAdmin({ f7router, f7route }) {
  let { id } = f7route.params;
  const isAddMode = id === "add";
  const queryClient = useQueryClient();
  const Auth = useStore("Auth");

  const inputFileRef = useRef("");
  const buttonRef = useRef("");

  const methods = useForm({
    defaultValues: {
      ID: 0,
      Title: "",
      Desc: "",
      Content: "",
      Thumbnail: null,
      PhotoList: [],
      Channels: null,
      CreateDate: new Date(),
      Order: 0,
      IsPublic: 1,
    },
    resolver: yupResolver(schemaAdd),
  });

  const { control, handleSubmit, setValue, watch, reset } = methods;

  useQuery({
    queryKey: ["PostsID", id],
    queryFn: async () => {
      const { data } = await ArticleAPI.get({
        pi: 1,
        ps: 10,
        filter: {
          ID: id,
        },
      });
      return data && data?.list?.length > 0 ? data?.list[0] : null;
    },
    onSuccess: (data) => {
      if (data) {
        let Thumbnail = "";

        reset({
          ID: data.ID,
          Title: data.Title,
          Desc: "",
          Content: data.Desc + data.Content,
          Thumbnail,
          PhotoList:
            data?.PhotoList?.length > 0
              ? data?.PhotoList.map((x) => ({
                  Src: x,
                }))
              : null,
          Channels: data.Channels,
          CreateDate: data.CreateDate,
          Order: data.Order,
          IsPublic: data.IsPublic,
        });

        f7.dialog.close();
      }
    },
    enabled: !isAddMode,
  });

  const { fields, remove, append } = useFieldArray({
    control,
    name: "PhotoList",
  });

  const watchForm = watch();

  const updateMutation = useMutation({
    mutationFn: (body) => ArticleAPI.addEdit(body),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ body }) => {
      const final = await Promise.all(body.map((e) => MoresAPI.upload(e)));
      return {
        data: final
          ? final.filter((x) => x?.data?.data).map((x) => x?.data?.data)
          : [],
      };
    },
  });

  const uploadFileEditor = async (event) => {
    f7.dialog.preloader("Đang upload...");
    const files = [...event.target.files];

    let body = [];
    for (let file of files) {
      var bodyFormData = new FormData();
      bodyFormData.append("file", file);
      body.push({
        Token: Auth?.token,
        File: bodyFormData,
      });
    }
    uploadMutation.mutate(
      {
        body,
      },
      {
        onSuccess: ({ data }) => {
          if (data) {
            for (let Src of data) {
              append({ Src });
            }
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
    f7.dialog.preloader("Đang thực hiện ...");
    let newContent = values.Content;
    let { result } = StringHelpers.getMultipleIndexOf(values.Content, "<div>");
    let Desc = "";
    let Content = "";
    if (result && result.length > 0) {
      for (let index of result) {
        if (index > 50) {
          Desc = newContent.slice(0, index);
          Content = newContent.slice(index, newContent.length);
          break;
        }
      }
    } else {
      let { result: resultP } = StringHelpers.getMultipleIndexOf(
        values.Content,
        "</p>"
      );
      if (resultP && resultP.length > 0) {
        for (let index of resultP) {
          if (index > 50) {
            Desc = newContent.slice(0, index + 4);
            Content = newContent.slice(index + 4, newContent.length);
            break;
          }
        }
      } else {
        Content = newContent;
      }
    }
    let newPhotoList = [];

    if (values.PhotoList && values.PhotoList.length > 0) {
      for (let img of values.PhotoList) {
        newPhotoList.push(img.Src);
      }
    }
    updateMutation.mutate(
      {
        arr: [
          {
            ...values,
            Desc,
            Content,
            Thumbnail: "",
            PhotoList: newPhotoList,
            Channels: 835,
            CreateDate: values?.CreateDate
              ? moment(values?.CreateDate).format("HH:mm YYYY-MM-DD")
              : moment().format("HH:mm YYYY-MM-DD"),
          },
        ],
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["Articles"] }).then(() => {
            toast.success("Thêm mới thành công.");
            f7.dialog.close();
            f7.views.main.router.navigate("/admin/article/");
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
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>{isAddMode ? "Tạo bài viết" : "Chỉnh sửa bài viết"}</NavTitle>

        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white bg-success mr-3 px-2 py-1.5 text-[15px] rounded"
            onClick={() => buttonRef?.current?.click()}
          >
            Đăng bài
          </Link>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          className="relative flex flex-col h-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            name="Title"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <input
                  className={clsx(
                    "w-full px-4 border-b h-14",
                    fieldState?.invalid && "border-danger placeholder-danger"
                  )}
                  type="text"
                  placeholder="Tiêu đề bài viết"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </div>
            )}
          />
          <Controller
            name="Content"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <TextEditor
                  className="!border-0 !shadow-none !rounded-none grow"
                  //resizable
                  placeholder="Nhập nội dung..."
                  buttons={[
                    ["bold", "italic", "underline"],
                    ["orderedList", "unorderedList"],
                  ]}
                  value={field.value}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  onTextEditorChange={field.onChange}
                />
                <div className="absolute flex h-11 top-[56px]  z-[10000] right-0 pr-2">
                  <input
                    type="file"
                    name="uploadfile"
                    accept="image/*"
                    className="hidden w-full h-full opacity-0"
                    ref={inputFileRef}
                    onChange={uploadFileEditor}
                    multiple
                    value=""
                  />
                  <div
                    className="flex items-center justify-center h-full w-11 text-[#333]"
                    onClick={() => inputFileRef?.current.click()}
                  >
                    <PhotoIcon className="w-7" />
                  </div>
                  <div
                    className="flex items-center justify-center h-full w-11 text-[#333]"
                    onClick={() => {
                      f7.dialog.prompt("Nhập Mã Video Youtube", (video) => {
                        setValue(
                          "Content",
                          `${watchForm.Content} <div class="mt-2"><iframe class="w-full" height="200" src="https://www.youtube.com/embed/${video}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
                        );
                      });
                    }}
                  >
                    <VideoCameraIcon className="w-7" />
                  </div>
                </div>
              </>
            )}
          />
          {fields && fields.length > 0 && (
            <div className="grid grid-cols-4 gap-2 p-4">
              {fields &&
                fields.map((image, index) => (
                  <div
                    className="relative object-contain w-full rounded group aspect-square"
                    key={image.id}
                  >
                    <div
                      className="absolute z-10 flex items-center justify-center w-5 h-5 text-white transition bg-gray-700 border border-white rounded-full shadow-xl cursor-pointer top-1 right-1"
                      onClick={() => remove(index)}
                    >
                      <XMarkIcon className="w-3.5" />
                    </div>
                    <img
                      className="object-contain w-full border rounded aspect-square"
                      src={AssetsHelpers.toAbsoluteUrl(image.Src)}
                      alt=""
                    />
                  </div>
                ))}
            </div>
          )}

          <button
            type="submit"
            className="hidden rounded-full bg-app"
            //   loading={updateMutation.isLoading}
            //   disabled={updateMutation.isLoading}
            ref={buttonRef}
          >
            {isAddMode ? "Thêm mới" : "Cập nhập"}
          </button>
        </form>
      </FormProvider>
    </Page>
  );
}

export default ArticleAddAdmin;

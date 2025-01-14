import {
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, TextEditor, f7, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import clsx from "clsx";
import { DatePicker } from "@/partials/forms";
import moment from "moment";
import MoresAPI from "@/api/Mores.api";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

const schemaAdd = yup.object().shape({
  Content: yup.string().required("Vui lòng nhập nội dung."),
});

const Types = [
  {
    label: "Sale",
    value: "Sale",
  },
  {
    label: "Dịch vụ",
    value: "Service",
  },
];

function PickerAddNoteDiary({ children, data, MemberID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const inputFileRef = useRef("");

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      ID: 0,
      Target: "",
      MemberID: MemberID,
      Content: "",
      IsNoti: false,
      NotiDate: new Date(),
      IsEd: false,
      IsPublic: false,
      IsImportant: false,
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (data) {
      reset({
        Target: "",
        MemberID: data?.MemberID,
        Content: data?.Content,
        IsNoti: data?.IsNoti,
        NotiDate: data?.NotiDate,
        IsEd: Number(data?.IsEd) === 1,
        IsPublic: Number(data?.IsPublic) === 1,
        IsImportant: data?.IsImportant,
        ID: data?.ID,
      });
    } else {
      reset();
    }
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientAddEditNoteDiaryId(body);
      await queryClient.invalidateQueries(["ClientDiaryID"]);
      return data;
    },
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

  const onSubmit = (values) => {
    let newValues = {
      ...values,
      Target: values?.Target?.value || "",
      NotiDate:
        values?.IsNoti && values?.NotiDate
          ? moment(values?.NotiDate).format("YYYY-MM-DD HH:mm")
          : "",
      IsEd: values.IsEd ? 1 : 0,
      IsPublic: values.IsPublic ? 1 : 0,
      Content: values.Content ? encodeURI(values.Content) : ""
    };

    var bodyFormData = new FormData();
    bodyFormData.append("data", JSON.stringify(newValues));

    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success(
            values?.ID ? "Cập nhật thành công." : "Thêm mới thành công."
          );
          close();
        },
      }
    );
  };

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
            setValue(
              "Content",
              `${watch().Content} <div>${data
                .map(
                  (x) =>
                    `<div><img class="w-full" src="${AssetsHelpers.toAbsoluteUrl(
                      x
                    )}" /></div>`
                )
                .join("")}</div>`
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

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };
  
  return (
    <AnimatePresence initial={false}>
      <>
        {children({ open, close })}
        {visible &&
          createPortal(
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[90%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    {data?.ID ? "Chỉnh sửa ghi chú" : "Thêm mới ghi chú"}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto grow scrollbar-modal">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Nội dụng</div>
                      <Controller
                        name="Content"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className="relative">
                            <div>
                              <TextEditor
                                className={clsx(
                                  fieldState?.invalid && "text-editor-error"
                                )}
                                resizable
                                placeholder="Nhập nội dung..."
                                buttons={[
                                  ["bold", "italic", "underline"],
                                  ["orderedList", "unorderedList"],
                                ]}
                                value={field.value}
                                errorMessage={fieldState?.error?.message}
                                errorMessageForce={fieldState?.invalid}
                                onTextEditorChange={field.onChange}
                                onFocus={(e) =>
                                  KeyboardsHelper.setAndroid({
                                    Type: "modal-scrollbar",
                                    Event: e,
                                  })
                                }
                              />
                              {fieldState?.invalid && (
                                <div className="mt-1.5 text-xs font-light text-danger">
                                  {fieldState?.error?.message}
                                </div>
                              )}
                            </div>
                            <div className="absolute flex h-11 top-0  z-[10000] right-0 pr-2">
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
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    <div className="flex items-end justify-between mb-3.5 last:mb-0">
                      <div>Đặt lịch nhắc</div>
                      <Controller
                        name="IsNoti"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={field.value}
                              {...field}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                          </label>
                        )}
                      />
                    </div>

                    {watch().IsNoti && (
                      <>
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Thời gian nhắc</div>
                          <Controller
                            name="NotiDate"
                            control={control}
                            render={({
                              field: { ref, ...field },
                              fieldState,
                            }) => (
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
                        </div>
                        <div className="flex items-end justify-between mb-3.5 last:mb-0">
                          <div>Đã nhắc</div>
                          <Controller
                            name="IsEd"
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
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                              </label>
                            )}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-end justify-between mb-3.5 last:mb-0">
                      <div>Cho phép khách xem</div>

                      <Controller
                        name="IsPublic"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={field.value}
                              {...field}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                          </label>
                        )}
                      />
                    </div>
                    <div className="flex items-end justify-between mb-3.5 last:mb-0">
                      <div>Quan trọng</div>
                      <Controller
                        name="IsImportant"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={field.value}
                              {...field}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                          </label>
                        )}
                      />
                    </div>
                    {/* <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Áp dụng</div>
                      <Controller
                        name="Target"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={false}
                            autoHeight
                            placeholder="Chọn áp dụng"
                            value={field.value}
                            options={Types}
                            label="Áp dụng"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div> */}
                  </div>
                  <div className="flex gap-2 p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={addMutation.isLoading}
                      disabled={addMutation.isLoading}
                    >
                      {data?.ID ? "Cập nhật" : "Thêm mới"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerAddNoteDiary;

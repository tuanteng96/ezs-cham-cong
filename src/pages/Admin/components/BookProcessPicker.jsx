import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { Button, Input, useStore } from "framework7-react";
import { DatePicker } from "@/partials/forms";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import moment from "moment";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

const schemaAdd = yup
  .object({
    bookdate: yup.string().required("Vui lòng chọn thời gian."),
  })
  .required();

function BookProcessPicker({ children, data, type }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  let Auth = useStore("Auth");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      memberBookID: "",
      content: "",
      mid: "",
      title: "",
      confirm: "",
      bookinfo: "",
      bookdate: "",
      desc: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (visible && data) {
      reset({
        memberBookID: data?.ID,
        content: type,
        mid: data?.MemberID,
        title: data?.RootTitles,
        confirm: type === "Xác nhận đặt lịch" ? 1 : 0,
        bookinfo: JSON.stringify({
          Date: data?.BookDate,
          Other: [],
          OrderServiceIDs: data?.RootIds.split(","),
          Desc: data?.Desc,
          Title: "",
          StockID: data?.StockID,
          MemberID: data?.MemberID,
        }),
        bookdate: data?.BookDate || new Date(),
        desc: "",
      });
    }
  }, [data, visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const bookMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.doBookProcess(body);
      await Promise.all([queryClient.invalidateQueries(["Processings"])]);
      return data;
    },
  });

  const onSubmit = (values) => {
    var bodyFormData = new FormData();
    for (const property in values) {
      bodyFormData.append(
        property,
        property === "bookdate"
          ? moment(values[property]).format("DD/MM/YYYY HH:mm")
          : values[property]
      );
    }
    bookMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          close();
          toast.success(type + " thành công.");
          window?.noti27?.TIN_NHAN &&
            nwindow?.oti27.TIN_NHAN({
              type:
                type === "Xác nhận đặt lịch"
                  ? "CONFIRM_APPOINTMENT_WEB_APP"
                  : "CONFIRM_CANCEL_WEB_APP",
              data: values,
            });
        },
      }
    );
  };

  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: open,
        })}
        {visible &&
          createPortal(
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="h-full pb-safe-b"
                  autoComplete="off"
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    {type}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Nội dung</div>
                      <Controller
                        name="content"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                            type="textarea"
                            placeholder="Nhập nội dung"
                            rows="3"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onChange={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "modal",
                                Event: e,
                              })
                            }
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Thời gian</div>
                      <Controller
                        name="bookdate"
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
                            rows="3"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onChange={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "modal",
                                Event: e,
                              })
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-0 p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={bookMutation.isLoading}
                      disabled={bookMutation.isLoading}
                    >
                      Xác nhận
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

export default BookProcessPicker;

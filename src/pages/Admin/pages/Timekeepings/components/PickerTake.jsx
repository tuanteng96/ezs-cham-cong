import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, f7, Input, useStore } from "framework7-react";
import { DatePicker } from "@/partials/forms";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { SelectMembers } from "@/partials/forms/select";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import AdminAPI from "@/api/Admin.api";

const schemaAddEdit = yup
  .object({
    UserID: yup.object().required("Vui lòng chọn nhân viên."),
  })
  .required();

function PickerTake({ children, initialValues }) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  const Brand = useStore("Brand");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ID: 0,
      From: new Date(),
      To: new Date(),
      UserID: null,
      Desc: "",
    },
    resolver: yupResolver(schemaAddEdit),
  });

  useEffect(() => {
    if (visible) {
      if (initialValues?.ID) {
        reset({
          ID: initialValues?.ID || 0,
          From:
            initialValues?.From ||
            moment()
              .set({
                hour: moment(
                  Brand?.Global?.APP?.Working?.TimeOpen,
                  "HH:mm:ss"
                ).get("hour"),
                minute: moment(
                  Brand?.Global?.APP?.Working?.TimeOpen,
                  "HH:mm:ss"
                ).get("minute"),
                second: moment(
                  Brand?.Global?.APP?.Working?.TimeOpen,
                  "HH:mm:ss"
                ).get("second"),
              })
              .toDate(),
          To:
            initialValues?.To ||
            moment()
              .set({
                hour: moment(
                  Brand?.Global?.APP?.Working?.TimeClose,
                  "HH:mm:ss"
                ).get("hour"),
                minute: moment(
                  Brand?.Global?.APP?.Working?.TimeClose,
                  "HH:mm:ss"
                ).get("minute"),
                second: moment(
                  Brand?.Global?.APP?.Working?.TimeClose,
                  "HH:mm:ss"
                ).get("second"),
              })
              .toDate(),
          UserID: initialValues?.UserID
            ? {
                value: initialValues?.User?.ID,
                label: initialValues?.User?.FullName,
              }
            : null,
          Desc: initialValues?.Desc || "",
        });
      } else {
        let DateStart = null;
        let DateEnd = null;

        if (Brand?.Global?.Admin?.checkout_time) {
          let { checkout_time } = Brand?.Global?.Admin;
          DateStart = moment()
            .set({
              hours: checkout_time.split(";")[1].split(":")[0],
              minute: checkout_time.split(";")[1].split(":")[1],
            })
            .toDate();
          DateEnd = moment()
            .add(1, "days")
            .set({
              hours: checkout_time.split(";")[1].split(":")[0],
              minute: checkout_time.split(";")[1].split(":")[1],
            })
            .toDate();
        }
        reset({
          ID: 0,
          From:
            DateStart ||
            moment()
              .set({
                hour: moment(
                  Brand?.Global?.APP?.Working?.TimeOpen,
                  "HH:mm:ss"
                ).get("hour"),
                minute: moment(
                  Brand?.Global?.APP?.Working?.TimeOpen,
                  "HH:mm:ss"
                ).get("minute"),
                second: moment(
                  Brand?.Global?.APP?.Working?.TimeOpen,
                  "HH:mm:ss"
                ).get("second"),
              })
              .toDate(),
          To:
            DateEnd ||
            moment()
              .set({
                hour: moment(
                  Brand?.Global?.APP?.Working?.TimeClose,
                  "HH:mm:ss"
                ).get("hour"),
                minute: moment(
                  Brand?.Global?.APP?.Working?.TimeClose,
                  "HH:mm:ss"
                ).get("minute"),
                second: moment(
                  Brand?.Global?.APP?.Working?.TimeClose,
                  "HH:mm:ss"
                ).get("second"),
              })
              .toDate(),
          UserID: null,
          Desc: "",
        });
      }
    }
  }, [initialValues, visible, Brand]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.actionTimekeepingsTakeBreak(body);
      await queryClient.invalidateQueries(["TimekeepingsTake"]);
      return data;
    },
  });

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    let newEdit = [
      {
        ...values,
        From: moment(values.From).format("YYYY-MM-DD HH:mm:ss"),
        To: moment(values.To).format("YYYY-MM-DD HH:mm:ss"),
        UserID: values?.UserID?.value || "",
        StockID: CrStocks?.ID || "",
      },
    ];
    updateMutation.mutate(
      {
        data: {
          edit: newEdit,
        },
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          toast.success("Thêm mới thành công");
          setVisible(false);
        },
      }
    );
  };

  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: () => setVisible(true),
        })}
        {visible &&
          createPortal(
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
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
                  className="flex flex-col h-full pb-safe-b"
                  autoComplete="off"
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    {initialValues ? "Chỉnh sửa xin nghỉ" : "Tạo xin nghỉ mới"}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Nhân viên</div>
                      <Controller
                        name="UserID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectMembers
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            placeholderInput="Tên nhân viên"
                            placeholder="Chọn nhân viên"
                            value={field.value}
                            label="Chọn nhân viên"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            isFilter
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Nghỉ từ</div>
                      <Controller
                        name="From"
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
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Nghỉ đến</div>
                      <Controller
                        name="To"
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
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Lý do</div>
                      <Controller
                        name="Desc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[100px]"
                            type="textarea"
                            placeholder="Nhập mô tả lý do"
                            rows="3"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onChange={field.onChange}
                          />
                        )}
                      />
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
                      {initialValues ? "Lưu thay đổi" : "Thêm mới"}
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

export default PickerTake;

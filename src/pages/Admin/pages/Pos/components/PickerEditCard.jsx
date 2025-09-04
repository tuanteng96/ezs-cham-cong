import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { DatePicker } from "@/partials/forms";
import moment from "moment";

const schemaAdd = yup.object().shape({
  Value: yup.string().required("Vui lòng nhập giá trị thẻ tiền."),
});

function PickerEditCard({ children, data, MemberID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  
  let Auth = useStore("Auth");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ID: "",
      MoneyEndDate: null,
      Value: "",
      MoneyTotal: "",
      MoneyProd: "",
      MoneyService: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (data) {
      reset({
        ID: data?.id,
        MoneyEndDate: data?.han_dung || null,
        Value: data?.gia_tri_the || "",
        MoneyTotal: data?.gia_tri_chi_tieu || "",
        MoneyProd: data.gia_tri_chi_tieu_sp || "",
        MoneyService: data.gia_tri_chi_tieu_dv || "",
      });
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
      let data = await AdminAPI.clientEditCardId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientCardID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = {
      edit: {
        ...values,
        MoneyEndDate: values?.MoneyEndDate
          ? moment(values?.MoneyEndDate).format("YYYY-MM-DD")
          : null,
        MoneyTotal: values?.Value || "",
      },
    };

    addMutation.mutate(
      {
        data: newValues,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhật thành công.");
          close();
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
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  {data?.ten}
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Hạn sử dụng</div>
                      <Controller
                        name="MoneyEndDate"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <DatePicker
                            format="DD-MM-YYYY"
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Chọn thời gian"
                            showHeader
                            clear={true}
                          />
                        )}
                      />
                    </div>

                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Giá trị thẻ tiền</div>
                      <Controller
                        name="Value"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div>
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
                                  field.onChange(val.floatValue || "")
                                }
                              />
                              {field.value && (
                                <div
                                  className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <XMarkIcon className="w-5" />
                                </div>
                              )}
                            </div>
                            {fieldState?.invalid &&
                              fieldState?.error?.message && (
                                <div className="mt-1.5 text-xs font-light text-danger">
                                  {fieldState?.error?.message}
                                </div>
                              )}
                          </div>
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">
                        Giá trị chi tiêu sản phẩm
                      </div>
                      <Controller
                        name="MoneyProd"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div>
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
                                  field.onChange(val.floatValue || "")
                                }
                              />
                              {field.value && (
                                <div
                                  className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <XMarkIcon className="w-5" />
                                </div>
                              )}
                            </div>
                            {fieldState?.invalid && (
                              <div className="mt-1.5 text-xs font-light text-danger">
                                {fieldState?.error?.message}
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">
                        Giá trị chi tiêu dịch vụ
                      </div>
                      <Controller
                        name="MoneyService"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div>
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
                                  field.onChange(val.floatValue || "")
                                }
                              />
                              {field.value && (
                                <div
                                  className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <XMarkIcon className="w-5" />
                                </div>
                              )}
                            </div>
                            {fieldState?.invalid &&
                              fieldState?.error?.message && (
                                <div className="mt-1.5 text-xs font-light text-danger">
                                  {fieldState?.error?.message}
                                </div>
                              )}
                          </div>
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
                      loading={addMutation.isLoading}
                      disabled={addMutation.isLoading}
                    >
                      Cập nhật
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

export default PickerEditCard;

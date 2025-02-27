import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, f7 } from "framework7-react";
import clsx from "clsx";
import { SelectPicker } from "@/partials/forms";
import { NumericFormat } from "react-number-format";
import ConfigsAPI from "@/api/Configs.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { PickerPunishmentSuggest } from ".";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const options = [
  {
    label: "Đi sớm",
    value: "DI_SOM",
  },
  {
    label: "Đi muộn",
    value: "DI_MUON",
  },
  {
    label: "Về sớm",
    value: "VE_SOM",
  },
  {
    label: "Về muộn",
    value: "VE_MUON",
  },
];

const schemaConfirm = yup
  .object({
    FromMinute: yup.string().required("Vui lòng nhập số phút."),
    ToMinute: yup.string().required("Vui lòng nhập số phút."),
    Value: yup.string().required("Vui lòng nhập giá trị."),
  })
  .required();

function PickerPunishment({
  children,
  initialValues,
  data,
  getByName,
  Type,
  index,
}) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      FromMinute: "",
      ToMinute: "",
      Value: "",
      Type: options[0],
    },
    resolver: yupResolver(schemaConfirm),
  });

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        let index = options.findIndex((x) => x.value === Type);
        reset({
          ...initialValues,
          Type: index > -1 ? options[index] : options[0],
        });
      } else {
        if (Type) {
          let index = options.findIndex((x) => x.value === Type);
          reset({
            FromMinute: "",
            ToMinute: "",
            Value: "",
            Type: index > -1 ? options[index] : options[0],
          });
        } else {
          reset();
        }
      }
    }
  }, [visible, initialValues]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      await queryClient.invalidateQueries(["TimekeepingsPunishment"]);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      return data;
    },
  });

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    let newData = { ...data };
    let newValues = {
      ...values,
      FromMinute: Number(values.FromMinute),
      ToMinute: Number(values.ToMinute),
      Value: Number(values.Value),
    };
    if (initialValues) {
      delete newValues.Type;
      newData[values.Type?.value][index] = newValues;
    } else {
      delete newValues.Type;
      newData[values.Type?.value].push(newValues);
    }
    
    updateMutation.mutate(
      { data: newData, name: "congcaconfig" },
      {
        onSuccess: () => {
          toast.success(
            initialValues ? "Cập nhật thành công" : "Thêm mới thành công"
          );
          setVisible(false);
        },
      }
    );
  };

  const onDelete = () => {
    f7.dialog.preloader("Đang thực hiện");

    let newData = { ...data };
    newData[Type].splice(index, 1);

    deleteMutation.mutate(
      { data: newData, name: "congcaconfig" },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(["TimekeepingsPunishment"]).then(() => {
            toast.success("Xoá thành công");
            setVisible(false);
            f7.dialog.close();
          });
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
                    {initialValues
                      ? `${getByName(Type)} (${initialValues?.FromMinute}p - ${
                          initialValues?.ToMinute
                        }p)`
                      : "Thêm mới cấu hình"}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Loại công ca</div>
                      <Controller
                        name="Type"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={false}
                            placeholder="Chọn loại"
                            value={field.value}
                            options={options || []}
                            label="Loại"
                            onChange={(val) => {
                              field.onChange(val || null);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            autoHeight
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1 text-gray-500">Từ (Số phút)</div>
                      <Controller
                        name={`FromMinute`}
                        control={control}
                        render={({ field, fieldState }) => (
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
                              placeholder="Nhập số phút"
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(
                                  typeof val.floatValue !== "undefined"
                                    ? val.floatValue
                                    : ""
                                );
                              }}
                              allowLeadingZeros={true}
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
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1 text-gray-500">Đến (Số phút)</div>
                      <Controller
                        name="ToMinute"
                        control={control}
                        render={({ field, fieldState }) => (
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
                              placeholder="Nhập số phút"
                              value={field.value}
                              onValueChange={(val) =>
                                field.onChange(
                                  typeof val.floatValue !== "undefined"
                                    ? val.floatValue
                                    : ""
                                )
                              }
                              allowLeadingZeros={true}
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
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1 text-gray-500">Giá trị</div>
                      <Controller
                        name={`Value`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className="relative">
                            <NumericFormat
                              className={clsx(
                                "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 pl-4 pr-24 focus:border-primary",
                                fieldState?.invalid
                                  ? "border-danger"
                                  : "border-[#d5d7da]"
                              )}
                              type="text"
                              autoComplete="off"
                              thousandSeparator={true}
                              placeholder="Nhập giá trị"
                              value={field.value}
                              onValueChange={(val) =>
                                field.onChange(
                                  typeof val.floatValue !== "undefined"
                                    ? val.floatValue
                                    : ""
                                )
                              }
                              allowLeadingZeros={true}
                            />
                            <div className="absolute top-0 right-0 flex h-full">
                              {field.value ? (
                                <div
                                  className="flex items-center justify-center w-12 h-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <XMarkIcon className="w-5" />
                                </div>
                              ) : (
                                <></>
                              )}
                              <PickerPunishmentSuggest
                                onChange={(val) => setValue("Value", val)}
                              >
                                {({ open }) => (
                                  <div
                                    className="flex items-center justify-center w-12 h-full border-l text-warning"
                                    onClick={open}
                                  >
                                    <ExclamationCircleIcon className="w-5" />
                                  </div>
                                )}
                              </PickerPunishmentSuggest>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 p-4">
                    {initialValues && (
                      <Button
                        type="button"
                        className="rounded-full bg-danger"
                        fill
                        large
                        preloader
                        onClick={onDelete}
                      >
                        Xoá
                      </Button>
                    )}

                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={updateMutation.isLoading}
                      disabled={updateMutation.isLoading}
                    >
                      {!initialValues ? "Thêm mới" : "Cập nhật"}
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

export default PickerPunishment;

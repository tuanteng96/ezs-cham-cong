import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { toast } from "react-toastify";
import StringHelpers from "@/helpers/StringHelpers";
import { SelectPicker } from "@/partials/forms";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

let options = [
  {
    label: "Xoá buổi",
    value: "0",
  },
  {
    label: "Thêm buổi",
    value: "1",
  },
];

const schema = yup.object().shape({
  edit: yup.string().required("Vui lòng nhập số buổi."),
});

function PickerServiceAddRemove({ children, data, MemberID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      edit: "",
      tomn: "",
      type: options[0],
      OrderItemID: data?.OrderItem?.ID,
      ProdServiceID: data?.Product?.ID,
      MemberID: MemberID,
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (data) {
      reset({
        edit: "",
        tomn: "",
        type: options[0],
        OrderItemID: data?.OrderItem?.ID,
        ProdServiceID: data?.Product?.ID,
        MemberID: MemberID,
      });
    }
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsChangeServicesItem(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientServicesID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      await queryClient.invalidateQueries(["OrderManageID"]);

      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = {
      ...values,
      type: values.type?.value || "",
      cmd: "srv_edit",
    };

    var bodyFormData = new FormData();

    for (const property in newValues) {
      bodyFormData.append(property, newValues[property]);
    }

    changeMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        cmd: "srv_edit",
      },
      {
        onSuccess: ({ data }) => {
          if (data?.error) {
            toast.error(data?.error);
          } else {
            toast.success(
              values.type?.value === 0
                ? "Xoá buổi thành công."
                : "Thêm buổi thành công."
            );
            close();
          }
        },
      }
    );
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  let Price = 0;
  let TotalPrice = 0;
  let TotalSession = 0;

  if (data?.Services && data?.Services.length > 0) {
    if (data?.Services[0]?.CostMerthod === 0) {
      Price = data?.Services[0]?.Cost;
    }
    if (data?.Services[0]?.CostMerthod === 1) {
      Price = data?.Services[0]?.Cost1;
    }
    if (data?.Services[0]?.CostMerthod === 2) {
      Price = data?.Services[0]?.Cost2;
    }
    if (data?.Services[0]?.CostMerthod === 3) {
      Price = data?.Services[0]?.Cost3;
    }
    TotalPrice = data?.Services.filter((x) => x.Status === "")
      .map((x) => {
        let CostPrice = 0;
        if (x?.CostMerthod === 0) {
          CostPrice = x?.Cost;
        }
        if (x?.CostMerthod === 1) {
          CostPrice = x?.Cost1;
        }
        if (x?.CostMerthod === 2) {
          CostPrice = x?.Cost2;
        }
        if (x?.CostMerthod === 3) {
          CostPrice = x?.Cost3;
        }
        return CostPrice;
      })
      .reduce((partialSum, a) => partialSum + a, 0);
    TotalSession = data?.Services.filter((x) => x.Status === "").length;
  }

  const { type } = watch();

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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-left">
                  Thêm / Xoá buổi
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
                  <div className="px-4 overflow-auto grow scrollbar-modal">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Loại</div>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            placeholder="Chọn loại"
                            value={field.value}
                            options={options}
                            label="Chọn loại"
                            onChange={(val) => {
                              field.onChange(val);
                              setValue("tomn", "");
                              setValue("edit", "");
                              clearErrors("edit");
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            isClearable={false}
                            autoHeight
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">
                        Số buổi
                        <span className="pl-2">
                          ( Giá trị
                          <span className="px-1 font-bold font-lato">
                            {StringHelpers.formatVND(Price)}
                          </span>
                          / 1 buổi)
                        </span>
                      </div>
                      <Controller
                        name="edit"
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
                                thousandSeparator={false}
                                placeholder="Số buổi"
                                value={field.value}
                                onValueChange={(val) => {
                                  clearErrors("edit");
                                  field.onChange(val.floatValue || "");
                                  if (type?.value === "0") {
                                    if (val.floatValue > 0) {
                                      if (
                                        val.floatValue * Price <=
                                        TotalPrice
                                      ) {
                                        setValue(
                                          "tomn",
                                          val.floatValue * Price
                                        );
                                      } else {
                                        setValue("tomn", TotalPrice);
                                      }
                                      if (val.floatValue > TotalSession) {
                                        setError("edit", {
                                          type: "Client",
                                          message: `Số buổi không hợp lệ. Tối đa ${TotalSession} buổi.`,
                                        });
                                      }
                                    } else {
                                      setValue("tomn", "");
                                    }
                                  }
                                }}
                                // isAllowed={(values) => {
                                //   const { floatValue, formattedValue } = values;
                                //   if (type?.value !== "0") return true;
                                //   return (
                                //     formattedValue === "" ||
                                //     (floatValue > 0 && floatValue <= TotalSession)
                                //   );
                                // }}
                                onFocus={(e) =>
                                  KeyboardsHelper.setAndroid({
                                    Type: "modal-scrollbar",
                                    Event: e,
                                  })
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
                      <div className="mb-px">Số tiền hoàn ví</div>
                      <Controller
                        name="tomn"
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
                              thousandSeparator={true}
                              placeholder="Số tiền"
                              value={field.value}
                              onValueChange={(val) =>
                                field.onChange(val.floatValue || "")
                              }
                              isAllowed={(values) => {
                                const { floatValue, formattedValue } = values;
                                if (type?.value !== "0") return true;
                                return (
                                  formattedValue === "" ||
                                  (floatValue > 0 && floatValue <= TotalPrice)
                                );
                              }}
                              onFocus={(e) =>
                                KeyboardsHelper.setAndroid({
                                  Type: "modal-scrollbar",
                                  Event: e,
                                })
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
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={changeMutation.isLoading}
                      disabled={changeMutation.isLoading || Object.keys(errors).length > 0}
                    >
                      Thực hiện
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

export default PickerServiceAddRemove;

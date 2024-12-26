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
import { SelectClients } from "@/partials/forms/select";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  ToMember: yup.object().required("Vui lòng chọn khách hàng chuyển nhượng."),
});

function PickerServiceTransfer({ children, data, MemberID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      cost: 0,
      ToMember: null,
      num: "",
      OrderItemID: data?.OrderItem?.ID,
      ProdServiceID: data?.Product?.ID,
      MemberID: MemberID,
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (data && visible) {
      reset({
        cost: 0,
        ToMember: null,
        num: "",
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
      await queryClient.invalidateQueries(["ClientServicesID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = {
      ...values,
      cmd: "srv_tran",
      ToMember: values?.ToMember?.value || "",
    };
    var bodyFormData = new FormData();

    for (const property in newValues) {
      if(property !== "num") {
        bodyFormData.append(property, newValues[property]);
      }
    }

    if (!values?.num) {
      f7.dialog.confirm(
        "Chuyển nhượng tất cả buổi cho khách hàng " + values?.ToMember?.label,
        () => {
          bodyFormData.append('num', 0);
          changeMutation.mutate(
            {
              data: bodyFormData,
              Token: Auth?.token,
              cmd: "srv_tran"
            },
            {
              onSuccess: ({ data }) => {
                console.log(data);
                toast.success("Chuyển nhượng thành công.");
                close();
              },
            }
          );
        }
      );
    } else {
      bodyFormData.append('num', values.num);
      changeMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
          cmd: "srv_tran"
        },
        {
          onSuccess: ({ data }) => {
            if (data?.error) {
              toast.error(data?.error);
            } else {
              toast.success("Chuyển nhượng thành công.");
              close();
            }
          },
        }
      );
    }
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-left">
                  Chuyển nhượng thẻ liệu trình
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
                      <div className="mb-px">Khách hàng chuyển nhượng</div>
                      <Controller
                        name="ToMember"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectClients
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            placeholderInput="Tên khách hàng"
                            placeholder="Chọn khách hàng"
                            value={field.value}
                            label="Chọn khách hàng"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            isFilter
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Số buổi chuyển nhượng</div>
                      <Controller
                        name="num"
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
                              placeholder="Số buổi"
                              value={field.value}
                              onValueChange={(val) =>
                                field.onChange(val.floatValue || "")
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
                      disabled={changeMutation.isLoading}
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

export default PickerServiceTransfer;

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { DatePicker } from "@/partials/forms";
import moment from "moment";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

function PickerPaymentNoteOrder({
  children,
  OrderID,
  Order,
  invalidateQueries,
}) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      Desc: "",
    },
  });

  useEffect(() => {
    if (!visible) {
      reset({
        Desc: "",
      });
    } else {
      reset({ Desc: Order?.Desc || "" });
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
      let data = await AdminAPI.clientsPaymentOrderId(body);
      if (invalidateQueries) {
        await Promise.all(
          invalidateQueries.map((key) => queryClient.invalidateQueries([key]))
        );
      } else {
        await queryClient.invalidateQueries(["ClientOrderViewID"]);
        await queryClient.invalidateQueries(["ClientOrderViewPaymentID"]);
      }

      return data;
    },
  });

  const onSubmit = (values) => {
    var bodyFormData = new FormData();
    bodyFormData.append(
      "DayToPay",
      Order?.DayToPay ? moment(Order?.DayToPay).format("DD-MM-YYYY HH:mm") : ""
    );
    bodyFormData.append("mode", 1);
    bodyFormData.append("autobonus", 0);
    bodyFormData.append("set_desc", 1);
    bodyFormData.append("desc", values?.Desc || "");
    bodyFormData.append("add", JSON.stringify([]));

    addMutation.mutate(
      {
        OrderID: OrderID,
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhật ghi chú thành công.");
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
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  Ghi chú đơn hàng
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
                      <div className="mb-px">Ghi chú</div>
                      <Controller
                        name="Desc"
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
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
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

export default PickerPaymentNoteOrder;

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

function PickerDebtLockOrder({ children, OrderID, Order }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      desc: "",
    },
  });

  useEffect(() => {
    if (!visible) {
      reset({
        desc: "",
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
      let data = await AdminAPI.clientDebtLockOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: Order?.Member?.ID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientOrderViewID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      await queryClient.invalidateQueries(["Processings"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    addMutation.mutate(
      {
        data: {
          OrderID: OrderID,
          desc: values.desc,
        },
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Khoá nợ thành công.");
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
                  Khoá nợ
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
                      <div className="mb-px font-light">Ghi chú</div>
                      <Controller
                        name="desc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[100px]"
                            type="textarea"
                            placeholder="Nhập ghi chú"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "modal-scrollbar",
                                Event: e,
                              })
                            }
                            resizable
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

export default PickerDebtLockOrder;

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, Input, useStore } from "framework7-react";
import { useMutation, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";

function PickerMachine({ children, user }) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      UserID: "",
      DeviceIDs: "",
    },
  });

  useEffect(() => {
    reset({
      UserID: user?.UserID || "",
      DeviceIDs: user?.DeviceIDs || "",
    });
  }, [user]);

  const close = () => {
    setVisible(false);
  };

  const saveMachineMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.saveMachineCode(body);
      await queryClient.invalidateQueries({ queryKey: ["TimekeepingsSheet"] });
      return data;
    },
  });

  const onSubmit = (values) => {
    saveMachineMutation.mutate(
      {
        Token: Auth?.ID,
        data: {
          updateList: [{ ...values }],
        },
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công.");
          close();
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
                    {user?.FullName}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Mã máy</div>
                      <Controller
                        name="DeviceIDs"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:!pr-12 [&_input]:placeholder:normal-case"
                            type="input"
                            placeholder="Nhập mã máy"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={saveMachineMutation.isLoading}
                      disabled={saveMachineMutation.isLoading}
                    >
                      Lưu thay đổi
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

export default PickerMachine;

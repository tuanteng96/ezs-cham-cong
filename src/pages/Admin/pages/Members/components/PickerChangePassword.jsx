import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, f7, Input, useStore } from "framework7-react";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import { useMutation, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";

const schemaAddEdit = yup
  .object({
    pwd: yup.string().required("Vui lòng nhập mật khẩu"),
  })
  .required();

function PickerChangePassword({ children, item }) {
  
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      pwd: "",
    },
    resolver: yupResolver(schemaAddEdit),
  });

  useEffect(() => {
    if (visible) reset();
  }, [visible]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let result = await AdminAPI.updateMembers(body);
      await queryClient.invalidateQueries({
        queryKey: ["MembersList"],
      });
      return result;
    },
  });

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    updateMutation.mutate(
      {
        data: {
          updates: [
            {
              UserID: item.ID,
              NewPassword: values.pwd,
            },
          ],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          toast.success("Thực hiện thành công.");
          f7.dialog.close();
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
                    Thay đổi mật khẩu
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 overflow-auto">
                    <div>
                      <div className="mb-px">Mật khẩu mới</div>
                      <div>
                        <Controller
                          name="pwd"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <Input
                              clearButton
                              className="[&_input]:rounded [&_input]:placeholder:normal-case"
                              type="password"
                              placeholder="Nhập mật khẩu"
                              value={field.value}
                              errorMessage={fieldState?.error?.message}
                              errorMessageForce={fieldState?.invalid}
                              onInput={field.onChange}
                              onFocus={(e) =>
                                KeyboardsHelper.setAndroid({
                                  Type: "body",
                                  Event: e,
                                })
                              }
                            />
                          )}
                        />
                      </div>
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

export default PickerChangePassword;

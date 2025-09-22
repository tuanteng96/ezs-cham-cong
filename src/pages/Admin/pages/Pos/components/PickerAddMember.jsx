import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

const schemaAdd = yup.object().shape({
  FullName: yup.string().required("Vui lòng nhập họ tên khách hàng."),
  MobilePhone: yup
    .string()
    .required("Vui lòng nhập số điện thoại.")
    .matches(phoneRegExp, "Số điện thoại không hợp lệ.")
    .min(10, "Số điện thoại không hợ lệ.")
    .max(11, "Số điện thoại không hợ lệ."),
});

function PickerAddMember({ children, onChange, keySearch }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues: {
      FullName: "",
      MobilePhone: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (keySearch) {
      const regexVN =
        /^(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9\d)\d{7}$/;
      if (regexVN.test(keySearch)) {
        reset({
          FullName: "",
          MobilePhone: keySearch,
        });
      } else {
        reset({
          FullName: keySearch,
          MobilePhone: "",
        });
      }
    }
  }, [keySearch]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.createMemberBooking(body);
      await queryClient.invalidateQueries(["SelectBookingClients"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    const obj = {
      member: {
        ...values,
        EmptyPhone: true,
        IsAff: 1,
      },
    };
    addMutation.mutate(
      {
        data: obj,
        Token: Auth?.token,
        StockID: CrStocks?.ID || "",
      },
      {
        onSuccess: ({ data }) => {
          if (data?.member) {
            onChange && onChange(data?.member);
            toast.success("Tạo mới khách hàng thành công.");
            reset();
            close();
          } else {
            setError("MobilePhone", {
              type: "Server",
              message: "Số điện thoại đã được sử dụng hoặc không hợp lệ.",
            });
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

  return (
    <>
      {children({ open, close })}
      {createPortal(
        <AnimatePresence initial={false}>
          {visible && (
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
                  Tạo mới khách hàng
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
                      <div className="mb-px font-light">Họ và tên</div>
                      <Controller
                        name="FullName"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                            type="input"
                            placeholder="Nhập họ và tên"
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
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Số điện thoại</div>
                      <Controller
                        name="MobilePhone"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type="number"
                            placeholder="Nhập số điện thoại"
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
                      Tạo khách hàng
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
}

export default PickerAddMember;

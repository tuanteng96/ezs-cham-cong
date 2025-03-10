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
import { toast } from "react-toastify";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { DatePicker } from "@/partials/forms";
import moment from "moment";
import OtpInput from "react-otp-input";
import AuthAPI from "@/api/Auth.api";
import PromHelpers from "@/helpers/PromHelpers";
import store from "@/js/store";
import StorageHelpers from "@/helpers/StorageHelpers";
import SubscribeHelpers from "@/helpers/SubscribeHelpers";

const schemaAdd = yup.object().shape({
  Value: yup.string().required("Vui lòng nhập mã."),
});

function PickerOTP({ children }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset, watch, setValue, setError } = useForm({
    defaultValues: {
      Value: "",
      Token: "",
      Auth: "",
      USN: "",
      PWD: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  let close = () => {
    setVisible(false);
  };

  const otpMutation = useMutation({
    mutationFn: (body) => AuthAPI.otpVerify(body),
  });

  const onSubmit = (values) => {
    otpMutation.mutate(
      { Value: values.Value, Token: values.Token },
      {
        onSuccess: ({ data }) => {
          if (data.error) {
            toast.error("Mã OTP không hợp lệ.");
            setError("Value", {
              type: "Client",
              message: "Mã OTP không hợp lệ.",
            });
          } else {
            f7.dialog.preloader("Đang tải ...");

            PromHelpers.SEND_TOKEN_FIREBASE().then(({ token, error }) => {
              if (!error) {
                var bodyFormData = new FormData();
                bodyFormData.append("token", token);
                AuthAPI.sendTokenFirebase({
                  ID: values.Auth.ID,
                  Type: value.Auth.acc_type,
                  bodyFormData,
                }).then(() =>
                  store.dispatch("setAuth", values.Auth).then(() => {
                    f7.dialog.close();
                    close();
                    f7.views.main.router.navigate("/home/");
                    StorageHelpers.set({
                      data: {
                        _historyU: values.USN,
                        _historyP: values.PWD,
                      },
                    });
                  })
                );
              } else {
                SubscribeHelpers.set(values.Auth).then(() =>
                  store.dispatch("setAuth", values.Auth).then(() => {
                    f7.dialog.close();
                    close();
                    f7.views.main.router.navigate("/home/");
                    StorageHelpers.set({
                      data: {
                        _historyU: values.USN,
                        _historyP: values.PWD,
                      },
                    });
                  })
                );
              }
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

  let { Value } = watch();

  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: ({ Token, Auth, USN, PWD }) => {
            setVisible(true);
            reset({
              Token,
              Auth,
              USN,
              PWD,
            });
          },
          close,
        })}
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[60vh]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  OTP Verification
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
                    <div className="px-6 text-center text-muted">
                      Nhập mã OTP Code nhận được từ Email Quản trị viên.
                    </div>
                    <Controller
                      name="Value"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div>
                          <OtpInput
                            containerStyle="gap-1.5 mt-8 justify-center"
                            value={field.value}
                            onChange={field.onChange}
                            numInputs={6}
                            renderSeparator={<></>}
                            renderInput={(props) => <input {...props} />}
                            inputStyle={clsx(
                              "!w-[50px] h-[50px] border rounded font-number font-medium text-lg",
                              fieldState?.invalid && "border-danger"
                            )}
                          />
                        </div>
                      )}
                    />
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={otpMutation.isLoading}
                      disabled={otpMutation.isLoading || !Value}
                    >
                      Xác thực
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

export default PickerOTP;

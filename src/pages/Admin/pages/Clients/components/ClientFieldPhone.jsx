import {
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Controller, useForm, useFormContext } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button, Input, useStore } from "framework7-react";
import { useMutation } from "react-query";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import { createPortal } from "react-dom";
import AdminAPI from "@/api/Admin.api";

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
const schemaChange = yup
  .object({
    e2: yup
      .string()
      .matches(phoneRegExp, "Số điện thoại không hợp lệ.")
      .required("Vui lòng nhập số điện thoại"),
  })
  .required();

const ClientFieldPhone = ({ isAddMode }) => {
  const Auth = useStore("Auth");
  const { control, watch, setValue : setValueContext } = useFormContext();
  const [visible, setVisible] = useState(false);
  const [isMore, setIsMore] = useState(false);

  let PhoneCurrent = watch().MobilePhone;

  const {
    control: controlField,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch: watchField,
  } = useForm({
    defaultValues: {
      e1: PhoneCurrent,
      e2: PhoneCurrent,
    },
    resolver: yupResolver(schemaChange),
  });

  useEffect(() => {
    setValue("e1", PhoneCurrent);
    setValue("e2", PhoneCurrent);
    clearErrors();
  }, [PhoneCurrent, setValue, clearErrors, visible]);

  const onClose = () => setVisible(false);

  const changePhoneMutation = useMutation({
    mutationFn: (body) => AdminAPI.listClients(body),
  });

  const onSubmit = (event) => {
    if (event) {
      if (typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if (typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
    }

    return handleSubmit(async (values) => {
      changePhoneMutation.mutate(
        {
          pi: 1,
          ps: 1,
          Token: Auth?.token,
          StockID: "",
          Key: values.e2
        },
        {
          onSuccess: ({ data }) => {
            if (data && data.data && data.data.length > 0) {
              setError("e2", {
                type: "Server",
                message: "Số điện thoại đã tồn tại.",
              });
            } else {
              setValueContext("MobilePhone", values.e2);
              setVisible(false);
            }
          },
          onError: (err) => {
            console.log(err);
          },
        }
      );
    })(event);
  };

  return (
    <AnimatePresence>
      <>
        <div className="flex gap-2">
          <div className="flex-1">
            <Controller
              name="MobilePhone"
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <div className="relative">
                  <Input
                    clearButton={isAddMode}
                    className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                    type="number"
                    placeholder="Nhập số điện thoại"
                    value={field.value}
                    errorMessage={
                      fieldState?.invalid &&
                      (fieldState?.error?.message ||
                        "Vui lòng nhập số điện thoại")
                    }
                    errorMessageForce={fieldState?.invalid}
                    onInput={field.onChange}
                    onFocus={(e) =>
                      KeyboardsHelper.setAndroid({
                        Type: "body",
                        Event: e,
                      })
                    }
                    //disabled={!isAddMode}
                  />
                  {/* {!isAddMode && (
                    <div
                      className="absolute top-0 right-0 z-10 flex items-center justify-center w-12 h-[48px] cursor-pointer"
                      onClick={() => setVisible(true)}
                    >
                      <PencilIcon className="w-4" />
                    </div>
                  )} */}
                </div>
              )}
            />
          </div>
          <div
            className="flex items-center justify-center w-12 h-[48px] bg-gray-100 rounded"
            onClick={() => setIsMore(!isMore)}
          >
            {isMore && <ChevronUpIcon className="w-5" />}
            {!isMore && <PlusIcon className="w-5" />}
          </div>
        </div>
        {isMore && (
          <div className="mt-3.5">
            <div className="mb-px">Số điện thoại khác</div>
            <Controller
              name="FixedPhone"
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <Input
                  clearButton
                  className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
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
        )}

        {visible &&
          createPortal(
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
              ></motion.div>
              <motion.div
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] mb-[var(--keyboard-translate-sheet)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  onSubmit={onSubmit}
                  className="flex flex-col h-full pb-safe-b"
                  autoComplete="off"
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Đổi số điện thoại
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={onClose}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto grow">
                    <div className="mt-3.5">
                      <div className="mb-px">Số điện thoại</div>
                      <div>
                        <Controller
                          name="e2"
                          control={controlField}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <Input
                              clearButton
                              className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
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
                  </div>
                  <div className="grid grid-cols-1 gap-0 p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={changePhoneMutation.isLoading}
                      // disabled={
                      //   changePhoneMutation.isLoading ||
                      //   watchField().e1 === watchField().e2
                      // }
                    >
                      Xác nhận
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
};

export default ClientFieldPhone;

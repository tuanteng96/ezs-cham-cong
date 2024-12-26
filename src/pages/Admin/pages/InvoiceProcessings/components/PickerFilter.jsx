import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, Input } from "framework7-react";
import clsx from "clsx";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

function PickerFilter({ children, initialValues, onChange }) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      Type: "",
      Key: "",
    },
  });

  useEffect(() => {
    if (visible) reset(initialValues);
  }, [initialValues, visible]);

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    onChange(values);
    close();
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
                    Bộ lọc
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Khách hàng</div>
                      <Controller
                        name="Key"
                        control={control}
                        render={({ field }) => (
                          <Input
                            className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px]"
                            type="text"
                            placeholder="Nhập tên khách hàng"
                            value={field.value}
                            clearButton={true}
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
                      <div className="mb-1">Loại</div>
                      <Controller
                        name="Type"
                        control={control}
                        render={({ field }) => (
                          <div className="grid grid-cols-1 gap-2.5">
                            {[
                              {
                                label: "Phát sinh đơn hàng",
                                value: 0,
                              },
                              {
                                label: "Không phát sinh",
                                value: 1,
                              },
                              {
                                label: "Chưa hoàn thành",
                                value: 2,
                              },
                            ].map((item, index) => (
                              <div
                                className={clsx(
                                  "rounded-sm leading-4 text-center h-12 flex items-center justify-center px-2 border relative overflow-hidden transition",
                                  field.value !== "" &&
                                    Number(field.value) === item.value
                                    ? "bg-white border-primary text-primary"
                                    : "bg-[#f5f5f5] border-[#f5f5f5] text-gray-800"
                                )}
                                key={index}
                                onClick={() => {
                                  if (
                                    field.value !== "" &&
                                    Number(field.value) === item.value
                                  ) {
                                    field.onChange("");
                                  } else {
                                    field.onChange(item.value);
                                  }
                                }}
                              >
                                <div
                                  className={clsx(
                                    "absolute top-0 left-0 text-white transition",
                                    field.value !== "" &&
                                      Number(field.value) === item.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                >
                                  <div className="triangle-left-top bg-primary w-3.5"></div>
                                  <div className="absolute top-0 left-0">
                                    <CheckIcon className="w-2" />
                                  </div>
                                </div>
                                {item.label}
                              </div>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4">
                    <Button
                      type="button"
                      className="text-black bg-gray-200 rounded-full"
                      fill
                      large
                      preloader
                      onClick={() =>
                        reset({
                          Type: "",
                          Key: "",
                        })
                      }
                    >
                      Cài lại
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                    >
                      Áp dụng
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

export default PickerFilter;

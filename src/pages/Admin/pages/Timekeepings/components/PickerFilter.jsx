import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, Input, useStore } from "framework7-react";
import clsx from "clsx";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import { DatePicker, SelectPicker } from "@/partials/forms";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function PickerFilter({ children, initialValues, onChange }) {
  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");

  const { cong_ca } = RolesHelpers.useRoles({
    nameRoles: ["cong_ca"],
    auth: Auth,
    CrStocks,
  });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      StockID: "",
      key: "",
      CrDate: "",
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
                      <div className="mb-1">Nhân viên</div>
                      <Controller
                        name="key"
                        control={control}
                        render={({ field }) => (
                          <Input
                            className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px]"
                            type="text"
                            placeholder="Nhập tên nhân viên"
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
                      <div className="mb-px font-light">Ngày</div>
                      <Controller
                        name="CrDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DatePicker
                            format="DD-MM-YYYY"
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Chọn thời gian"
                            showHeader
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Cơ sở</div>
                      <Controller
                        name="StockID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={false}
                            placeholder="Chọn cơ sở"
                            value={field.value}
                            options={
                              cong_ca?.StockRolesAll
                                ? cong_ca?.StockRolesAll.map((x) => ({
                                    ...x,
                                    value: x.value || 778,
                                  }))
                                : []
                            }
                            label="Cơ sở"
                            onChange={(val) => {
                              field.onChange(val || null);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
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

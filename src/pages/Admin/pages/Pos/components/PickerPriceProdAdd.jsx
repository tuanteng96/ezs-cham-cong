import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";

function PickerPriceProdAdd({ children, data, onChange }) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      Price: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        Price: 0,
      });
    }
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const onSubmit = ({ Price }) => {
    onChange(Price);
    close();
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
                  {data?.Title}
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
                      <div className="mb-px">Giá bán</div>
                      <Controller
                        name="Price"
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
                              thousandSeparator={true}
                              placeholder="Nhập giá bán"
                              value={field.value}
                              onValueChange={(val) =>
                                field.onChange(val.value || "")
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
}

export default PickerPriceProdAdd;

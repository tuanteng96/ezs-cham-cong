import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { Button } from "framework7-react";
import { SelectPicker } from "../../../partials/forms";

let options = [
  {
    value: 2,
    label: "Chưa tốt nghiệp",
  },
  {
    value: 1,
    label: "Đã tốt nghiệp",
  },
  {
    value: 3,
    label: "Đang tạm dừng",
  },
];

let optionsPay = [
  {
    value: "no",
    label: "Còn nợ",
  },
  {
    value: "khong",
    label: "Hết nợ",
  },
];

function PickerStudentFilter({ children, data, onChange }) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      Status: "",
      no: "",
    },
  });

  useEffect(() => {
    if (visible && data) {
      reset(data);
    }
  }, [data, visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
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
          open: open,
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
                  className="h-full pb-safe-b"
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
                  <div className="px-4">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Trạng thái</div>
                      <Controller
                        name="Status"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            placeholder="Chọn trạng thái"
                            value={field.value}
                            options={options}
                            label="Chọn trạng thái"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Trạng thái thanh toán</div>
                      <Controller
                        name="no"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            placeholder="Chọn trạng thái thanh toán"
                            value={field.value}
                            options={optionsPay}
                            label="Trạng thái thanh toán"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-0 p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                    >
                      Tìm kiếm
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

export default PickerStudentFilter;

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button } from "framework7-react";
import clsx from "clsx";
import { SelectPicker } from "@/partials/forms";
import { NumericFormat } from "react-number-format";

let options = [
  {
    label: "Theo số tiền (x > 100)",
    value: 1,
    desc: "Ví dụ: 5000, 10000 hay 1 số tiền Spa quy định",
    sub: "(Số nhập vào phải lớn hơn 100)",
  },
  {
    label: "Theo lương tính theo giờ của nhân viên ( 0 <= x <=100 )",
    value: 2,
    desc: "Ví dụ: Nhập 0.5 nếu được tính 50% lương 1 giờ của nhân viên",
    sub: "(Số nhập vào phải từ 0 đến 100)",
  },
  {
    label: "Theo số phút & theo lương giờ từng nhân viên ( x = -60 )",
    value: 3,
    desc: "Ví dụ: Lương 1 giờ được 60.000 VNĐ - Mỗi phút sẽ là 1.000 VNĐ; Số tiền = Số phút vênh x 1.000đ",
    sub: "(Số nhập vào phải = 60)",
  },
  {
    label: "Theo số công làm việc ( -10 <= x < 0 )",
    value: 4,
    desc: "Ví dụ: Nhập 0.5 nếu tính theo nữa ngày công",
    sub: "(Số nhập vào phải từ 0 đến 10)",
  },
  {
    label: "Theo số phút & cố định số tiền ( x < -10)",
    value: 5,
    desc: "Ví dụ: Số tiền sẽ được tính bằng số phút vênh nhân với số tiền nhập vào cho tất cả nhân viên",
    sub: "(Số nhập vào phải lớn hơn 100)",
  },
];

function PickerPunishmentSuggest({ children, onChange }) {
  const [visible, setVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    setValue,
    clearErrors,
  } = useForm({
    defaultValues: {
      Type: "",
      Value: "",
    },
  });

  const close = () => {
    setVisible(false);
  };

  let { Value, Type } = watch();

  const onSubmit = (values) => {
    if (!values.Type) {
      onChange(Number(values.Value));
      setVisible(false);
      reset({
        Type: "",
        Value: "",
      });
    } else {
      onChange(
        values?.Type?.value === 1 || values?.Type?.value === 2
          ? Number(values.Value)
          : Number(values.Value * -1)
      );
      setVisible(false);
      reset({
        Type: "",
        Value: "",
      });
    }
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
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
                  onSubmit={handleSubmitWithoutPropagation}
                  className="flex flex-col h-full pb-safe-b"
                  autoComplete="off"
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Giá trị
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Loại công ca</div>
                      <Controller
                        name="Type"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={false}
                            placeholder="Chọn loại"
                            value={field.value}
                            options={options || []}
                            label="Loại"
                            onChange={(val) => {
                              field.onChange(val || null);
                              if (!val) {
                                clearErrors();
                              }

                              if (val?.value === 3) {
                                clearErrors();
                                setValue("Value", 60);
                              }

                              if (Value) {
                                if (val?.value === 1) {
                                  if (Value <= 100) {
                                    setError("Value", {
                                      type: "Client",
                                      message: "Giá trị phải lớn hơn 100",
                                    });
                                  } else {
                                    clearErrors();
                                  }
                                }
                                if (val?.value === 2) {
                                  if (Value >= 0 && Value <= 100) {
                                    clearErrors();
                                  } else {
                                    setError("Value", {
                                      type: "Client",
                                      message:
                                        "Giá trị phải nằm trong khoảng >= 0 & <= 100",
                                    });
                                  }
                                }
                                if (val?.value === 3) {
                                  if (Value === 60) {
                                    clearErrors();
                                  } else {
                                    setError("Value", {
                                      type: "Client",
                                      message: "Giá trị phải = 60",
                                    });
                                  }
                                }
                                if (val?.value === 4) {
                                  if (Value > 0 && Value <= 10) {
                                    clearErrors();
                                  } else {
                                    setError("Value", {
                                      type: "Client",
                                      message:
                                        "Giá trị phải nằm trong khoảng > 0 & <= 10",
                                    });
                                  }
                                }
                                if (val?.value === 5) {
                                  if (Value > 100) {
                                    clearErrors();
                                  } else {
                                    setError("Value", {
                                      type: "Client",
                                      message: "Giá trị phải > 100",
                                    });
                                  }
                                }
                              }
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            //autoHeight
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1 text-gray-500">Giá trị</div>
                      <Controller
                        name={`Value`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <div>
                            <div className="relative">
                              <NumericFormat
                                className={clsx(
                                  "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 pl-4 pr-24 focus:border-primary",
                                  fieldState?.invalid
                                    ? "border-danger"
                                    : "border-[#d5d7da]"
                                )}
                                type="text"
                                autoComplete="off"
                                thousandSeparator={true}
                                placeholder="Nhập giá trị"
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(
                                    typeof val.floatValue !== "undefined"
                                      ? val.floatValue
                                      : ""
                                  );
                                  if (Type) {
                                    if (Type?.value === 1) {
                                      if (val.floatValue <= 100) {
                                        setError("Value", {
                                          type: "Client",
                                          message: "Giá trị phải lớn hơn 100",
                                        });
                                      } else {
                                        clearErrors();
                                      }
                                    }
                                    if (Type?.value === 2) {
                                      if (
                                        val.floatValue >= 0 &&
                                        val.floatValue <= 100
                                      ) {
                                        clearErrors();
                                      } else {
                                        setError("Value", {
                                          type: "Client",
                                          message:
                                            "Giá trị phải nằm trong khoảng >= 0 & <= 100",
                                        });
                                      }
                                    }
                                    if (Type?.value === 3) {
                                      if (val.floatValue === 60) {
                                        clearErrors();
                                      } else {
                                        setError("Value", {
                                          type: "Client",
                                          message: "Giá trị phải = 60",
                                        });
                                      }
                                    }
                                    if (Type?.value === 4) {
                                      if (
                                        val.floatValue > 0 &&
                                        val.floatValue <= 10
                                      ) {
                                        clearErrors();
                                      } else {
                                        setError("Value", {
                                          type: "Client",
                                          message:
                                            "Giá trị phải nằm trong khoảng > 0 & <= 10",
                                        });
                                      }
                                    }
                                    if (Type?.value === 5) {
                                      if (val.floatValue > 100) {
                                        clearErrors();
                                      } else {
                                        setError("Value", {
                                          type: "Client",
                                          message: "Giá trị phải > 100",
                                        });
                                      }
                                    }
                                  }
                                }}
                                allowLeadingZeros={true}
                              />
                              <div className="absolute top-0 right-0 flex h-full">
                                {field.value ? (
                                  <div
                                    className="flex items-center justify-center w-12 h-full"
                                    onClick={() => field.onChange("")}
                                  >
                                    <XMarkIcon className="w-5" />
                                  </div>
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>
                            {fieldState?.invalid &&
                              fieldState?.error?.message && (
                                <div className="text-danger mt-1 text-[12px] leading-4 font-light">
                                  {fieldState?.error?.message}
                                </div>
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

export default PickerPunishmentSuggest;

import NoFound from "@/components/NoFound";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import { PickerAddMember } from "@/pages/Admin/pages/Pos/components";
import {
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "framework7-react";
import React, { forwardRef, useState } from "react";
import { createPortal } from "react-dom";

const SelectBookingPicker = forwardRef(
  (
    {
      options = [],
      value,
      onChange,
      label,
      placeholder,
      placeholderInput,
      errorMessage,
      errorMessageForce,
      isMulti = false,
      isRequired = true,
      isClearable = true,
      isFilter = false,
      onInputFilter,
    },
    ref
  ) => {
    const [key, setKey] = useState("");
    const [visible, setVisible] = useState(false);

    let open = () => {
      setVisible(true);
    };

    let close = () => {
      setVisible(false);
      setKey("");
    };

    return (
      <AnimatePresence initial={false}>
        <>
          <div className="relative" onClick={open} ref={ref}>
            <div
              className={clsx(
                "no-keyboard flex w-full pl-4 pr-24 py-3 border rounded focus:border-primary shadow-[0_4px_6px_0_rgba(16,25,40,.06)",
                errorMessageForce ? "border-danger" : "border-[#d5d7da]"
              )}
            >
              {(!value || value.length === 0) && (
                <span className="text-[#b5b6c3]">{placeholder}</span>
              )}
              {isMulti ? (
                <div className="flex flex-wrap gap-2">
                  {value &&
                    value.map((x, idx) => (
                      <div className="flex bg-gray-100 rounded-sm" key={idx}>
                        <div className="px-1.5 py-px text-[13px]">
                          {x.label}
                        </div>
                        <div
                          className="flex items-center px-1 bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange(value.filter((o) => x.value !== o.value));
                          }}
                        >
                          <XMarkIcon className="w-3.5" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : value?.label ? (
                value?.label
              ) : (
                ""
              )}
            </div>
            <div className="absolute right-0 flex h-full top-2/4 -translate-y-2/4">
              <div className="flex items-center justify-center w-12 h-full">
                <ChevronDownIcon className="w-5" />
              </div>
              {isClearable && value ? (
                <div
                  className="flex items-center justify-center w-12 h-full relative after:content-[''] after:absolute after:right-0 after:h-4/6 after:w-[1px] after:bg-[#d5d7da] after:left-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                >
                  <XMarkIcon className="w-5" />
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
          {errorMessage && errorMessageForce && (
            <div className="mt-1.5 text-xs text-danger font-light">
              {errorMessage}
            </div>
          )}

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
                  className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[calc(100%-var(--ezs-safe-area-top)-var(--f7-navbar-height))]"
                  initial={{ opacity: 0, translateY: "100%" }}
                  animate={{ opacity: 1, translateY: "0%" }}
                  exit={{ opacity: 0, translateY: "100%" }}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    {label}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  {isFilter && (
                    <div className="px-4 mb-4">
                      <div className="relative">
                        <Input
                          className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14"
                          type="text"
                          placeholder={placeholderInput}
                          value={key}
                          clearButton={true}
                          onInput={(e) => {
                            setKey(e.target.value);
                            onInputFilter && onInputFilter(e.target.value);
                          }}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                        />
                        <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
                          <MagnifyingGlassIcon className="w-6 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-y">
                    <PickerAddMember
                      onChange={(values) => {
                        let item = {
                          ...values,
                          label: values.FullName,
                          value: values.ID,
                          suffix: value?.MobilePhone
                        };
                        if (isMulti) {
                          onChange(value ? [...value, item] : [item]);
                        } else {
                          onChange(item);
                          isRequired && close();
                        }
                      }}
                    >
                      {({ open }) => (
                        <div
                          className="relative py-3.5 pl-4 pr-8 border-b last:border-0"
                          onClick={open}
                        >
                          <div className="flex items-center">
                            <div className="w-11 h-11">
                              <div className="relative flex items-center justify-center h-full overflow-hidden rounded-full bg-success-light w-11">
                                <PlusIcon className="w-6 text-success" />
                              </div>
                            </div>
                            <div className="pl-4">
                              <div className="mb-px font-medium">
                                Thêm khách hàng mới
                              </div>
                              <div className="text-[#757676] font-light">
                                Tạo nhanh 1 khách hàng mới
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </PickerAddMember>
                  </div>

                  <div className="overflow-auto pb-safe-b grow">
                    {options &&
                      options.length > 0 &&
                      options.map((item, index) => (
                        <div
                          className={clsx(
                            "relative py-3.5 pl-4 pr-8 border-b last:border-0",
                            (!isMulti
                              ? value?.value === item?.value
                              : value &&
                                value?.some((x) => x.value === item?.value)) &&
                              "text-primary"
                          )}
                          onClick={() => {
                            if (isMulti) {
                              onChange(value ? [...value, item] : [item]);
                            } else {
                              isRequired
                                ? onChange(item)
                                : onChange(
                                    value?.value === item?.value ? null : item
                                  );
                              isRequired && close();
                            }
                          }}
                          key={index}
                        >
                          <div className="flex items-center">
                            <div className="w-11 h-11">
                              <div className="relative h-full overflow-hidden bg-gray-100 rounded-full w-11">
                                <svg
                                  className="absolute w-12 h-12 text-gray-400 -bottom-2 left-2/4 -translate-x-2/4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="pl-4">
                              <div
                                className={clsx(
                                  "mb-px font-medium",
                                  item.index === 0 && "text-success"
                                )}
                              >
                                {item?.label}
                              </div>
                              <div className="text-[#757676]">
                                {item.index === 0
                                  ? "Đặt lịch cho khách vãng lai"
                                  : item?.suffix}
                              </div>
                            </div>
                          </div>

                          <CheckIcon
                            className={clsx(
                              "absolute w-6 top-2/4 right-4 -translate-y-2/4",
                              (
                                !isMulti
                                  ? value?.value === item?.value
                                  : value &&
                                    value?.some((x) => x.value === item?.value)
                              )
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </div>
                      ))}
                    {(!options || options.length === 0) && (
                      <div>
                        <NoFound
                          Title="Không có kết quả nào."
                          Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>,
              document.getElementById("framework7-root")
            )}
        </>
      </AnimatePresence>
    );
  }
);

export default SelectBookingPicker;

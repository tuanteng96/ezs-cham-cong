import NoFound from "@/components/NoFound";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import {
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, f7ready, Input } from "framework7-react";
import React, {
  forwardRef,
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const SelectPicker = forwardRef(
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
      isDisabled = false,
      isFilter = false,
      isFilterFocus = false,
      onInputFilter,
      autoHeight = false,
      onClose,
      closes,
      actions = [],
      formRender = null,
    },
    ref
  ) => {
    const [key, setKey] = useState("");
    const [visible, setVisible] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
      if (visible && isFilter && isFilterFocus && inputRef?.current) {
        const timer = setTimeout(() => {
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [visible, isFilter, isFilterFocus]);

    let open = () => {
      setVisible(true);
    };

    let close = () => {
      setVisible(false);
      setKey("");
      onInputFilter && onInputFilter("");
      onClose && onClose(value);
    };

    return (
      <>
        <div
          className="relative"
          onClick={() => !isDisabled && open()}
          ref={ref}
        >
          <div
            className={clsx(
              "no-keyboard flex w-full pl-4 pr-24 py-3 border rounded focus:border-primary shadow-input",
              errorMessageForce ? "border-danger" : "border-[#d5d7da]",
              isDisabled && "bg-[#f0f0f0]"
            )}
          >
            {(!value || value.length === 0) && (
              <span className="text-[#b5b6c3]">{placeholder || "Chọn"}</span>
            )}
            {isMulti && value && (
              <div className="flex flex-wrap gap-2">
                {value &&
                  value.map((x, idx) => (
                    <div className="flex bg-gray-100 rounded-sm" key={idx}>
                      <div className="px-1.5 py-px text-[13px]">{x.label}</div>
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
            )}
            {!isMulti && value && (
              <div className="truncate">
                {Array.isArray(value)
                  ? value.map((x) => x.label).toString()
                  : value?.label || ""}
              </div>
            )}
          </div>
          <div className="absolute right-0 flex h-full top-2/4 -translate-y-2/4">
            <div className="flex items-center justify-center w-12 h-full">
              <ChevronDownIcon className="w-5" />
            </div>
            {isClearable &&
            !isDisabled &&
            (value && Array.isArray(value) ? value.length > 0 : value) ? (
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

        {createPortal(
          <AnimatePresence>
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
                  className={clsx(
                    "relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]",
                    !autoHeight &&
                      "h-[calc(100%-var(--ezs-safe-area-top)-var(--f7-navbar-height))]"
                  )}
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
                        <input
                          ref={inputRef}
                          className="text-[15px] pl-14 rounded border w-full focus:border-primary shadow-input border-[#d5d7da] h-12"
                          type="text"
                          placeholder={placeholderInput}
                          value={key}
                          onInput={(e) => {
                            setKey(e.target.value);
                            onInputFilter && onInputFilter(e.target.value);
                          }}
                          // onFocus={(e) =>
                          //   KeyboardsHelper.setAndroid({
                          //     Type: "body",
                          //     Event: e,
                          //   })
                          // }
                        />
                        <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
                          <MagnifyingGlassIcon className="w-6 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-auto pb-safe-b grow">
                    {options &&
                      options.length > 0 &&
                      options.map((item, index) => (
                        <div
                          className={clsx(
                            "relative py-4 pl-4 pr-8 border-b last:border-0",
                            (!isMulti && !Array.isArray(value)
                              ? value?.value === item?.value
                              : value &&
                                value?.some((x) => x.value === item?.value)) &&
                              "text-primary"
                          )}
                          onClick={() => {
                            if (isMulti) {
                              if (
                                value &&
                                value.some((x) => x.value === item.value)
                              ) {
                                onChange(
                                  value.filter((x) => x.value !== item.value)
                                );
                              } else {
                                onChange(value ? [...value, item] : [item]);
                              }
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
                          {item?.label}
                          {item?.desc && (
                            <div className="text-gray-400 mt-1 text-[13px]">
                              {item?.desc}
                            </div>
                          )}
                          {item?.sub && (
                            <div className="text-gray-400 mt-1 text-[13px]">
                              {item?.sub}
                            </div>
                          )}
                          <CheckIcon
                            className={clsx(
                              "absolute w-6 top-2/4 right-4 -translate-y-2/4",
                              (
                                !isMulti && !Array.isArray(value)
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
                      <div className="mb-4">
                        <NoFound
                          Title="Không có kết quả nào."
                          Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                        />
                      </div>
                    )}
                  </div>

                  {actions && actions.length > 0 && (
                    <div className="pb-safe-b">
                      {formRender && formRender}
                      <div className="flex gap-3 p-4">
                        {actions.map((item, index) => (
                          <Fragment key={index}>
                            {item?.renderButton ? (
                              item?.renderButton
                            ) : (
                              <Button
                                onClick={() => item.onClick(close)}
                                type="button"
                                className={item.className}
                                fill
                                large
                                preloader
                                loading={item.isLoading}
                                disabled={item.isLoading || item.isDisabled}
                              >
                                {item?.Title}
                              </Button>
                            )}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                  {closes && (
                    <div className="pb-safe-b">
                      <div className="p-4">
                        <div
                          className={clsx(
                            closes?.className ||
                              "h-12 bg-[#E4E6EF] text-[#3F4254] rounded-[25px] flex items-center justify-center font-medium"
                          )}
                          onClick={close}
                        >
                          {closes?.Title}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.getElementById("framework7-root")
        )}
      </>
    );
  }
);

export default SelectPicker;

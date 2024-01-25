import {
  CheckIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { createPortal } from "react-dom";

function SelectPicker({
  options = [],
  value,
  onChange,
  label,
  placeholder,
  errorMessage,
  errorMessageForce,
  isRequired = true,
}) {
  const [visible, setVisible] = useState(false);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence initial={false}>
      <>
        <div className="relative" onClick={open}>
          <input
            className={clsx(
              "no-keyboard flex w-full px-4 py-3.5 border rounded text-input focus:border-primary shadow-[0_4px_6px_0_rgba(16,25,40,.06)",
              errorMessageForce ? "border-danger" : "border-[#d5d7da]"
            )}
            placeholder={placeholder}
            value={value?.label ? value?.label : ""}
            readOnly
          ></input>
          <ChevronDownIcon className="absolute w-5 right-4 top-2/4 -translate-y-2/4" />
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
                <div className="overflow-auto pb-safe-b grow">
                  {options &&
                    options.length > 0 &&
                    options.map((item, index) => (
                      <div
                        className={clsx(
                          "relative py-4 pl-4 pr-8 border-b last:border-0 text-input",
                          value?.value === item?.value && "text-primary"
                        )}
                        onClick={() => {
                          isRequired
                            ? onChange(item)
                            : onChange(
                                value?.value === item?.value ? null : item
                              );
                          isRequired && close();
                        }}
                        key={index}
                      >
                        {item?.label}
                        <CheckIcon
                          className={clsx(
                            "absolute w-6 top-2/4 right-4 -translate-y-2/4",
                            value?.value === item?.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </div>
                    ))}
                </div>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default SelectPicker;

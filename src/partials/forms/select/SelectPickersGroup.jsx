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
import { Input } from "framework7-react";
import React, { forwardRef, useState } from "react";
import { createPortal } from "react-dom";

const SelectPickersGroup = forwardRef(
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
      isFilter = false,
      isClearable = true,
      isDisabled = false,
      onInputFilter,
      onClose,
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const [key, setKey] = useState("");

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
      <AnimatePresence initial={false}>
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
              {isMulti && (
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
                            if (!isDisabled) {
                              onChange(
                                value.filter((o) => x.value !== o.value)
                              );
                            }
                          }}
                        >
                          <XMarkIcon className="w-3.5" />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {!isMulti && (
                <>
                  {Array.isArray(value)
                    ? value.map((x) => x.label).toString()
                    : value?.label || ""}
                </>
              )}

              {(!value || value.length === 0) && (
                <div className="text-muted">{placeholder}</div>
              )}
              <div className="absolute right-0 flex h-full top-2/4 -translate-y-2/4">
                <div className="flex items-center justify-center w-12 h-full">
                  <ChevronDownIcon className="w-5" />
                </div>
                {isClearable &&
                  !isDisabled &&
                  value &&
                  (Array.isArray(value) ? value.length > 0 : value) && (
                    <div
                      className="flex items-center justify-center w-12 h-full relative after:content-[''] after:absolute after:right-0 after:h-4/6 after:w-[1px] after:bg-[#d5d7da] after:left-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange("");
                      }}
                    >
                      <XMarkIcon className="w-5" />
                    </div>
                  )}
              </div>
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

                  <div className="overflow-auto pb-safe-b grow">
                    {options &&
                      options.length > 0 &&
                      options.filter(
                        (x) => x.options && x.options.length > 0
                      ) &&
                      options
                        .filter((x) => x.options && x.options.length > 0)
                        .map((group, i) => (
                          <div key={i}>
                            <div className="px-4 uppercase font-medium text-[13px] text-muted my-2">
                              {group.label}
                            </div>
                            <div>
                              {group.options &&
                                group.options.map((item, index) => (
                                  <div
                                    className={clsx(
                                      "relative py-4 pl-4 pr-8 border-b last:border-0",
                                      (!isMulti && !Array.isArray(value)
                                        ? value?.value === item?.value
                                        : value &&
                                          value?.some(
                                            (x) => x.value === item?.value
                                          )) && "text-primary"
                                    )}
                                    onClick={() => {
                                      if (isMulti) {
                                        let newValue = value ? [...value] : [];
                                        let i = newValue.findIndex(
                                          (x) => x.value === item.value
                                        );
                                        if (i > -1) {
                                          newValue = newValue.filter(
                                            (x) => x.value !== item.value
                                          );
                                        } else {
                                          newValue.push(item);
                                        }
                                        onChange(newValue);
                                      } else {
                                        isRequired
                                          ? onChange(item)
                                          : onChange(
                                              value?.value === item?.value
                                                ? null
                                                : item
                                            );
                                        isRequired && close();
                                      }
                                    }}
                                    key={index}
                                  >
                                    {item?.label}
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
                                              value?.some(
                                                (x) => x.value === item?.value
                                              )
                                        )
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    {(!options ||
                      options.length === 0 ||
                      (options &&
                        options.filter((x) => x.options && x.options.length > 0)
                          .length === 0)) && (
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

// function SelectPickersGroup({
//   options = [],
//   value,
//   onChange,
//   label,
//   placeholder,
//   placeholderInput,
//   errorMessage,
//   errorMessageForce,
//   isMulti = false,
//   isRequired = true,
//   isFilter = false,
//   isClearable = true,
//   isDisabled = false,
//   onInputFilter,
// }) {
//   const [visible, setVisible] = useState(false);
//   const [key, setKey] = useState("");

//   let open = () => {
//     setVisible(true);
//   };

//   let close = () => {
//     setVisible(false);
//     setKey("");
//     onInputFilter && onInputFilter("");
//   };

//   return (
//     <AnimatePresence initial={false}>
//       <>
//         <div className="relative" onClick={() => !isDisabled && open()}>
//           <div
//             className={clsx(
//               "no-keyboard flex w-full pl-4 pr-24 py-3 border rounded focus:border-primary shadow-[0_4px_6px_0_rgba(16,25,40,.06)",
//               errorMessageForce ? "border-danger" : "border-[#d5d7da]",
//               isDisabled && "bg-[#f0f0f0]"
//             )}
//           >
//             {isMulti && (
//               <div className="flex flex-wrap gap-2">
//                 {value &&
//                   value.map((x, idx) => (
//                     <div className="flex bg-gray-100 rounded-sm" key={idx}>
//                       <div className="px-1.5 py-px text-[13px]">{x.label}</div>
//                       <div
//                         className="flex items-center px-1 bg-gray-200"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           if (!isDisabled) {
//                             onChange(value.filter((o) => x.value !== o.value));
//                           }
//                         }}
//                       >
//                         <XMarkIcon className="w-3.5" />
//                       </div>
//                     </div>
//                   ))}
//               </div>
//             )}

//             {!isMulti && (
//               <>
//                 {Array.isArray(value)
//                   ? value.map((x) => x.label).toString()
//                   : value?.label || ""}
//               </>
//             )}

//             {(!value || value.length === 0) && (
//               <div className="text-muted">{placeholder}</div>
//             )}
//             <div className="absolute right-0 flex h-full top-2/4 -translate-y-2/4">
//               <div className="flex items-center justify-center w-12 h-full">
//                 <ChevronDownIcon className="w-5" />
//               </div>
//               {isClearable &&
//                 !isDisabled &&
//                 value &&
//                 (Array.isArray(value) ? value.length > 0 : value) && (
//                   <div
//                     className="flex items-center justify-center w-12 h-full relative after:content-[''] after:absolute after:right-0 after:h-4/6 after:w-[1px] after:bg-[#d5d7da] after:left-0"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       onChange("");
//                     }}
//                   >
//                     <XMarkIcon className="w-5" />
//                   </div>
//                 )}
//             </div>
//           </div>
//         </div>
//         {errorMessage && errorMessageForce && (
//           <div className="mt-1.5 text-xs text-danger font-light">
//             {errorMessage}
//           </div>
//         )}

//         {visible &&
//           createPortal(
//             <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
//               <motion.div
//                 key={visible}
//                 className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 onClick={close}
//               ></motion.div>
//               <motion.div
//                 className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[calc(100%-var(--ezs-safe-area-top)-var(--f7-navbar-height))]"
//                 initial={{ opacity: 0, translateY: "100%" }}
//                 animate={{ opacity: 1, translateY: "0%" }}
//                 exit={{ opacity: 0, translateY: "100%" }}
//               >
//                 <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
//                   {label}
//                   <div
//                     className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
//                     onClick={close}
//                   >
//                     <XMarkIcon className="w-6" />
//                   </div>
//                 </div>
//                 {isFilter && (
//                   <div className="px-4 mb-4">
//                     <div className="relative">
//                       <Input
//                         className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14"
//                         type="text"
//                         placeholder={placeholderInput}
//                         value={key}
//                         clearButton={true}
//                         onInput={(e) => {
//                           setKey(e.target.value);
//                           onInputFilter && onInputFilter(e.target.value);
//                         }}
//                         onFocus={(e) =>
//                           KeyboardsHelper.setAndroid({ Type: "body", Event: e })
//                         }
//                       />
//                       <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
//                         <MagnifyingGlassIcon className="w-6 text-gray-500" />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="overflow-auto pb-safe-b grow">
//                   {options &&
//                     options.length > 0 &&
//                     options.map((group, i) => (
//                       <div key={i}>
//                         <div className="px-4 uppercase font-medium text-[13px] text-muted my-2">
//                           {group.label}
//                         </div>
//                         <div>
//                           {group.options &&
//                             group.options.map((item, index) => (
//                               <div
//                                 className={clsx(
//                                   "relative py-4 pl-4 pr-8 border-b last:border-0",
//                                   (!isMulti && !Array.isArray(value)
//                                     ? value?.value === item?.value
//                                     : value &&
//                                       value?.some(
//                                         (x) => x.value === item?.value
//                                       )) && "text-primary"
//                                 )}
//                                 onClick={() => {
//                                   if (isMulti) {
//                                     let newValue = value ? [...value] : [];
//                                     let i = newValue.findIndex(
//                                       (x) => x.value === item.value
//                                     );
//                                     if (i > -1) {
//                                       newValue = newValue.filter(
//                                         (x) => x.value !== item.value
//                                       );
//                                     } else {
//                                       newValue.push(item);
//                                     }
//                                     onChange(newValue);
//                                   } else {
//                                     isRequired
//                                       ? onChange(item)
//                                       : onChange(
//                                           value?.value === item?.value
//                                             ? null
//                                             : item
//                                         );
//                                     isRequired && close();
//                                   }
//                                 }}
//                                 key={index}
//                               >
//                                 {item?.label}
//                                 <CheckIcon
//                                   className={clsx(
//                                     "absolute w-6 top-2/4 right-4 -translate-y-2/4",
//                                     (
//                                       !isMulti && !Array.isArray(value)
//                                         ? value?.value === item?.value
//                                         : value &&
//                                           value?.some(
//                                             (x) => x.value === item?.value
//                                           )
//                                     )
//                                       ? "opacity-100"
//                                       : "opacity-0"
//                                   )}
//                                 />
//                               </div>
//                             ))}
//                         </div>
//                       </div>
//                     ))}
//                   {(!options || options.length === 0) && (
//                     <div>
//                       <NoFound
//                         Title="Không có kết quả nào."
//                         Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
//                       />
//                     </div>
//                   )}
//                 </div>
//               </motion.div>
//             </div>,
//             document.getElementById("framework7-root")
//           )}
//       </>
//     </AnimatePresence>
//   );
// }

export default SelectPickersGroup;

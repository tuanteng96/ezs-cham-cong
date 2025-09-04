import StringHelpers from "@/helpers/StringHelpers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { createPortal } from "react-dom";

function PickerDebt({ children, data }) {
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
        {children({ open, close })}
        {visible &&
          createPortal(
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[80%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  ĐH #{data?.Id}
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="flex flex-col h-full overflow-auto pb-safe-b grow">
                  {data?.ListDebt &&
                    data?.ListDebt.map((item, index) => (
                      <div
                        className="p-4 border-b border-dashed last:border-b-0"
                        key={index}
                      >
                        <div className="mb-1 font-medium">{item.ProdTitle}</div>
                        <div className="flex justify-between">
                          <div>SL x {item.Qty}</div>
                          <div className="font-bold font-lato">
                            {StringHelpers.formatVND(item.ToPay)}
                          </div>
                        </div>
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

export default PickerDebt;

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import StringHelpers from "@/helpers/StringHelpers";

function PickerCashViewTotal({ children, Items, Title }) {
  const [visible, setVisible] = useState(false);

  let close = () => {
    setVisible(false);
  };

  return (
    <>
      {children({
        open: () => setVisible(true),
      })}
      {createPortal(
        <AnimatePresence>
          {visible && (
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[calc(100%-var(--f7-safe-area-top)-var(--f7-navbar-height))] w-full"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="flex flex-col h-full pb-safe-b">
                  <div className="relative px-4 py-5 text-lg font-semibold text-left border-b">
                    {Title}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 overflow-auto">
                    {Items &&
                      Items.map((item, index) => (
                        <div
                          className="flex justify-between py-3.5 border-b border-dashed last:border-0"
                          key={index}
                        >
                          <div className="text-gray-500">{item?.Title}</div>
                          <div className="font-bold font-lato">
                            {StringHelpers.formatVND(item?.Value)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
}

export default PickerCashViewTotal;

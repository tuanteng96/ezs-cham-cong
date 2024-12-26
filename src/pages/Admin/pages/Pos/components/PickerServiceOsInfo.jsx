import StringHelpers from "@/helpers/StringHelpers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import moment from "moment";
import React, { useState } from "react";
import { createPortal } from "react-dom";

function PickerServiceOsInfo({ children, data }) {
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
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
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
                <div className="relative flex py-5 pl-4 text-xl font-semibold text-center pr-14">
                  <div className="truncate">{data?.ProdService2 ? data?.ProdService2 : (data?.ProdService || data?.Title)}</div>
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="overflow-auto pb-safe-b grow">
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Mã buổi dịch vụ</div>
                    <div className="w-2/4 font-medium text-right">
                      {data?.ID}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Tên thẻ</div>
                    <div className="w-2/4 font-medium text-right">
                      {data?.OrderTitle}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Dịch vụ</div>
                    <div className="w-2/4 font-medium text-right">
                      {data?.ConvertTitle ? `${data?.ConvertTitle} (Chuyển đổi)` : data?.ProdService}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Giá bán</div>
                    <div className="w-2/4 font-medium text-right">
                      {
                        data?.CostMerthod === 1 && StringHelpers.formatVND(data?.Cost1)
                      }
                      {
                        data?.CostMerthod === 2 && StringHelpers.formatVND(data?.Cost2)
                      }
                      {
                        data?.CostMerthod === 3 && StringHelpers.formatVND(data?.Cost3)
                      }
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Giá Cost</div>
                    <div className="w-2/4 font-medium text-right">
                      {StringHelpers.formatVND(data?.CostBase)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerServiceOsInfo;

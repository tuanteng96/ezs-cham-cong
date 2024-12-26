import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, useStore } from "framework7-react";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function PickerHistoryAff({ children, data }) {
  const [visible, setVisible] = useState(false);
  const [Items, setItems] = useState(null);

  useEffect(() => {
    if (!visible) {
      let newItems = [];
      if (data) {
        newItems.push(data);
      }
      if (data?.His && data?.His.length > 0) {
        newItems = [...newItems, ...data?.His.reverse()];
      }

      setItems(newItems);
    }
  }, [visible]);

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
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  Lịch sử thay đổi
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="overflow-auto pb-safe-b grow">
                  {Items &&
                    Items.map((item, index) => (
                      <div className="p-4 border-b border-dashed" key={index}>
                        <div className="mb-1">
                          <span className="font-bold font-lato">
                            {moment(item.Date).format("HH:mm DD-MM-YYYY")}
                          </span>
                          <span className="px-1">-</span>
                          <span className="font-medium">
                            {item.UserName || "Chưa xác định"}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          Thay đổi khách hàng giới thiệu thành
                          <span className="pl-1 font-medium text-black">
                            {item.Name || "Chưa xác định"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-4">
                  <Button
                    type="button"
                    className="rounded-full bg-danger"
                    fill
                    large
                    preloader
                    onClick={close}
                  >
                    Đóng
                  </Button>
                </div>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerHistoryAff;

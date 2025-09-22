import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import StringHelpers from "@/helpers/StringHelpers";
import clsx from "clsx";

function PickerCashView({ children, item, TitleTotal, onClose, onOpen }) {
  const [visible, setVisible] = useState(false);

  const open = () => {
    setVisible(true);
    onOpen && onOpen();
  };

  let close = () => {
    setVisible(false);
    onClose && onClose();
  };

  return (
    <>
      {children({
        open,
        close,
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
                    {item?.CashType}
                    <span className="px-1">-</span>
                    {moment(item?.CreatedDate).format("HH:mm DD/MM/YYYY")}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 overflow-auto">
                    <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                      <div className="text-gray-500">ID</div>
                      <div className="font-bold font-lato">#{item?.ID}</div>
                    </div>
                    <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                      <div className="text-gray-500">{TitleTotal}</div>
                      <div
                        className={clsx(
                          "font-bold font-lato text-[16px]",
                          item?.CashType === "Thu"
                            ? "text-success"
                            : "text-danger"
                        )}
                      >
                        {StringHelpers.formatVNDPositive(
                          item?.CashType === "Thu"
                            ? item.GroupEBank +
                                item.GroupCardBank +
                                item.GroupCash
                            : item?.Value
                        )}
                      </div>
                    </div>
                    {item?.GroupCash > 0 && (
                      <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                        <div className="text-gray-500">Tiền mặt</div>
                        <div className="font-bold font-lato">
                          {StringHelpers.formatVND(item?.GroupCash)}
                        </div>
                      </div>
                    )}
                    {item?.GroupEBank > 0 && (
                      <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                        <div className="text-gray-500">Chuyển khoản</div>
                        <div className="font-bold font-lato">
                          {StringHelpers.formatVND(item?.GroupEBank)}
                        </div>
                      </div>
                    )}
                    {item?.GroupCardBank > 0 && (
                      <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                        <div className="text-gray-500">Quyẹt thẻ</div>
                        <div className="font-bold font-lato">
                          {StringHelpers.formatVND(item?.GroupCardBank)}
                        </div>
                      </div>
                    )}
                    {item?.CustomType && (
                      <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                        <div className="w-1/3 text-gray-500">Phân loại</div>
                        <div className="flex-1 text-right">
                          {item?.CustomType}
                        </div>
                      </div>
                    )}
                    {item?.CustomType && (
                      <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                        <div className="w-1/3 text-gray-500">Tag</div>
                        <div className="flex-1 text-right">
                          {item?.CustomType}
                        </div>
                      </div>
                    )}
                    {item?.Desc ? (
                      <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                        <div className="w-1/3 text-gray-500">Nội dung</div>
                        <div className="flex-1 text-right">{item?.Desc}</div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {item?.SourceID ? (
                      <div className="flex justify-between py-3.5 border-b border-dashed last:border-0">
                        <div className="w-1/3 text-gray-500">Nguồn</div>
                        <div className="flex-1 text-right">
                          Đơn hàng
                          <span className="text-primary pl-1.5">
                            #{item?.SourceID}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
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

export default PickerCashView;

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "framework7-react";
import moment from "moment";

function PickerHistoryCoachs({ children, Coachs }) {
  const [visible, setVisible] = useState(false);

  const close = () => {
    setVisible(false);
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
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[90%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="flex flex-col h-full pb-safe-b">
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Lịch sử thay đổi
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="overflow-auto grow">
                    {Coachs &&
                      Coachs.sort(
                        (a, b) =>
                          moment(b.CreateDate, "YYYY-MM-DD HH:mm").valueOf() -
                          moment(a.CreateDate, "YYYY-MM-DD HH:mm").valueOf()
                      ).map((x, i) => (
                        <div
                          className="border-b border-dashed last:border-0 px-4 py-2.5"
                          key={i}
                        >
                          <div>
                            Ngày
                            <span className="pl-1">
                              {moment(x.CreateDate, "YYYY-MM-DD HH:mm").format(
                                "DD-MM-YYYY HH:mm"
                              )}
                            </span>
                          </div>
                          <div>
                            {x?.Coach ? (
                              <>
                                Thay đổi huấn luyện viên thành{" "}
                                {x?.Coach?.FullName}
                              </>
                            ) : (
                              <>Huỷ huấn luyện viên khỏi lớp.</>
                            )}
                          </div>
                          <div>Thực hiện bởi {x?.Staff?.FullName}</div>
                        </div>
                      ))}
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                    >
                      Đóng
                    </Button>
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

export default PickerHistoryCoachs;

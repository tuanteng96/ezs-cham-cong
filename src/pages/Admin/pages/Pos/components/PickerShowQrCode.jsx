import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";

function PickerShowQrCode({ children, Title }) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!visible) setData(null);
  }, [visible]);

  let open = (values) => {
    setVisible(true);
    setData(values);
  };

  let close = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence initial={false}>
      <>
        {children({ open: (values) => open(values), close })}
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
                  {Title}
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="overflow-auto pb-safe-b grow">
                  <div className="flex flex-col items-center justify-center gap-3 pb-4">
                    <div className="px-8 mb-2 font-light text-center text-gray-500">
                      Khách hàng thực hiện quyét mã QR bên dưới để đăng
                      nhập.
                    </div>
                    <div className="p-3 border rounded">
                      {data && (
                        <QRCode
                          size={256}
                          className="w-[256px]"
                          value={data}
                          viewBox={`0 0 256 256`}
                        />
                      )}
                    </div>
                  </div>
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

export default PickerShowQrCode;

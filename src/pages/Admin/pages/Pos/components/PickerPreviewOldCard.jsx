import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Button } from "framework7-react";
import clsx from "clsx";

function PickerPreviewOldCard({ children, data, TypeOs, buttonRef }) {
  const [visible, setVisible] = useState(false);
  let [Os, setOs] = useState({
    Total: 0,
    Use: 0,
    Expired: 0,
  });
  const [isDisable, setIsDisable] = useState(true);

  useEffect(() => {
    if (data && data?.DICH_VU_THE) {
      let { source } = data?.DICH_VU_THE;
      if (source.Combo) {
        let Combo = JSON.parse(source.Combo);
        if (Combo && Combo.length === 1) {
          let { qty } = {
            qty: Number(Combo[0].qty),
          };

          let obj = {
            Total: qty * Number(data?.SL),
            Use: 0,
            Expired: 0,
            Still: 0,
          };

          if (TypeOs === "DV_CON_BUOI") {
            obj.Use = Number(data?.BUOI_CON);
          }
          if (TypeOs === "DV_DANG_BH") {
            obj.Still = Number(data?.BUOI_BH_DA_LAM);
          }
          if (TypeOs === "DV_HET_BUOI") {
            obj.Expired = obj.Total;
          }
          setOs(obj);
          setIsDisable(false);
        } else {
          setIsDisable(true);
        }
      }
    }
  }, [data, visible]);

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
                  Xác nhận tạo thẻ cũ
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="flex flex-col h-full pb-safe-b">
                  <div className="px-4 overflow-auto grow">
                    {isDisable && (
                      <div className="text-center text-danger">
                        Không thể tạo thẻ cũ do dịch vụ không hợp lệ.
                      </div>
                    )}
                    {!isDisable && (
                      <div className="grid grid-cols-7 gap-2">
                        {Array(
                          Os.Total - Os.Use > 0
                            ? Os.Total
                            : Os.Total + Os.Use - Os.Total
                        )
                          .fill()
                          .map((x, index) => (
                            <div
                              className={clsx(
                                "relative flex items-center justify-center text-white rounded aspect-square",
                                TypeOs === "DV_CON_BUOI"
                                  ? Os.Total - Os.Use > 0
                                    ? Array(Os.Total - Os.Use)
                                        .fill()
                                        .map((_, i) => i)
                                        .includes(index)
                                      ? "bg-[#808080]"
                                      : "bg-primary"
                                    : "bg-primary"
                                  : "",
                                TypeOs === "DV_DANG_BH"
                                  ? index + 1 < Os.Still
                                    ? "bg-[#808080]"
                                    : "bg-primary"
                                  : "",
                                TypeOs === "DV_HET_BUOI" && "bg-[#808080]"
                              )}
                              key={index}
                            >
                              {index + 1}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Button
                      onClick={() => {
                        buttonRef?.current?.click();
                        close();
                      }}
                      type="button"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      disabled={isDisable}
                    >
                      Xác nhận thẻ cũ
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

export default PickerPreviewOldCard;

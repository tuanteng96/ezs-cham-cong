import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

function PickerSheet({ children, Options = [], Title = "", Close = null }) {
  const [visible, setVisible] = useState(false);

  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    const el = document.getElementById("framework7-root");
    setPortalRoot(el);
  }, []);

  const close = () => setVisible(false);

  if (!portalRoot) return null;

  return (
    <>
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
                  className="relative z-20 rounded-t-[var(--f7-sheet-border-radius)]"
                  initial={{ opacity: 0, translateY: "100%" }}
                  animate={{ opacity: 1, translateY: "0%" }}
                  exit={{ opacity: 0, translateY: "100%" }}
                >
                  <div className="flex flex-col h-full pb-safe-b">
                    <div className="flex flex-col p-2.5">
                      <div className="overflow-hidden bg-white rounded-xl mb-2.5 last:mb-0">
                        {Title && (
                          <div className="flex items-center justify-center border-b h-[54px] text-muted">
                            {Title}
                          </div>
                        )}

                        <div>
                          {Options &&
                            Options.map((item, index) => (
                              <div
                                className={clsx(
                                  item?.className ||
                                    "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px]"
                                )}
                                key={index}
                                onClick={() => {
                                  setVisible(true);
                                  item.onClick && item.onClick(item);
                                }}
                              >
                                {item.Title}
                              </div>
                            ))}
                        </div>
                      </div>
                      {Close && (
                        <div className="mb-2.5 last:mb-0">
                          <div
                            className={clsx(
                              Close?.className ||
                                "flex items-center justify-center h-[54px] font-medium text-center bg-white rounded-xl cursor-pointer text-danger text-[15px]"
                            )}
                            onClick={() => setVisible(false)}
                          >
                            {Close?.Title}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          portalRoot
        )}
      </>
    </>
  );
}

export default PickerSheet;

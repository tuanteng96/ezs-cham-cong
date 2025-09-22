import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

const DefaultWrapper = ({ children }) => <>{children}</>;

function PickerSheet({ children, Options = [], Title = "", Close = null }) {
  const [visible, setVisible] = useState(false);
  const [portalRoot, setPortalRoot] = useState(null);
  const [hideForChild, setHideForChild] = useState(false);

  useEffect(() => {
    const el = document.getElementById("framework7-root");
    setPortalRoot(el);
  }, []);

  useEffect(() => {
    if (!visible) setHideForChild(false);
  }, [visible]);

  const close = () => setVisible(false);
  const open = () => setVisible(true);

  if (!portalRoot) return null;

  const isByGroup =
    Options &&
    Options.some(
      (item) =>
        typeof item.GroupTitle !== "undefined" && Array.isArray(item.Options)
    );

  return (
    <>
      {children({ open })}

      {createPortal(
        <AnimatePresence key={visible}>
          {visible && (
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              {/* Overlay */}
              <motion.div
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: hideForChild ? 0 : 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>

              {/* Sheet */}
              <motion.div
                className="relative z-20 rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div
                  className={clsx(
                    "flex flex-col h-full pb-safe-b transition-opacity duration-300",
                    hideForChild
                      ? "opacity-0 pointer-events-none"
                      : "opacity-100"
                  )}
                >
                  {/* Options Container */}
                  <motion.div
                    animate={{
                      opacity: hideForChild ? 0 : 1,
                      y: hideForChild ? 10 : 0,
                    }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col p-2.5"
                  >
                    <div
                      className={clsx(
                        "overflow-hidden rounded-xl mb-2.5 last:mb-0",
                        !isByGroup && "bg-white"
                      )}
                    >
                      {/* Title khi không group */}
                      {!isByGroup && Title && (
                        <div className="flex items-center justify-center border-b h-[54px] text-muted">
                          {Title}
                        </div>
                      )}

                      {/* Dạng group */}
                      {isByGroup && (
                        <div>
                          {Options.map((group, gIndex) => (
                            <div
                              key={`group-${gIndex}`}
                              className="overflow-hidden bg-white rounded-xl mb-2.5 last:mb-0"
                            >
                              {group.GroupTitle && (
                                <div className="flex items-center justify-center border-b h-[54px] text-muted">
                                  {group.GroupTitle}
                                </div>
                              )}
                              <div>
                                {group.Options.map((child, cIndex) => {
                                  const Wrapper =
                                    child.component || DefaultWrapper;
                                  return (
                                    <Wrapper
                                      key={cIndex}
                                      close={close}
                                      open={open}
                                      setHideForChild={setHideForChild}
                                    >
                                      <div
                                        className={clsx(
                                          child?.className ||
                                            "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                        )}
                                        onClick={() => {
                                          if (child.component) return;
                                          child.onClick &&
                                            child.onClick(child, {
                                              close,
                                              open,
                                              setHideForChild,
                                            });
                                          if (child.autoClose !== false)
                                            close();
                                        }}
                                      >
                                        {child.Title}
                                        {child.Count ? (
                                          <div className="text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center font-lato ml-1.5">
                                            {child.Count}
                                          </div>
                                        ) : null}
                                      </div>
                                    </Wrapper>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dạng thường */}
                      {!isByGroup && (
                        <div>
                          {Options.map((item, index) => {
                            const Wrapper = item.component || DefaultWrapper;
                            return (
                              <Wrapper
                                key={index}
                                open={open}
                                close={close}
                                setHideForChild={setHideForChild}
                              >
                                <div
                                  className={clsx(
                                    item?.className ||
                                      "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                  )}
                                  onClick={() => {
                                    if (item.component) return;
                                    item.onClick &&
                                      item.onClick(item, {
                                        close,
                                        open,
                                        setHideForChild,
                                      });
                                    if (item.autoClose !== false) close();
                                  }}
                                >
                                  {item.Title}
                                  {item.Count ? (
                                    <div className="text-white bg-danger text-[11px] px-1.5 min-w-[15px] h-[17px] leading-none rounded-full flex items-center justify-center font-lato ml-1.5">
                                      {item.Count}
                                    </div>
                                  ) : null}
                                </div>
                              </Wrapper>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Nút đóng */}
                    {Close && (
                      <div className="mb-2.5 last:mb-0">
                        <div
                          className={clsx(
                            Close?.className ||
                              "flex items-center justify-center h-[54px] font-medium text-center bg-white rounded-xl cursor-pointer text-danger text-[15px]"
                          )}
                          onClick={close}
                        >
                          {Close?.Title}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        portalRoot
      )}
    </>
  );
}

export default PickerSheet;

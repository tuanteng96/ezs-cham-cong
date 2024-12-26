import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";

function PickerServiceUseOrder({ children, Prod }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { data, isLoading } = useQuery({
    queryKey: ["ServiceUseID", { Prod, visible }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsViewServiceUserOrder({
        ProdID: Prod?.ID,
        Token: Auth?.token,
      });
      return data;
    },
    enabled: visible,
  });

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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="flex flex-col h-full pb-safe-b">
                  <div className="relative flex justify-center px-4 py-5 pr-16 text-xl font-semibold text-center">
                    <div className="truncate">{Prod?.ProdTitle}</div>
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="overflow-auto grow">
                    {isLoading && (
                      <div className="p-4 border-b border-dashed last:border-0">
                        <div className="w-10/12 h-3.5 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="mt-3">
                          <div className="w-6/12 h-2.5 bg-gray-200 rounded-full animate-pulse mb-1.5"></div>
                          <div className="w-7/12 h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                    {!isLoading && (
                      <>
                        {data?.memberUsed &&
                          data?.memberUsed.map((item, index) => (
                            <div
                              className="p-4 border-b border-dashed last:border-0"
                              key={index}
                            >
                              <div className="mb-1 text-base font-medium">
                                {item?.FullName} - {item?.MobilePhone}
                              </div>
                              <div>
                                <div>
                                  <span className="text-gray-600">Số buổi</span>
                                  <span className="pl-1 font-bold font-lato text-success">
                                    {item?.Total}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Số buổi đã xoá
                                  </span>
                                  <span className="pl-1 font-bold font-lato text-danger">
                                    {item?.TotalPending}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
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

export default PickerServiceUseOrder;

import AdminAPI from "@/api/Admin.api";
import NoFound from "@/components/NoFound";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

function PickerAccumulate({ children, data, Order }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientDeleteAccumulateOrderId(body);
      await queryClient.invalidateQueries(["OrderManageID"]);
      return data;
    },
  });

  const onDelete = () => {
    f7.dialog.confirm("Xác nhận xoá tích luỹ đơn hàng ?", () => {
      var bodyFormData = new FormData();
      bodyFormData.append("orderid", Order?.ID);
      deleteMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
        },
        {
          onSuccess: ({ data }) => {
            close();
            toast.success("Xoá tích luỹ thành công.");
          },
        }
      );
    });
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
                  Tích luỹ
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="overflow-auto pb-safe-b grow">
                  {(!data || data.length === 0) && (
                    <NoFound
                      Title="Không có tích luỹ nào."
                      Desc="Rất tiếc ... Không tìm thấy tích luỹ nào"
                      svgClassName="w-2/4"
                      className="flex flex-col items-center min-h-full py-8"
                    />
                  )}
                  {data && data.length > 0 && (
                    <div className="px-4 pb-4">
                      {data.map((item, index) => (
                        <div
                          className="mb-4 border rounded last:mb-0"
                          key={index}
                        >
                          <div className="flex justify-between p-4 bg-gray-100 border-b">
                            <div className="font-medium">{item.TypeText}</div>
                            <div className="text-base font-bold font-lato">
                              {StringHelpers.formatVND(item.Value)}
                            </div>
                          </div>
                          <div className="p-4">{item.Desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {data && data.length > 0 && (
                  <div className="p-4 border-t">
                    <div className="flex items-end justify-between mb-2.5">
                      <div className="font-medium leading-3">Tổng tích luỹ</div>
                      <div className="text-base font-bold leading-3 font-lato">
                        ₫
                        {StringHelpers.formatVND(
                          ArrayHelpers.sumTotal(data, "Value")
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="rounded-full bg-danger"
                      fill
                      large
                      preloader
                      loading={deleteMutation.isLoading}
                      disabled={deleteMutation.isLoading}
                      onClick={onDelete}
                    >
                      Xoá tích luỹ
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerAccumulate;

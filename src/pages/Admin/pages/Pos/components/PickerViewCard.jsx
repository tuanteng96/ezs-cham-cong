import AdminAPI from "@/api/Admin.api";
import NoFound from "@/components/NoFound";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "react-query";
import { PickerEditDateCard } from ".";

function PickerViewCard({ children, data }) {
  const [visible, setVisible] = useState(false);
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["ClientViewCardID", { ID: data?.id }],
    queryFn: async () => {
      let { data: rs } = await AdminAPI.clientViewCardId({
        ID: data?.id,
        Token: Auth?.token,
      });
      return rs?.data || null;
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[80%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  Lịch sử sử dụng
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="overflow-auto pb-safe-b grow">
                  {(!result || result.length === 0) && (
                    <NoFound
                      Title="Không có kết quả nào."
                      Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                    />
                  )}
                  {result && result.length > 0 && (
                    <>
                      {result.map((sub, idx) => (
                        <div className="p-4 border-b border-dashed" key={idx}>
                          <div className="flex justify-between mb-2">
                            <PickerEditDateCard data={sub}>
                              {({ open }) => (
                                <div
                                  className="flex items-end"
                                  onClick={() =>
                                    adminTools_byStock?.hasRight && open()
                                  }
                                >
                                  {moment(sub.ngay).format("HH:mm DD/MM/YYYY")}
                                  {adminTools_byStock?.hasRight && (
                                    <PencilSquareIcon className="w-5 ml-2" />
                                  )}
                                </div>
                              )}
                            </PickerEditDateCard>

                            <div className="text-base font-bold font-lato text-danger">
                              {StringHelpers.formatVND(sub.gia_tri)}
                            </div>
                          </div>
                          <div className="font-light leading-5 text-gray-500">
                            {sub.san_pham}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerViewCard;

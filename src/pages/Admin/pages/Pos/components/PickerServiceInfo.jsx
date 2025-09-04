import AdminAPI from "@/api/Admin.api";
import StringHelpers from "@/helpers/StringHelpers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "framework7-react";
import moment from "moment";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "react-query";

function PickerServiceInfo({ children, data }) {
  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");

  const UseTransfer = useQuery({
    queryKey: ["ServiceUseTransferID", data],
    queryFn: async () => {
      let rs = await AdminAPI.clientsViewServiceUserTransfer({
        MemberID: data?.OrderItem?.MemberID,
        OrderItemID: data?.OrderItem?.ID,
        ProdServiceID: data?.Product?.ID,
        Token: Auth?.token,
      });
      return rs?.data;
    },
    enabled: visible,
  });

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const maxBookDate = (services) => {
    var max = "";
    services &&
      services.forEach((x) => {
        if (x.BookDate && x.BookDate > max) max = x.BookDate;
      });
    if (max) return moment(max).fromNow();
    return !max ? "Chưa dùng" : moment(max).format("HH:mm DD-MM-YYYY");
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
                <div className="relative flex py-5 pl-4 text-xl font-semibold text-center pr-14">
                  <div className="truncate">{data?.OrderItemProdTitle}</div>
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="overflow-auto pb-safe-b grow">
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Thẻ</div>
                    <div className="w-2/4 font-medium text-right">
                      {data?.OrderItemProdTitle}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Dịch vụ</div>
                    <div className="w-2/4 font-medium text-right">
                      {data?.Title}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Giá trị</div>
                    <div className="w-2/4 font-medium text-right">
                      {StringHelpers.formatVND(data?.OrderItem?.ToPay)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Lần cuối sử dụng</div>
                    <div className="w-2/4 font-medium text-right">
                      {maxBookDate(data?.Services)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Hạn sử dụng</div>
                    <div className="w-2/4 font-medium text-right">
                      {moment(data?.End, "DD/MM/YYYY HH:mm").format(
                        "HH:mm DD-MM-YYYY"
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Ngày mua thẻ</div>
                    <div className="w-2/4 font-medium text-right">
                      {moment(data?.OrderItem?.CreateDate).format(
                        "HH:mm DD-MM-YYYY"
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-dashed last:border-0">
                    <div className="text-gray-500">Đơn hàng</div>
                    <div className="w-2/4 font-medium text-right">
                      {data?.OrderItem?.OrderID}
                    </div>
                  </div>
                  {UseTransfer?.data?.memberUsed.length > 1 && (
                    <div className="p-4 border-b border-dashed last:border-0">
                      <div className="mb-1.5 text-gray-500">Chuyển nhượng</div>
                      <div>
                        <div className="mb-1">
                          Người mua {UseTransfer?.data?.Own?.FullName}
                          <span className="px-1">-</span>
                          {UseTransfer?.data?.Own?.MobilePhone}
                        </div>
                        <div className="mb-1">Đang dùng: </div>
                        <div>
                          {UseTransfer?.data?.memberUsed.map((item, index) => (
                            <div className="mb-1 last:mb-0" key={index}>
                              {index + 1}. {item.FullName} - {item.MobilePhone}
                              <span className="px-pl-1">({item?.Total} buổi)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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

export default PickerServiceInfo;

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import StringHelpers from "@/helpers/StringHelpers";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { f7, Link, Popover, useStore } from "framework7-react";
import { PickerSheet } from "@/partials/components/Sheet";
import { PickerCashAddEdit } from ".";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function PickerEditSplit({ children, item, onOpen, onClose }) {
  let queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");

  const { adminTools_byStock, thu_chi_cash } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock", "thu_chi_cash"],
    auth: Auth,
    CrStocks,
  });

  let { isLoading, data, refetch } = useQuery({
    queryKey: ["CashWithSource", item],
    queryFn: async () => {
      let bodyFormData = new FormData();

      bodyFormData.append("ids", item.GroupIDValue.map((x) => x.ID).toString());
      bodyFormData.append("source", item.Source);

      let { data } = await AdminAPI.withSourceCashs({
        Token: Auth?.token,
        data: bodyFormData,
      });
      return data?.data || [];
    },
    enabled: visible && item?.ID > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.deleteCashs(body);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["CashList"] });
      return data;
    },
  });

  const onDelete = (item) => {
    f7.dialog.confirm(`Bạn có chắc chắn muốn xoá thanh toán này ?`, () => {
      f7.dialog.preloader("Đang thực hiện...");

      let bodyFormData = new FormData();
      bodyFormData.append("ID", item.ID);

      deleteMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth.token,
        },
        {
          onSuccess: (data) => {
            f7.dialog.close();
            toast.success(`Xoá thành công.`);
          },
        }
      );
    });
  };

  let open = () => {
    onOpen && onOpen();
    setVisible(true);
  };

  let close = () => {
    onClose && onClose();
    setVisible(false);
  };

  return (
    <>
      {children({
        open,
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
                className="relative z-20 bg-white max-h-[calc(100%-var(--f7-safe-area-top)-var(--f7-navbar-height))] w-full rounded-t-xl overflow-hidden"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="flex flex-col h-full pb-safe-b bg-[var(--f7-page-bg-color)]">
                  <div className="relative px-4 py-5 text-lg font-semibold text-left bg-white border-b rounded-xl">
                    Chỉnh sửa
                    <span className="px-1">-</span>
                    {moment(item?.CreatedDate).format("HH:mm DD/MM/YYYY")}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="p-4 overflow-auto">
                    {isLoading && (
                      <div className="flex flex-col p-4 mb-3.5 bg-white rounded-lg animate-pulse">
                        <div className="flex justify-between pb-2.5 mb-2.5 border-b">
                          <div className="w-32 h-4 bg-gray-200 rounded"></div>
                          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        </div>

                        <div className="flex justify-between pb-2.5 mb-2.5 border-b">
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </div>

                        <div className="flex justify-between pb-2.5 mb-2.5 border-b">
                          <div className="w-16 h-4 bg-gray-200 rounded"></div>
                          <div className="w-24 h-5 bg-gray-200 rounded"></div>
                        </div>

                        <div className="flex justify-between">
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </div>
                      </div>
                    )}
                    {!isLoading && (
                      <>
                        {data &&
                          data.map((cash, index) => (
                            <PickerSheet
                              key={index}
                              Title="Bạn muốn thực hiện ?"
                              Options={[
                                {
                                  Title: "Chỉnh sửa",
                                  component: ({
                                    children,
                                    close,
                                    setHideForChild,
                                  }) => (
                                    <PickerCashAddEdit
                                      onOpen={() => setHideForChild(true)}
                                      onClose={() => {
                                        setHideForChild(false);
                                        close();
                                      }}
                                      initialValues={cash}
                                    >
                                      {({ open }) => (
                                        <div
                                          className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                          onClick={open}
                                        >
                                          {children}
                                        </div>
                                      )}
                                    </PickerCashAddEdit>
                                  ),
                                  hidden: !(
                                    adminTools_byStock?.hasRight ||
                                    (thu_chi_cash?.hasRight &&
                                      moment().format("DD-MM-YYYY") ===
                                        moment(cash.CreateDate).format(
                                          "DD-MM-YYYY"
                                        ))
                                  ),
                                },
                                {
                                  Title: "Xoá",
                                  className:
                                    "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer text-danger",
                                  onClick: (e) => {
                                    onDelete(cash);
                                  },
                                  hidden: !(
                                    adminTools_byStock?.hasRight ||
                                    (thu_chi_cash?.hasRight &&
                                      moment().format("DD-MM-YYYY") ===
                                        moment(cash.CreateDate).format(
                                          "DD-MM-YYYY"
                                        ))
                                  ),
                                },
                              ].filter((x) => !x.hidden)}
                              Close={{
                                Title: "Đóng",
                              }}
                            >
                              {({ open }) => (
                                <div
                                  onClick={() => {
                                    let hidden = !(
                                      adminTools_byStock?.hasRight ||
                                      (thu_chi_cash?.hasRight &&
                                        moment().format("DD-MM-YYYY") ===
                                          moment(cash.CreateDate).format(
                                            "DD-MM-YYYY"
                                          ))
                                    );
                                    if (!hidden) {
                                      open();
                                    }
                                  }}
                                  className="flex flex-col p-4 mb-3.5 bg-white rounded-lg last:mb-0"
                                  key={index}
                                >
                                  <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0">
                                    <div className="font-medium text-gray-500 font-lato">
                                      {moment(cash.CreateDate).format(
                                        "DD-MM-YYYY"
                                      )}
                                    </div>
                                    <div
                                      className={clsx(
                                        "font-bold font-lato text-base"
                                      )}
                                    >
                                      {StringHelpers.formatVNDPositive(
                                        cash.Value
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0">
                                    <div className="w-1/3 text-gray-500">
                                      Thành phần
                                    </div>
                                    <div className="flex-1 text-right">
                                      {cash.Title}
                                    </div>
                                  </div>
                                  <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0">
                                    <div className="w-1/3 text-gray-500">
                                      PTTT
                                    </div>
                                    <div className="flex-1 text-right">
                                      {cash.MethodPay}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </PickerSheet>
                          ))}
                      </>
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

export default PickerEditSplit;

import StringHelpers from "@/helpers/StringHelpers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";

function PickerShowQrCodePay({ children, SubTitle, onCloseQR }) {
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
    onCloseQR && onCloseQR()
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[calc(100%-var(--f7-navbar-height))] pb-safe-b"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  <div>
                    {SubTitle && (
                      <div className="text-center text-success text-sm font-normal mb-1">
                        {SubTitle}
                      </div>
                    )}

                    <div>QR Thanh toán</div>
                  </div>
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="overflow-auto pb-safe-b grow">
                  <div className="flex flex-col items-center justify-center gap-3 pb-4">
                    <div className="px-8 mb-2 font-light text-center text-gray-500 bg-white">
                      Khách hàng thực hiện quyét mã QR bên dưới để thanh toán.
                    </div>

                    {data && (
                      <>
                        {(data?.ma_nh === "MoMoPay" ||
                          data?.ma_nh === "ZaloPay") && (
                          <div className="p-3 border rounded">
                            <QRCode
                              size={256}
                              className="w-[256px]"
                              value={
                                data?.ma_nh === "MoMoPay"
                                  ? `2|99|${data?.stk}|||0|0|${data?.gia_tri}|${data?.ma_nhan_dien}${data?.don_hang}|transfer_myqr`
                                  : `https://social.zalopay.vn/mt-gateway/v1/private-qr?amount=${data?.gia_tri}&note=${data?.ma_nhan_dien}${data?.don_hang}&receiver_id=${data?.stk}`
                              }
                              viewBox={`0 0 256 256`}
                            />
                          </div>
                        )}

                        {data?.ma_nh !== "MoMoPay" &&
                          data?.ma_nh !== "ZaloPay" && (
                            <div className="px-12 rounded">
                              <div className="border rounded">
                                <img
                                  src={`https://img.vietqr.io/image/${data?.ma_nh}-${data?.stk}-qr_only.jpg?amount=${data?.gia_tri}&addInfo=${data?.ma_nhan_dien}${data?.don_hang}&accountName=${data?.ten}`}
                                  alt="Mã QR Thanh toán"
                                />
                              </div>
                              <div className="text-center text-[13px] mt-4 text-gray-800 leading-5">
                                <div>
                                  {data?.stk} - {data?.ngan_hang?.split("-")[1]}
                                </div>
                                <div>{data?.ten}</div>
                                <div>
                                  Số tiền:
                                  <span className="pl-1 font-medium">
                                    {StringHelpers.formatVND(data?.gia_tri)}đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                      </>
                    )}
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

export default PickerShowQrCodePay;

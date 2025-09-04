import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, useStore } from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import { toast } from "react-toastify";

function PickerShare({ children, initialValues, callback }) {
  const [visible, setVisible] = useState(false);
  let Brand = useStore("Brand");

  const close = () => {
    setVisible(false);
    callback && callback();
  };

  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: () => setVisible(true),
        })}
        {visible &&
          createPortal(
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
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[90vh]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="flex flex-col h-full pb-safe-b">
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Thông tin đăng nhập
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 overflow-auto">
                    <div className="mb-1 text-base font-semibold">
                      Xin chào,
                      <span className="pl-1 font-semibold">
                        {initialValues?.FullName}
                      </span>
                    </div>
                    <div className="font-light">
                      Đây là thông tin tài khoản, vui lòng lưu trữ trong suốt
                      thời gian bạn làm việc tại
                      <span className="pl-1 font-semibold text-primary">
                        {Brand?.Name}
                      </span>
                    </div>
                    <div className="mt-4 font-light">
                      <div className="mb-1.5 font-semibold">
                        A. Thông tin đăng nhập của nhân viên
                        <span className="pl-1">{initialValues?.FullName}</span>
                      </div>
                      <div className="mb-px">
                        - Tài khoản
                        <span className="pl-1 font-semibold">
                          {initialValues?.UserName}
                        </span>
                      </div>
                      <div>
                        - Mật khẩu
                        <span className="pl-1 font-semibold">1234</span> - Hướng
                        dẫn đổi mật khẩu sau đăng nhập (
                        <span
                          className="px-1 font-medium cursor-pointer text-primary"
                          onClick={() =>
                            PromHelpers.OPEN_LINK(
                              "https://www.youtube.com/shorts/L99SrluxTgc"
                            )
                          }
                        >
                          Xem hướng dẫn
                        </span>
                        )
                      </div>
                    </div>
                    <div className="mt-4 font-light">
                      <div className="mb-2.5 font-semibold">
                        B. Cài đặt APP trên Smartphone
                      </div>
                      <div className="pl-4">
                        <div className="mb-2 last:mb-0">
                          <div className="italic font-medium mb-1.5">
                            B1. Tải APP
                            <span className="px-1 font-semibold text-primary">
                              IDEZS
                            </span>
                            tại <span className="font-semibold">CH PLAY</span>
                            hoặc
                            <span className="pl-1 font-semibold">
                              APP STORE
                            </span>
                          </div>
                        </div>
                        <div className="mb-2 last:mb-0">
                          <div className="italic font-medium mb-1.5">
                            B2. Đăng nhập APP với thông tin tên miền là
                            <span className="px-1 font-semibold text-primary">
                              {Brand?.Domain}
                            </span>
                            . Tài khoản & Mật khẩu như trên
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 italic text-muted2">
                        <div className="mb-1">
                          - Trường hợp bạn quên mật khẩu vui lòng liên hệ quản
                          lý để được cấp lại
                        </div>
                        <div>
                          - Trường hợp lỗi “Tài khoản đã đăng nhập thiết bị
                          khác” – Vui lòng liên hệ quản lý ( Chỉ cho phép nhân
                          viên đăng nhập trên 1 điện thoại duy nhất. )
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 font-light">
                      <div className="mb-1.5 font-semibold">
                        C. Hướng dẫn sử dụng nhanh
                      </div>
                      <div className="pl-4">
                        <div className="mb-2 last:mb-0">
                          <div className="italic font-medium mb-1.5">
                            C1. Chấm công hàng ngày (
                            <span
                              className="px-1 font-medium cursor-pointer text-primary"
                              onClick={() =>
                                PromHelpers.OPEN_LINK(
                                  "https://www.youtube.com/shorts/PEniXIY5oO4"
                                )
                              }
                            >
                              Xem hướng dẫn tại đây
                            </span>
                            )
                          </div>
                          <div className="mt-1 italic text-muted2">
                            <div className="mb-1 last:mb-0">
                              - Bạn cần truy cập wifi quy định tại chi nhánh để
                              chấm công
                            </div>
                            <div className="mb-1 last:mb-0">
                              - Trường hợp bạn đã truy cập wifi mà vẫn không
                              chấm công được ( chưa cấp quyền định vị ) vui lòng
                              thực hiện theo hướng dẫn IOS (
                              <span
                                className="px-1 font-medium cursor-pointer text-primary"
                                onClick={() =>
                                  PromHelpers.OPEN_LINK(
                                    "https://www.youtube.com/watch?v=PrTOVNaSLug"
                                  )
                                }
                              >
                                Xem hướng dẫn
                              </span>
                              ) hoặc Android (
                              <span
                                className="px-1 font-medium cursor-pointer text-primary"
                                onClick={() =>
                                  PromHelpers.OPEN_LINK(
                                    "https://www.youtube.com/shorts/xpUHWSMjT6I"
                                  )
                                }
                              >
                                Xem hướng dẫn
                              </span>
                              )
                            </div>
                            <div className="mb-1 last:mb-0">
                              - Trường hợp bạn sang cơ sở khác hỗ trợ. Xem hướng
                              dẫn chấm công tại cơ sở khác (
                              <span
                                className="px-1 font-medium cursor-pointer text-primary"
                                onClick={() =>
                                  PromHelpers.OPEN_LINK(
                                    "https://www.youtube.com/shorts/dq1wWq9IG7s"
                                  )
                                }
                              >
                                Xem hướng dẫn
                              </span>
                              )
                            </div>
                          </div>
                        </div>
                        <div className="mb-2 last:mb-0">
                          <div className="italic font-medium mb-1.5">
                            C2. Tự quản lý Chấm công, Lương tour, Hoa hồng từ
                            APP
                          </div>
                          <div className="mb-2">
                            - Bạn có thể tự mình quản lý chấm công ( giờ đến –
                            giờ về, đi sớm về muộn ), Lương dịch vụ (tour) làm
                            cho khách, hoa hồng tư vấn bán hàng theo từng ngày,
                            cả tháng từ APP (
                            <span
                              className="px-1 font-medium cursor-pointer text-primary"
                              onClick={() =>
                                PromHelpers.OPEN_LINK(
                                  "https://www.youtube.com/shorts/rDbtYgMJURE"
                                )
                              }
                            >
                              Xem hướng dẫn
                            </span>
                            )
                          </div>
                          <div className="text-sm italic text-danger">
                            (*) Trường hợp có sai xót vui lòng thông báo ngay
                            với quản lý cơ sở.
                          </div>
                        </div>
                        <div className="mb-2 last:mb-0">
                          <div className="italic font-medium mb-1.5">
                            C3. Nhận giao ca dịch vụ ( Nếu bạn là Kỹ thuật viên
                            )
                          </div>
                          <div>
                            - Bạn sẽ nhận được thông báo giao ca trên app. Tại
                            đây bạn có thể xem thông tin chi tiết về buổi dịch
                            vụ, thông tin khách hàng, lịch sử mua hàng, sử dụng
                            dịch vụ để trong quá trình làm bạn có thể tư vấn
                            upsale. Kết thúc buổi dịch vụ bạn có thể ghi chú,
                            chụp ảnh thực tế khách hàng từ APP. (
                            <span
                              className="px-1 font-medium cursor-pointer text-primary"
                              onClick={() =>
                                PromHelpers.OPEN_LINK(
                                  "https://www.youtube.com/shorts/aqfYwavWN-w"
                                )
                              }
                            >
                              Xem hướng dẫn
                            </span>
                            )
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-4">
                    <Button
                      type="button"
                      className="rounded bg-app"
                      fill
                      large
                      preloader
                      onClick={() => {
                        let textToCopy = `
                            Xin Chào, ${initialValues?.FullName}
                            Đây là thông tin khởi tạo của bạn, vui lòng lưu trữ trong suốt thời gian bạn làm việc tại ${Brand?.Name}.

                            Thông tin đăng nhập của nhân viên ${initialValues?.FullName}
                            - Tài khoản: ${initialValues?.UserName}
                            - Mật khẩu: 1234 - Hướng dẫn đổi mật khẩu sau đăng nhập tại https://www.youtube.com/shorts/L99SrluxTgc

                            B. Cài đặt APP trên Smartphone

                            B1. Tải APP IDEZS tại APP STORE hoặc CH PLAY
                            B2. Đăng nhập APP với thông tin tên miền là ${Brand?.Domain}. Tài khoản & Mật khẩu như trên
                            - Trường hợp bạn quên mật khẩu vui lòng liên hệ quản lý để được cấp lại
                            - Trường hợp lỗi “Tài khoản đã đăng nhập thiết bị khác” – Vui lòng liên hệ quản lý ( Chỉ cho phép nhân viên đăng nhập trên 1 điện thoại duy nhất. )

                            C. Hướng dẫn sử dụng nhanh

                            C1. Chấm công hàng ngày (Xem hướng dẫn tại https://www.youtube.com/shorts/PEniXIY5oO4)
                            - Bạn cần truy cập wifi quy định tại chi nhánh để chấm công
                            - Trường hợp bạn đã truy cập wifi mà vẫn không chấm công được ( chưa cấp quyền định vị ) vui lòng thực hiện theo hướng dẫn IOS (https://www.youtube.com/watch?v=PrTOVNaSLug) hoặc Android (https://www.youtube.com/shorts/xpUHWSMjT6I)
                            - Trường hợp bạn sang cơ sở khác hỗ trợ. Xem hướng dẫn chấm công tại cơ sở khác (https://www.youtube.com/shorts/dq1wWq9IG7s)

                            C2. Tự quản lý Chấm công, Lương tour, Hoa hồng từ APP
                            - Bạn có thể tự mình quản lý chấm công ( giờ đến – giờ về, đi sớm về muộn ), Lương dịch vụ (tour) làm cho khách, hoa hồng tư vấn bán hàng theo từng ngày, cả tháng từ APP (Xem hướng dẫn tại https://www.youtube.com/shorts/rDbtYgMJURE)

                            (*) Trường hợp có sai xót vui lòng thông báo ngay với quản lý cơ sở.

                            C3. Nhận giao ca dịch vụ ( Nếu bạn là Kỹ thuật viên )
                            - Bạn sẽ nhận được thông báo giao ca trên app. Tại đây bạn có thể xem thông tin chi tiết về buổi dịch vụ, thông tin khách hàng, lịch sử mua hàng, sử dụng dịch vụ để trong quá trình làm bạn có thể tư vấn upsale. Kết thúc buổi dịch vụ bạn có thể ghi chú, chụp ảnh thực tế khách hàng từ APP. (Xem hướng dẫn tại https://www.youtube.com/shorts/aqfYwavWN-w)
                        `;

                        const tempInput = document.createElement("textarea");
                        tempInput.value = textToCopy;
                        document.body.appendChild(tempInput);
                        tempInput.select();
                        document.execCommand("copy");
                        document.body.removeChild(tempInput);

                        toast.success("Đã Copy thông tin.");

                        close(false);
                      }}
                    >
                      Copy & Đóng
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

export default PickerShare;

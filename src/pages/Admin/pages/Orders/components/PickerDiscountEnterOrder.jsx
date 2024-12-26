import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dom7 from "dom7";
import StringHelpers from "@/helpers/StringHelpers";
import clsx from "clsx";
import { NumericFormat } from "react-number-format";

const schemaAdd = yup
  .object({
    //vcode: yup.string().required("Vui lòng nhập mã giảm giá."),
  })
  .required();

function PickerDiscountEnterOrder({
  children,
  Order,
  CheckIn,
  invalidateQueries,
}) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  let inputRef = useRef(null);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      discount: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (!visible) {
      reset({
        discount: "",
      });
    } else {
      reset({ discount: Order?.CustomeDiscount || "" });
    }
  }, [visible]);

  // useEffect(() => {
  //   if (visible && inputRef?.current?.el) {
  //     Dom7(inputRef?.current?.el).find("input").focus();
  //   }
  // }, [inputRef, visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsUpdateDiscountOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: Order?.Member?.ID,
        Token: Auth.token,
      });
      if (!data?.data?.data?.error) {
        if (invalidateQueries) {
          await Promise.all(
            invalidateQueries.map((key) => queryClient.invalidateQueries([key]))
          );
        } else {
          await queryClient.invalidateQueries(["OrderManageID"]);
          await queryClient.invalidateQueries(["ClientManageID"]);
        }
      }

      return data;
    },
  });

  const onSubmit = ({ discount }) => {
    var bodyFormData = new FormData();
    bodyFormData.append("cmd", "priceorder_OrderAdd20");
    bodyFormData.append("OrderID", Order?.ID);
    bodyFormData.append("discount", discount);
    bodyFormData.append("customeDiscount", discount);

    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Áp dụng giảm giá cả đơn thành công.");
          close();

          if (data?.data?.prePayedValue) {
            f7.dialog
              .create({
                title: "Đơn hàng đã thay đổi",
                content: `Tất cả các khoản đã thanh toán có giá trị <span class="text-danger font-lato font-bold text-[15px]">${StringHelpers.formatVND(
                  data?.data?.prePayedValue
                )}</span> đã bị xoá. Vui lòng thực hiện thanh toán lại !`,
                buttons: [
                  {
                    text: "Đóng",
                    close: true,
                  },
                ],
              })
              .open();
          }
        },
      }
    );
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  let { discount } = watch();

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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[calc(100%-var(--f7-navbar-height))]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Giảm giá trên cả đơn hàng
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4">
                    <Controller
                      getInputRef={inputRef}
                      name="discount"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="relative">
                          <NumericFormat
                            className={clsx(
                              "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                              fieldState?.invalid
                                ? "border-danger"
                                : "border-[#d5d7da]"
                            )}
                            type="text"
                            autoComplete="off"
                            thousandSeparator={true}
                            placeholder="Nhập số tiền hoặc % giảm giá"
                            value={field.value}
                            onValueChange={(val) =>
                              field.onChange(val.floatValue || "")
                            }
                          />
                          <div className="absolute top-0 right-0 flex h-full">
                            <div className="w-12 flex items-center justify-center relative after:content-[''] after:absolute after:h-[30px] after:w-[1px] after:bg-[#d5d7da] after:right-0 pointer-events-none">
                              {Number(discount) > 100 ? "đ" : "%"}
                            </div>
                            {field.value ? (
                              <div
                                className="flex items-center justify-center w-12 h-full"
                                onClick={() => field.onChange("")}
                              >
                                <XMarkIcon className="w-5" />
                              </div>
                            ) : (
                              <></>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={addMutation.isLoading}
                      disabled={addMutation.isLoading}
                    >
                      Áp dụng ngay
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerDiscountEnterOrder;

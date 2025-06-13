import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
//import UsersAPI from "src/_ezs/api/users.api";
import { toast } from "react-toastify";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "react-query";
import { NumericFormat } from "react-number-format";
import { Button, f7, useStore } from "framework7-react";
import AdminAPI from "@/api/Admin.api";

function PickerRating({ children, initialValues }) {
  const [visible, setVisible] = useState(false);

  const queryClient = useQueryClient();

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const close = () => {
    setVisible(false);
  };

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      AverRate: "",
      ID: "",
      SoCaYeuCau: "",
      Order: "",
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        AverRate: initialValues?.AverRate || "",
        ID: initialValues?.ID || "",
        SoCaYeuCau: initialValues?.SoCaYeuCau || "",
        Order: initialValues?.Order || "",
      });
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const updateMutation = useMutation({
    mutationFn: async ({ Rating, Updates }) => {
      let rs = await AdminAPI.updateRatingMembers(Rating);
      await AdminAPI.updateMembers(Updates);
      
      await queryClient.invalidateQueries({
        queryKey: ["MembersLists"],
      });
      return rs;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");

    let newValues = { ...values };
    delete newValues.Order;

    updateMutation.mutate(
      {
        Rating: {
          users: [newValues],
        },
        Updates: {
          data: {
            updates: [
              {
                UserID: initialValues.ID,
                Order: values?.Order || 0,
              },
            ],
          },
          Token: Auth?.token,
          StockID: CrStocks?.ID
        },
      },
      {
        onSuccess: () => {
          close();
          toast.success("Cập nhật thành công.");
          f7.dialog.close();
        },
      }
    );
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: () => setVisible(true),
        })}
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
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  {initialValues?.FullName}
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="px-4 overflow-auto grow">
                    <div className="mb-4 last:mb-0">
                      <div className="font-semibold">Giá trị đánh giá</div>
                      <div className="mt-1">
                        <Controller
                          name="AverRate"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
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
                                thousandSeparator={false}
                                placeholder="Nhập giá trị"
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(
                                    typeof val.floatValue !== "undefined"
                                      ? val.floatValue
                                      : ""
                                  );
                                }}
                              />
                              <div className="absolute top-0 right-0 flex items-center h-full gap-1 px-4 cursor-pointer">
                                {[1, 2, 3, 4, 5].map((item, i) => (
                                  <svg
                                    onClick={() => field.onChange(item)}
                                    key={i}
                                    className={clsx(
                                      "w-5",
                                      Number(field.value) < item
                                        ? "text-gray-300"
                                        : "text-warning"
                                    )}
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                    viewBox="0 0 22 20"
                                  >
                                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          )}
                        />
                      </div>
                    </div>
                    <div className="mb-4 last:mb-0">
                      <div className="font-semibold">
                        Số ca yêu cầu trong tháng
                      </div>
                      <div className="mt-1">
                        <Controller
                          name="SoCaYeuCau"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <NumericFormat
                              className={clsx(
                                "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                fieldState?.invalid
                                  ? "border-danger"
                                  : "border-[#d5d7da]"
                              )}
                              type="text"
                              autoComplete="off"
                              thousandSeparator={false}
                              placeholder="Nhập số ca"
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(
                                  typeof val.floatValue !== "undefined"
                                    ? val.floatValue
                                    : ""
                                );
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="mb-4 last:mb-0">
                      <div className="font-semibold">Số thứ tự</div>
                      <div className="mt-1">
                        <Controller
                          name="Order"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <NumericFormat
                              className={clsx(
                                "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                fieldState?.invalid
                                  ? "border-danger"
                                  : "border-[#d5d7da]"
                              )}
                              type="text"
                              autoComplete="off"
                              thousandSeparator={false}
                              placeholder="Nhập số ca"
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(
                                  typeof val.floatValue !== "undefined"
                                    ? val.floatValue
                                    : ""
                                );
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      fill
                      large
                      preloader
                      className="rounded-full bg-app"
                      loading={updateMutation.isLoading}
                      disabled={updateMutation.isLoading}
                      type="submit"
                    >
                      Lưu thay đổi
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

export default PickerRating;

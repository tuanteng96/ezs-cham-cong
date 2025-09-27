import {
  ChevronRightIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { SelectBookingClients, SelectClients } from "@/partials/forms/select";
import clsx from "clsx";
import { useMutation } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";

function PickerInvoiceNew({ children, data, onClose, onOpen }) {
  const [visible, setVisible] = useState(false);
  let Auth = useStore("Auth");
  let MemberRef = useRef(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      RetailCustomers: false,
      Member: null,
    },
  });

  useEffect(() => {
    if (visible) {
      reset({
        RetailCustomers: false,
        Member: null,
      });
    }
  }, [visible]);

  const addMemberMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addEditClients(body);
      return data?.data?.Member;
    },
  });

  let open = () => {
    setVisible(true);
    onOpen?.();
  };

  let close = () => {
    setVisible(false);
    onClose?.();
  };

  const onSubmit = ({ RetailCustomers, Member }) => {
    if (Member?.isNew) {
      close();
      const router = f7.views.main.router;

      const handler = () => {
        router.off("routeChanged", handler);
        router.navigate(`/admin/pos/manage/${Member?.value}/add-prods`);
      };

      router.on("routeChanged", handler);
      router.navigate(
        `/admin/pos/manage/${Member?.value}/?state=${JSON.stringify({
          MobilePhone: Member?.label,
          FullName: Member?.suffix,
        })}&add=prods`
      );
    } else if (RetailCustomers) {
      addMemberMutation.mutate(
        {
          data: {
            member: {
              InputGroups: "",
              Desc: "",
              ID: 0,
              FullName: "Khách lẻ",
              MobilePhone: "",
              FixedPhone: "",
              Email: "",
              HomeAddress: "",
              DistrictID: "",
              ProvinceID: "",
              Jobs: "",
              Gender: 0,
              Photo: "",
              ByStockID: 11593,
              ByUserID: "",
              HandCardID: "",
              Source: "",
              Book: { Desc: "" },
              Birth: "",
              IsKeepGroup: false,
              AFFMemberID: "",
            },
          },
          Token: Auth?.token,
        },
        {
          onSuccess: (data) => {
            if (data?.ID) {
              close();
              const router = f7.views.main.router;

              const handler = () => {
                router.off("routeChanged", handler);
                
                router.navigate(`/admin/pos/manage/${data?.ID}/add-prods`);
              };

              router.on("routeChanged", handler);
              router.navigate(
                `/admin/pos/manage/${data?.ID}/?state=${JSON.stringify({
                  MobilePhone: data?.MobilePhone,
                  FullName: data?.FullName,
                })}&add=prods`
              );
            } else {
              toast.error("Xảy ra lỗi. Vui lòng thử lại.");
            }
          },
        }
      );
    } else {
      close();
      f7.views.main.router.navigate(`/admin/pos/manage/${Member?.value}/?add=popover`);
    }
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  let { Member, RetailCustomers } = watch();

  return (
    <>
      {children({ open, close })}
      {createPortal(
        <AnimatePresence initial={false}>
          {visible && (
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
                className="relative flex flex-col z-20 bg-[var(--f7-page-bg-color)] rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-center">
                  Tạo hoá đơn mới
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
                    <Controller
                      name="RetailCustomers"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div
                          className={clsx(
                            "px-4 py-3.5 bg-white rounded-xl mb-3.5 last:mb-0 border transition-colors",
                            field.value
                              ? "border-primary text-primary"
                              : "border-[var(--f7-page-bg-color)]"
                          )}
                          onClick={() => {
                            field.onChange(!field.value);
                            setValue("Member", null);
                          }}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                field.value
                                  ? "bg-primary text-white"
                                  : "bg-[#f1f1f1] text-[#5b6067]"
                              )}
                            >
                              <UserIcon className="w-5" />
                            </div>
                            <div className="text-[15px]">
                              Khách lẻ (Không có thông tin)
                            </div>
                          </div>
                        </div>
                      )}
                    />
                    <Controller
                      name="Member"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="mb-3.5 last:mb-0">
                          <div
                            className={clsx(
                              "px-4 py-3.5 bg-white rounded-xl border transition-colors",
                              field.value
                                ? "border-primary text-primary"
                                : "border-[var(--f7-page-bg-color)]"
                            )}
                            onClick={() => {
                              MemberRef?.current?.click();
                            }}
                          >
                            {field.value ? (
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 bg-[#f1f1f1] rounded-full text-[#5b6067] flex items-center justify-center">
                                  <div className="relative w-10 h-full overflow-hidden bg-gray-100 rounded-full">
                                    <svg
                                      className="absolute w-10 h-10 text-gray-400 -bottom-2 left-2/4 -translate-x-2/4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-1 truncate">
                                  <div className="text-[15px] truncate">
                                    {field?.value?.label}
                                  </div>
                                  <div className="mt-1 leading-3 text-gray-500">
                                    {field?.value?.suffix}
                                  </div>
                                </div>
                                <div className="text-gray-300">
                                  <ChevronRightIcon className="w-6" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 bg-[#f1f1f1] rounded-full text-[#5b6067] flex items-center justify-center">
                                  <UsersIcon className="w-6" />
                                </div>
                                <div className="text-[15px]">
                                  Thêm khách hàng
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="hidden">
                            <SelectBookingClients
                              isFilterFocus
                              hiddenVisitors={true}
                              truncate={true}
                              ref={MemberRef}
                              placeholderInput="Nhập tên hoặc số điện thoại"
                              placeholder="Chọn khách hàng"
                              errorMessage={fieldState?.error?.message}
                              errorMessageForce={fieldState?.invalid}
                              value={field?.value || null}
                              label="Chọn khách hàng"
                              onChange={(val) => {
                                field.onChange(val || null);
                                setValue("RetailCustomers", false);
                              }}
                              isFilter
                            />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={addMemberMutation.isLoading}
                      disabled={
                        (!Member && !RetailCustomers) ||
                        addMemberMutation.isLoading
                      }
                    >
                      Tiếp tục
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
}

export default PickerInvoiceNew;

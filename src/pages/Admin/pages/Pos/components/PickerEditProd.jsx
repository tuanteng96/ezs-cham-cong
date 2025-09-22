import {
  ChevronUpIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import StringHelpers from "@/helpers/StringHelpers";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import ArrayHelpers from "@/helpers/ArrayHelpers";

const schemaAdd = yup.object().shape({
  Qty: yup.string().required("Vui lòng nhập số lượng."),
});

function PickerEditProd({
  children,
  item,
  CheckInID,
  MemberID,
  Order,
  OrderItems = [],
}) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [isPercent, setIsPercent] = useState(false);

  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      CheckInID: "",
      oiID: "",
      PriceOrder: "",
      Qty: "",
      MinusPrice: "",
      MinusMoney: "",
      MinusPercent: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (visible) {
      reset({
        oiID: item.ID,
        PriceOrder: item.PriceOrder,
        Qty: item.Qty,
        CheckInID,
        MinusPrice: "",
        MinusMoney: "",
        MinusPercent: "",
      });
    }
  }, [item, visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let { data } = await AdminAPI.clientsOrderUpdateId(body);

      await AdminAPI.clientsPresentAppId({
        MemberID: MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["OrderManageID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data?.data
        ? {
            ...data?.data,
            OrderItemsOld: OrderItems || null,
            OrderItemsNew: data.data.OrderItems || null,
          }
        : null;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsOrderUpdateId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientManageID"]);
      await queryClient.invalidateQueries(["OrderManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    let bodyFormData = new FormData();
    bodyFormData.append("CheckInID", CheckInID);
    bodyFormData.append("oiID", item.ID);
    bodyFormData.append("PriceOrder", values?.PriceOrder || 0);
    bodyFormData.append("Qty", values?.Qty);

    updateMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: (data) => {
          toast.success("Cập nhật thành công");
          setVisible(false);
          if (data?.prePayedValue) {
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

          if (Number(values?.Qty) > item.Qty) {
            let oldItems = data.OrderItemsOld
              ? data.OrderItemsOld.map((x) => ({ ...x, ID: x.ProdID }))
              : [];

            let addItems = [
              {
                Title: item.ProdTitle,
                ID: item.ProdID,
                Qty: values?.Qty - item.Qty,
              },
            ];
            let newItems = data.OrderItemsNew
              ? data.OrderItemsNew.map((x) => ({ ...x, ID: x.ProdID }))
              : [];

            let notIncreased = ArrayHelpers.getNotIncreased(
              oldItems,
              addItems,
              newItems
            );

            if (notIncreased && notIncreased.length > 0) {
              setTimeout(() => {
                toast.error(
                  `Số lượng bán lớn hơn tồn kho : ${notIncreased
                    .map((x) => x.Title)
                    .join(", ")}`,
                  {
                    autoClose: 2500,
                  }
                );
              }, 300);
            }
          }
        },
      }
    );
  };

  const onDelete = () => {
    f7.dialog.confirm("Bạn có chắc chắn muốn xoá mặt hàng này ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      let bodyFormData = new FormData();
      bodyFormData.append("CheckInID", CheckInID);
      bodyFormData.append("oiID", item?.ID);
      bodyFormData.append("Qty", 0);
      bodyFormData.append("THANH_TOAN_TUY_CHON_DUYET_THUONG", 1);
      bodyFormData.append("deleted", 1);
      bodyFormData.append("deleteIds", item?.ID);

      deleteMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
        },
        {
          onSuccess: ({ data }) => {
            f7.dialog.close();
            toast.success("Xoá thành công");
            setVisible(false);

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
    });
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  const isDisabled = () => {
    if (Brand?.Global?.Admin?.cam_chinh_gia) {
      if (Auth?.ID === 1) return Auth?.ID !== 1;
      return !adminTools_byStock?.hasRight;
    }
    return false;
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  <div className="w-9/12 truncate">
                    [{item?.ProdCode}] {item?.ProdTitle} {item?.ProdTitle}
                  </div>
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
                  <div className="px-4 overflow-auto grow scrollbar-modal">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Số lượng</div>
                      <Controller
                        name="Qty"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className="relative flex">
                            <Input
                              clearButton
                              className="hidden-error-message [&_input]:rounded-s [&_input]:capitalize [&_input]:placeholder:normal-case [&_input]:!rounded-r-none flex-1"
                              type="number"
                              placeholder="Nhập số lượng"
                              value={field.value}
                              errorMessage={fieldState?.error?.message}
                              errorMessageForce={true}
                              onInput={field.onChange}
                              onFocus={(e) =>
                                KeyboardsHelper.setAndroid({
                                  Type: "modal-scrollbar",
                                  Event: e,
                                })
                              }
                              disabled={item.HasFeeInUse}
                            />
                            <div className="flex">
                              <button
                                disabled={item.HasFeeInUse}
                                type="button"
                                className="disabled:opacity-40 flex items-center justify-center w-12 h-full border border-[#d5d7da] shadow-[0_4px_6px_0_rgba(16,25,40,.06)] -ml-[1px] bg-gray-50 rounded-r"
                                onClick={() => {
                                  if (Number(field.value) > 1) {
                                    field.onChange(Number(field.value) - 1);
                                  } else {
                                    field.onChange(1);
                                  }
                                }}
                              >
                                <MinusIcon className="w-5" />
                              </button>
                              <button
                                disabled={item.HasFeeInUse}
                                type="button"
                                className="disabled:opacity-40 flex items-center justify-center w-12 h-full border border-[#d5d7da] shadow-[0_4px_6px_0_rgba(16,25,40,.06)] -ml-[1px] bg-gray-50"
                                onClick={() =>
                                  field.onChange(Number(field.value) + 1)
                                }
                              >
                                <PlusIcon className="w-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="flex justify-between mb-px">
                        <div className="font-light">Đơn giá</div>
                        <div className="font-medium font-lato">
                          NG : {StringHelpers.formatVND(item.Price)}
                        </div>
                      </div>
                      <Controller
                        name="PriceOrder"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className="grid grid-cols-10">
                            <div className="relative col-span-8">
                              <NumericFormat
                                className={clsx(
                                  "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded-s py-3 px-4 focus:border-primary rounded-r-none",
                                  fieldState?.invalid
                                    ? "border-danger"
                                    : "border-[#d5d7da]"
                                )}
                                type="text"
                                autoComplete="off"
                                thousandSeparator={true}
                                placeholder="Nhập đơn giá"
                                value={field.value}
                                onValueChange={(val) =>
                                  field.onChange(val.floatValue || "")
                                }
                                disabled={isDisabled()}
                                onFocus={(e) =>
                                  KeyboardsHelper.setAndroid({
                                    Type: "modal-scrollbar",
                                    Event: e,
                                  })
                                }
                              />
                              {!isDisabled() && field.value && (
                                <div
                                  className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <XMarkIcon className="w-5" />
                                </div>
                              )}
                            </div>
                            <div
                              className="col-span-2 flex items-center justify-center h-full border border-[#d5d7da] shadow-[0_4px_6px_0_rgba(16,25,40,.06)] -ml-[1px] bg-gray-50 rounded-r"
                              onClick={() =>
                                !isDisabled() && setIsPercent(!isPercent)
                              }
                            >
                              {isPercent && <ChevronUpIcon className="w-5" />}
                              {!isPercent && "%"}
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    {isPercent && (
                      <>
                        <Controller
                          name="MinusPercent"
                          control={control}
                          render={({ field, fieldState }) => (
                            <div className="mb-3.5 last:mb-0 grid grid-cols-4 gap-3">
                              {["NG", 5, 15, 50].map((x, index) => (
                                <div
                                  className={clsx(
                                    "flex items-center justify-center border rounded h-11 transition-all relative",
                                    field.value === x && "border-primary"
                                  )}
                                  key={index}
                                  onClick={() => {
                                    setValue("MinusPrice", "");
                                    setValue("MinusMoney", "");
                                    field.onChange(x);
                                    if (
                                      field.value &&
                                      x === Number(field.value)
                                    ) {
                                      field.onChange("");
                                      setValue("PriceOrder", item.PriceOrder);
                                    } else {
                                      field.onChange(x);
                                      setValue(
                                        "PriceOrder",
                                        x === "NG"
                                          ? item.Price
                                          : parseInt(
                                              item.PriceOrder -
                                                (item.PriceOrder * x) / 100
                                            )
                                      );
                                    }
                                  }}
                                >
                                  {x === "NG" ? "NG" : x + "%"}
                                </div>
                              ))}
                            </div>
                          )}
                        />

                        <div>
                          <div className="font-light">Trừ đơn giá</div>
                          <Controller
                            name="MinusPrice"
                            control={control}
                            render={({ field, fieldState }) => (
                              <div className="relative">
                                <NumericFormat
                                  className={clsx(
                                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded-s py-3 px-4 focus:border-primary",
                                    fieldState?.invalid
                                      ? "border-danger"
                                      : "border-[#d5d7da]"
                                  )}
                                  type="text"
                                  autoComplete="off"
                                  thousandSeparator={true}
                                  placeholder="Nhập trừ đơn giá (% or VNĐ)"
                                  value={field.value}
                                  onValueChange={(val) => {
                                    field.onChange(val?.floatValue || "");

                                    if (val?.floatValue) {
                                      if (val.floatValue > 100) {
                                        setValue(
                                          "PriceOrder",
                                          item.Price - val.floatValue
                                        );
                                      } else {
                                        setValue(
                                          "PriceOrder",
                                          item.PriceOrder -
                                            parseInt(
                                              (item.PriceOrder *
                                                val.floatValue) /
                                                100
                                            )
                                        );
                                      }
                                      setValue("MinusPercent", "");
                                      setValue("MinusMoney", "");
                                    } else {
                                      setValue("PriceOrder", item.PriceOrder);
                                    }
                                  }}
                                  onFocus={(e) =>
                                    KeyboardsHelper.setAndroid({
                                      Type: "modal-scrollbar",
                                      Event: e,
                                      success: field.onBlur,
                                    })
                                  }
                                />
                                {field.value && (
                                  <div
                                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                    onClick={() => field.onChange("")}
                                  >
                                    <XMarkIcon className="w-5" />
                                  </div>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="mt-3">
                          <div className="font-light">Trừ thành tiền</div>
                          <Controller
                            name="MinusMoney"
                            control={control}
                            render={({ field, fieldState }) => (
                              <div className="relative">
                                <NumericFormat
                                  className={clsx(
                                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded-s py-3 px-4 focus:border-primary",
                                    fieldState?.invalid
                                      ? "border-danger"
                                      : "border-[#d5d7da]"
                                  )}
                                  type="text"
                                  autoComplete="off"
                                  thousandSeparator={true}
                                  placeholder="Nhập trừ thành tiền (VNĐ)"
                                  value={field.value}
                                  onValueChange={(val) => {
                                    field.onChange(val?.floatValue || "");

                                    if (val?.floatValue) {
                                      setValue(
                                        "PriceOrder",
                                        Math.round(
                                          (item.ToPay - val.floatValue) /
                                            item.Qty
                                        )
                                      );
                                      setValue("MinusPercent", "");
                                      setValue("MinusPrice", "");
                                    } else {
                                      setValue("PriceOrder", item.PriceOrder);
                                    }
                                  }}
                                  onFocus={(e) =>
                                    KeyboardsHelper.setAndroid({
                                      Type: "modal-scrollbar",
                                      Event: e,
                                      success: field.onBlur,
                                    })
                                  }
                                />
                                {field.value && (
                                  <div
                                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                    onClick={() => field.onChange("")}
                                  >
                                    <XMarkIcon className="w-5" />
                                  </div>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 p-4">
                    <Button
                      type="button"
                      className="w-20 rounded-full bg-danger"
                      fill
                      large
                      preloader
                      loading={deleteMutation.isLoading}
                      disabled={
                        deleteMutation.isLoading ||
                        updateMutation.isLoading ||
                        (Brand?.Global?.Admin?.Khong_cho_xoa_sp_don_hang
                          ? !adminTools_byStock?.hasRight
                          : !Brand?.Global?.Admin
                              ?.Chinh_sua_don_hang_da_thanh_toan &&
                            (Order?.CPayed || Order?.MPayed) &&
                            !adminTools_byStock?.hasRight) ||
                        item.HasFeeInUse
                      }
                      onClick={onDelete}
                    >
                      Xoá
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={updateMutation.isLoading}
                      disabled={
                        updateMutation.isLoading ||
                        deleteMutation.isLoading ||
                        (!Brand?.Global?.Admin
                          ?.Chinh_sua_don_hang_da_thanh_toan &&
                          (Order?.CPayed || Order?.MPayed) &&
                          !adminTools_byStock?.hasRight)
                      }
                    >
                      Cập nhật
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

export default PickerEditProd;

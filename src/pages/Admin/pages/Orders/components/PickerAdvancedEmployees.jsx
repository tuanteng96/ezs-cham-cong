import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { SelectPicker } from "@/partials/forms";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { SelectMembersBouns } from ".";

function PickerAdvancedEmployees({ children, Order }) {
  const queryClient = useQueryClient();
  let Brand = useStore("Brand");
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  

  const [visible, setVisible] = useState(false);

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const methods = useForm({
    defaultValues: {
      Advanced: [
        {
          Product: null,
          Type: {
            value: "hoa_hong",
            label: "Hoa hồng",
          },
          Staff: null,
          Value: "",
        },
      ],
    },
  });

  const { control, handleSubmit, setValue, reset, watch } = methods;

  const { fields, remove, append } = useFieldArray({
    control,
    name: "Advanced",
  });

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsViewOrderChangeBonusId(body);
      await Promise.all([
        queryClient.invalidateQueries(["ClientOrderViewID"]),
        queryClient.invalidateQueries(["ClientOrderBonusViewID"]),
      ]);
      return data;
    },
  });

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  const onSubmit = (values) => {
    let { Advanced } = values;
    const newData = Advanced.filter(
      (item) =>
        typeof item === "object" &&
        item.Product?.ID &&
        item.Value &&
        item.Staff?.ID
    );
    const Hoa_hong = newData
      .filter((item) => item.Type.value === "hoa_hong")
      .map((item) => ({
        Value: item.Value || 0,
        ReceiverUserID: item.Staff?.ID,
        SubSourceID: item.Product?.ID,
      }))
      .filter((o) => o.Value !== null);
    const Doanh_so = newData
      .filter((item) => item.Type.value === "doanh_so")
      .map((item) => ({
        Value: item.Value || 0,
        ReceiverUserID: item.Staff?.ID,
        OrderItemID: item.Product?.ID,
      }))
      .filter((o) => o.Value !== null);
    const dataSubmit = {
      OrderID: Order?.OrderID,
      save: {
        them_hoa_hong: Hoa_hong,
        them_doanh_so: Doanh_so,
      },
    };
    updateMutation.mutate(
      {
        data: dataSubmit,
        Token: Auth?.token,
      },
      {
        onSuccess: (data) => {
          toast.success("Cập nhật thành công.");
          reset();
          setVisible(false);
        },
      }
    );
  };

  let { Advanced } = watch();

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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]  max-h-[90%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Nâng cao
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>

                  <div className="px-4 overflow-auto grow">
                    <div>
                      {fields &&
                        fields.map((item, index) => (
                          <div
                            className="pb-4 mb-4 border-b border-dashed last:border-0 last:pb-0 last:mb-0"
                            key={item.id}
                          >
                            <div className="mb-3 last:mb-0">
                              <Controller
                                name={`Advanced[${index}].Product`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable={false}
                                    placeholder="Chọn sản phẩm"
                                    value={field.value}
                                    options={Order?.oiItems}
                                    label="Chọn sản phẩm"
                                    onChange={(val) => {
                                      field.onChange(val);
                                    }}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                  />
                                )}
                              />
                            </div>
                            <div className="mb-3 last:mb-0">
                              <Controller
                                name={`Advanced[${index}].Type`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable={false}
                                    placeholder="Chọn loại"
                                    value={field.value}
                                    options={[
                                      {
                                        value: "hoa_hong",
                                        label: "Hoa hồng",
                                      },
                                      {
                                        value: "doanh_so",
                                        label: "Doanh số",
                                      },
                                    ]}
                                    label="Chọn loại"
                                    onChange={(val) => {
                                      field.onChange(val);
                                    }}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                  />
                                )}
                              />
                            </div>
                            <div className="mb-3 last:mb-0">
                              <Controller
                                name={`Advanced[${index}].Staff`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectMembersBouns
                                    isClearable
                                    placeholder="Chọn nhân viên"
                                    value={field.value}
                                    options={Order?.nhan_vien || []}
                                    label="Chọn nhân viên"
                                    onChange={(option) => {
                                      field.onChange(option);
                                    }}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                  />
                                )}
                              />
                            </div>
                            <div className="mb-3 last:mb-0">
                              <Controller
                                name={`Advanced[${index}].Value`}
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
                                      placeholder="Nhập số tiền"
                                      value={field.value}
                                      onValueChange={(val) =>
                                        field.onChange(val.floatValue || "")
                                      }
                                      disabled={
                                        Brand?.Global?.Admin?.thuong_ds_nang_cao
                                          ? Auth?.ID !== 1
                                          : !(
                                              adminTools_byStock?.hasRight ||
                                              moment(item.CreateDate).format(
                                                "DD-MM-YYYY"
                                              ) ===
                                                moment().format("DD-MM-YYYY")
                                            )
                                      }
                                    />
                                    {field.value ? (
                                      <div
                                        className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                        onClick={() => field.onChange("")}
                                      >
                                        <XMarkIcon className="w-5" />
                                      </div>
                                    ) : (
                                      <></>
                                    )}
                                  </div>
                                )}
                              />
                            </div>
                            <div className="flex justify-center gap-2 mb-3 last:mb-0">
                              <button
                                className="w-auto px-3 text-white bg-success py-2.5 rounded"
                                type="button"
                                onClick={() =>
                                  append({
                                    Product: null,
                                    Type: {
                                      value: "hoa_hong",
                                      label: "Hoa hồng",
                                    },
                                    Staff: null,
                                    Value: "",
                                  })
                                }
                              >
                                <PlusIcon className="w-5" />
                              </button>
                              {fields.length > 1 && (
                                <button
                                  className="w-auto px-3 text-white bg-danger py-2.5 rounded"
                                  type="button"
                                  onClick={() =>
                                    f7.dialog.confirm("Xác nhận xoá ? ", () =>
                                      remove(index)
                                    )
                                  }
                                >
                                  <TrashIcon className="w-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={updateMutation.isLoading}
                      disabled={
                        updateMutation.isLoading ||
                        (Advanced &&
                          Advanced.filter((x) => x.Product && x.Staff)
                            .length === 0)
                      }
                    >
                      Tạo mới
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

export default PickerAdvancedEmployees;

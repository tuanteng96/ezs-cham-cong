import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { SelectPicker } from "@/partials/forms";

const schemaAdd = yup.object().shape({
  ShipCode: yup.string().required("Vui lòng nhập mã vận chuyển."),
  Shipper: yup.object().required("Vui lòng chọn đơn vị vận chuyển."),
});

function PickerCodOrder({ children, OrderID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset, setError, watch } = useForm({
    defaultValues: {
      ShipCode: "",
      Shipper: null,
    },
    resolver: yupResolver(schemaAdd),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["ClientOrderCodViewID", { ID: OrderID }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsViewCodOrderId({
        data: {
          id: OrderID,
        },
        Token: Auth?.token,
      });
      return data
        ? {
            ...data,
            shipperList: data?.shipperList
              ? data?.shipperList.map((x) => ({ value: x, label: x }))
              : [],
          }
        : null;
    },
    onSuccess: (data) => {
      reset({
        ShipCode: data?.order?.ShipCode,
        Shipper: data?.order?.Shipper ? {
          label: data?.order?.Shipper,
          value: data?.order?.Shipper,
        } : null,
      });
    },
    enabled: visible,
  });

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsUpdateCodOrderId(body);
      await queryClient.invalidateQueries(["ClientOrderViewID"]);
      await queryClient.invalidateQueries(["Processings"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    addMutation.mutate(
      {
        data: {
          orders: [
            {
              ID: OrderID,
              ShipCode: values.ShipCode,
              Shipper: values?.Shipper?.value || "",
            },
          ],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhật đơn vị vận chuyển thành công");
          close();
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
                  Vận chuyển
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
                      <div className="mb-px">Vận chuyển</div>
                      <Controller
                        name="Shipper"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable
                            autoHeight
                            placeholder="Chọn đơn vị vận chuyển"
                            value={field.value}
                            options={data?.shipperList || []}
                            label="Vận chuyển"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Mã vận chuyển</div>
                      <Controller
                        name="ShipCode"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                            type="input"
                            placeholder="Nhập mã"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "modal-scrollbar",
                                Event: e,
                              })
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={isLoading || addMutation.isLoading}
                      disabled={isLoading || addMutation.isLoading}
                    >
                      Lưu vận chuyển
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

export default PickerCodOrder;

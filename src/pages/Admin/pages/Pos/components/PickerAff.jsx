import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import { SelectClients } from "@/partials/forms/select";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

[
  {
    TypeText: "Hoa hồng giới thiệu",
    MoneyInfo: null,
    MethodOnOrderID: null,
    ID: 75226,
    MemberID: 38609,
    Source: "OrderItemEnt",
    SourceID: 58023,
    Value: 40000,
    CreateDate: "2024-10-10T09:22:34",
    Desc: "Được hưởng 5% của khoản thanh toán 800,000; Nhóm 0",
    IsPending: 0,
    Type: "GIOI_THIEU",
    MethodPayID: 0,
    StockID: 11409,
    ReturnOfID: 0,
    SubSourceID: 0,
    LimitCateID: 0,
    RefOrderID: 48715,
    InGroupDate: null,
    RelPromo: "",
    IsProd: false,
    SumType: "",
    SumOrderID: 0,
    AutoPay: "",
    OrderItemMoneyID: 0,
    IsDisabled: false,
    MoneyEndDate: "2024-10-10T09:22:34",
    MoneyTitle: "",
    RefOrderMoneyID: 0,
    MoneyMethodID: 0,
    MoneyTotal: 0,
    MoneyProd: 0,
    MoneyService: 0,
    IsMoney1: false,
    MoneyCondt: 0,
    ProdOrService: 0,
    MoneyHasReturn: false,
    RefunOI_ID: 0,
    RefunDesc: "",
    ProdMoneyID: 0,
    OriginMemberID: 0,
    UserID: 0,
    ThirdImportID: 0,
    ProdTitle: "2 buoi goi dau",
    Edit: true,
  },
];

function PickerAff({ children, data, Order, OrderItems }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      orderid: 0,
      affid: "",
      affm: [],
    },
  });

  const { fields } = useFieldArray(
    {
      control,
      name: "affm",
    }
  );

  useEffect(() => {
    reset({
      orderid: Order?.ID,
      affid: Order?.Aff
        ? {
            label: Order?.Aff?.FullName,
            value: Order?.Aff?.ID,
          }
        : null,
      affm: data
        ? data.map((item) => {
            let obj = { ...item };
            let index = OrderItems.findIndex((x) => x.ID === item.SourceID);
            if (index > -1) {
              obj.Prod = OrderItems[index];
            }
            return obj;
          })
        : [],
    });
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientUpdateAffOrderId(body);
      await queryClient.invalidateQueries(["OrderManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    var bodyFormData = new FormData();
    bodyFormData.append("orderid", values?.orderid);
    bodyFormData.append("affid", values?.affid?.value);
    bodyFormData.append("affm", JSON.stringify(values?.affm));

    updateMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          close();
          toast.success("Cập nhập người giới thiệu thành công.");
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[80%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Giới thiệu
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="overflow-auto grow">

                    <div className="px-4">
                      <div>
                        <div className="mb-1">Người giới thiệu</div>
                        <Controller
                          name="affid"
                          control={control}
                          render={({ field, fieldState }) => (
                            <SelectClients
                              placeholderInput="Tên khách hàng"
                              placeholder="Chọn khách hàng"
                              value={field.value}
                              label="Chọn khách hàng"
                              onChange={(val) => {
                                field.onChange(val);
                                setValue("affm", [])
                              }}
                              isFilter
                              isClearable={true}
                            />
                          )}
                        />
                      </div>
                      {fields && fields.length > 0 && (
                        <div className="mt-3.5 pb-4">
                          {fields.map((item, index) => (
                            <div
                              className="mb-4 border rounded last:mb-0"
                              key={item.id}
                            >
                              <div className="flex justify-between p-4 font-medium bg-gray-100 border-b">
                                {item?.Prod?.ProdTitle}
                              </div>
                              <div className="p-4">
                                <div className="mb-3.5">
                                  <div className="mb-px">Ghi chú</div>
                                  <Controller
                                    name={`affm[${index}].Desc`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <Input
                                        className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case"
                                        type="textarea"
                                        placeholder="Nhập ghi chú"
                                        value={field.value}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                        onInput={field.onChange}
                                        resizable
                                      />
                                    )}
                                  />
                                </div>
                                <div>
                                  <div className="mb-1">Số tiền</div>
                                  <Controller
                                    name={`affm[${index}].Value`}
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
                                        thousandSeparator={true}
                                        placeholder="Nhập số tiền"
                                        value={field.value}
                                        onValueChange={(val) =>
                                          field.onChange(val.floatValue || "")
                                        }
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={clsx("p-4", fields && fields.length > 0 && "border-t")}>
                    {fields && fields.length > 0 && (
                      <div className="flex items-end justify-between mb-2.5">
                        <div className="font-medium leading-3">
                          Tổng giá trị
                        </div>
                        <div className="text-base font-bold leading-3 font-lato">
                          ₫
                          {StringHelpers.formatVND(
                            ArrayHelpers.sumTotal(data, "Value")
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={updateMutation.isLoading}
                      disabled={updateMutation.isLoading}
                    >
                      Cập nhập
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

export default PickerAff;

import AdminAPI from "@/api/Admin.api";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { DatePicker, SelectPicker } from "@/partials/forms";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Link, Popover, f7, useStore } from "framework7-react";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

[
  {
    MethodID: 1,
    Value: 12000000,
    SubSourceID: 57971,
    ProdTitle: "the 3 buoi",
    ID: 98691,
    Desc: "Đơn hàng - Tiền mặt - ",
    IsAbstract: false,
    IsCash: true,
    UserInput: false,
    CreateDate: "2024-10-07T08:48:37",
    _MethodID: 1,
    Value0: 12000000,
    BankNumber: "",
  },
];
[
  {
    MethodID: "1",
    Value: 12000000,
    SubSourceID: 57970,
    ProdTitle: "the 3 buoi",
    ID: 98689,
    Desc: "Đơn hàng - Tiền mặt - ",
    IsAbstract: false,
    IsCash: true,
    UserInput: false,
    CreateDate: "2024-10-07T08:47:34",
    _MethodID: 1,
    Value0: 12000000,
    BankNumber: "",
  },
];

function PickerEditHisPayment({
  children,
  data,
  TypeMethods,
  TypeMethodsServer,
  Order,
  Banks,
}) {
  const queryClient = useQueryClient();
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const [visible, setVisible] = useState(false);
  const [TypeMethodsNew, setTypeMethodsNew] = useState(TypeMethods);

  const { control, handleSubmit, setValue, clearErrors, watch, setError } =
    useForm({
      defaultValues: {
        Payments: [],
        Removes: [],
      },
    });

  const { fields, remove } = useFieldArray({
    control,
    name: "Payments",
  });

  const { append } = useFieldArray({
    control,
    name: "Removes",
  });

  useEffect(() => {
    if (data && data?.Cashs) {
      let newTypeMethodsNew = [...TypeMethodsNew];
      let newPayments =
        data?.Cashs && data?.Cashs.length > 0
          ? data?.Cashs.map((item) => {
              let obj = {
                MethodID: item?.MethodID
                  ? TypeMethods.filter(
                      (x) => Number(x.value) === Number(item?.MethodID)
                    )[0]
                  : TypeMethods[0],
                Value: item?.Value,
                SubSourceID: item?.SubSourceID,
                ProdTitle: "",
                ID: item?.ID,
                Desc: item?.Desc,
                IsAbstract: item?.IsAbstract || false,
                IsCash: item?.IsCash || true,
                UserInput: item?.UserInput || false,
                CreateDate: item.CreateDate,
                _MethodID: item?.MethodID,
                Value0: item?.Value,
                BankNumber: item?.BankNumber
                  ? {
                      label: `${
                        item?.BankNumber.split("|")[1]
                      } - ${item?.BankNumber.split("|")[0]
                        .split(/[, ]+/)
                        .pop()}`,
                      value: item?.BankNumber.split("|")[2],
                      ngan_hang: item?.BankNumber.split("|")[0],
                      ten: item?.BankNumber.split("|")[1],
                      stk: item?.BankNumber.split("|")[2],
                    }
                  : null,
                AdminCreateDate: moment()
                  .set({
                    date: data?.D,
                    month: data?.M - 1,
                    year: data?.Y,
                  })
                  .toDate(),
              };
              let index = Order?.OrderItems?.findIndex(
                (x) => x.ProdID === item?.ProdID
              );
              if (index > -1)
                obj.ProdTitle = Order?.OrderItems[index].ProdTitle;
              return obj;
            })
          : [];
      if (data?.MemberMoneys && data?.MemberMoneys.length > 0) {
        for (let item of data?.MemberMoneys) {
          if (item?.MethodID !== "") {
            if (item?.MoneyMethodID) {
              let index = newTypeMethodsNew.findIndex(
                (x) => x.ID === item?.MoneyMethodID
              );
              if (index === -1) {
                let i = TypeMethodsServer.findIndex(
                  (x) => x.ID === item?.MoneyMethodID
                );
                if (i > -1) {
                  newTypeMethodsNew.push(TypeMethodsServer[i]);
                }
              }
            }
          }
          let obj = {
            MethodID:
              item?.MethodID !== ""
                ? item.MoneyMethodID
                  ? {
                      label: item.MoneyTitle,
                      value: item?.MoneyMethodID * -1,
                    }
                  : TypeMethods.filter(
                      (x) => Number(x.value) === Number(item?.MethodPayID)
                    )[0]
                : TypeMethods[0],
            SubSourceID: item?.SubSourceID,
            ProdTitle: "",
            ID: item?.ID,
            Desc: item?.Desc,
            IsCash: item?.IsCash || true,
            UserInput: item?.UserInput || false,
            CreateDate: item.CreateDate,
            _MethodID: item?.MethodID,
            Value: Math.abs(item?.Value),
            Value0: Math.abs(item?.Value),
            AdminCreateDate: moment()
              .set({
                date: data?.D,
                month: data?.M - 1,
                year: data?.Y,
              })
              .toDate(),
          };
          let index = Order?.OrderItems?.findIndex(
            (x) => x.ID === item?.ProdID
          );
          if (index > -1) obj.ProdTitle = Order?.OrderItems[index].ProdTitle;
          newPayments.push(obj);
        }
      }
      setTypeMethodsNew(newTypeMethodsNew);
      setValue("Payments", newPayments);
      setValue("Removes", []);
    }
  }, [data, Order, visible, TypeMethods]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  const paymentMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsPaymentOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: Order?.Order?.Member?.ID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientOrderViewPaymentID"]);
      await queryClient.invalidateQueries(["ClientOrderViewID"]);
      await queryClient.invalidateQueries(["OrderManageID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    let newPayment = values?.Payments
      ? values?.Payments.map((x) => {
          let obj = {
            ...x,
            MethodID: x.MethodID?.value ? Number(x.MethodID?.value) : "",
            BankNumber:
              Number(x.MethodID?.value) === 2 && x.BankNumber
                ? `${x.BankNumber?.ngan_hang}|${x.BankNumber?.ten}|${x.BankNumber?.stk}`
                : "",
            AdminCreateDate: moment(x.AdminCreateDate).format("YYYY-MM-DD"),
          };
          delete obj.id;
          return obj;
        })
      : [];
    let newRemoves = values?.Removes
      ? values?.Removes.map((x) => {
          let obj = {
            ...x,
            MethodID: x.MethodID?.value ? Number(x.MethodID?.value) : "",
            BankNumber:
              Number(x.MethodID?.value) === 2 && x.BankNumber
                ? `${x.BankNumber?.ngan_hang}|${x.BankNumber?.ten}|${x.BankNumber?.stk}`
                : "",
          };
          delete obj.id;
          return obj;
        })
      : [];

    var bodyFormData = new FormData();
    bodyFormData.append("day", data?.D + "/" + data?.M + "/" + data?.Y);
    bodyFormData.append("mode", 1);
    bodyFormData.append("dayMethod", data?.MethodID);
    bodyFormData.append("dayItems", JSON.stringify(newPayment));
    bodyFormData.append("removeDayItemPending", JSON.stringify(newRemoves));

    paymentMutation.mutate(
      {
        OrderID: Order?.Order?.ID,
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhật thành công.");
          close();
        },
      }
    );
  };

  const isDisabledSubmit = () => {
    if (adminTools_byStock?.hasRight) {
      return false;
    }
    return (
      moment(`${data?.D}-${data?.M}-${data?.Y}`, "DD-MM-YYYY").format(
        "DD-MM-YYYY"
      ) !== moment().format("DD-MM-YYYY")
    );
  };

  let { Payments } = watch();

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
                    Chỉnh sửa ({data?.D}-{data?.M}-{data?.Y})
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>

                  <div className="px-4 overflow-auto grow">
                    {fields &&
                      fields.map((item, index) => (
                        <div
                          className="border rounded mb-3.5 last:mb-0"
                          key={item.id}
                        >
                          <div className="flex gap-3 px-4 py-3 bg-gray-100 border-b rounded-t">
                            <div className="flex-1 font-semibold leading-6">
                              {item.ProdTitle}
                            </div>
                            <Link
                              noLinkClass
                              className="flex items-baseline justify-end w-10"
                              onClick={() => {
                                append(item);
                                remove(index);
                              }}
                            >
                              <TrashIcon className="w-5 text-danger" />
                            </Link>
                          </div>
                          <div className="p-4">
                            {adminTools_byStock?.hasRight && (
                              <div className="mb-3.5 last:mb-0">
                                <div className="mb-1 text-gray-500">
                                  Ngày thanh toán
                                </div>
                                <Controller
                                  name={`Payments[${index}].AdminCreateDate`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <div className="relative">
                                      <DatePicker
                                        format="DD/MM/YYYY"
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Chọn ngày"
                                        showHeader
                                      />
                                    </div>
                                  )}
                                />
                              </div>
                            )}

                            <div className="mb-3.5 last:mb-0">
                              <div className="mb-1 text-gray-500">Giá trị</div>
                              <Controller
                                name={`Payments[${index}].Value`}
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
                            <div className="mb-3.5 last:mb-0">
                              <div className="mb-1 text-gray-500">
                                Phương thức thanh toán
                              </div>
                              <Controller
                                name={`Payments[${index}].MethodID`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable={true}
                                    placeholder="Chọn loại"
                                    value={field.value}
                                    options={TypeMethodsNew}
                                    label="Chọn loại"
                                    onChange={(val) => {
                                      // clearErrors(`Payments[${index}].Value`);
                                      // if (val?.Type === "VI") {
                                      //   if (
                                      //     !Brand?.Global?.Admin?.Pos_quan_ly
                                      //       ?.thanh_toan_dh
                                      //       ?.thanh_toan_vi_tt_am &&
                                      //     Number(Payments[index].Value) >
                                      //       val?.Total
                                      //   ) {
                                      //     setError(`Payments[${index}].Value`, {
                                      //       type: "Client",
                                      //       message: "Số dư trong ví không đủ.",
                                      //       shouldFocus: true,
                                      //     });
                                      //   }
                                      // }
                                      // if (val?.Type === "THE_TIEN") {
                                      //   if (
                                      //     Number(Payments[index].Value) >
                                      //     val?.Total
                                      //   ) {
                                      //     setError(`Payments[${index}].Value`, {
                                      //       type: "Client",
                                      //       message: "Số dư thẻ tiền không đủ.",
                                      //       shouldFocus: true,
                                      //     });
                                      //   }
                                      // }
                                      field.onChange(val);
                                      if (Banks && Banks?.length > 0) {
                                        setValue(
                                          `Payments[${index}].BankNumber`,
                                          val?.value === "2" ? Banks[0] : null
                                        );
                                      }
                                    }}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                    autoHeight
                                  />
                                )}
                              />
                              {Payments[index].MethodID?.value === "2" && (
                                <div className="mt-2">
                                  <Controller
                                    name={`Payments[${index}].BankNumber`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPicker
                                        isClearable={true}
                                        placeholder="Chọn ngân hàng"
                                        value={field.value}
                                        options={Banks || []}
                                        label="Ngân hàng"
                                        onChange={(val) => field.onChange(val)}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                        autoHeight
                                      />
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    {(!fields || fields.length === 0) && (
                      <div className="text-center text-danger">
                        Bạn đang muốn xoá toàn bộ lịch sử thanh toán ngày
                        <span className="px-1">
                          {data?.D}-{data?.M}-{data?.Y}
                        </span>
                        . Cập nhật để xác nhận ?
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={paymentMutation.isLoading}
                      disabled={
                        paymentMutation.isLoading ||
                        isDisabledSubmit() ||
                        (!Brand?.Global?.Admin
                          ?.Chinh_sua_don_hang_da_thanh_toan &&
                          (Order?.Order?.CPayed || Order?.Order?.MPayed) &&
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

export default PickerEditHisPayment;

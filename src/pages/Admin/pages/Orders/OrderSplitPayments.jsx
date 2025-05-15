import React, { useEffect, useState } from "react";
import {
  Button,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Popover,
  Tab,
  Tabs,
  f7,
  useStore,
} from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { SelectPicker } from "@/partials/forms";
import {
  MenuSubSplitPay,
  PickerEditHisPayment,
  PickerPaymentDateOrder,
  PickerPaymentNoteOrder,
} from "./components";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import Dom7 from "dom7";
import { toast } from "react-toastify";
import { QrBanks } from "../Pos/components";
import PullToRefresh from "react-simple-pull-to-refresh";

let TypeMethods = [
  {
    label: "Tiền mặt",
    value: "1",
  },
  {
    label: "Chuyển khoản",
    value: "2",
  },
  {
    label: "Quẹt thẻ",
    value: "3",
  },
  {
    label: "Ví",
    value: "0",
    Type: "VI",
    Total: 0,
  },
];

const Payments = ({
  data,
  DebtPay,
  isLoading,
  prevState,
  active,
  f7route,
  refetch,
}) => {
  let queryClient = useQueryClient();
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");

  const {
    control,
    handleSubmit,
    clearErrors,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      PaymentsAll: [
        {
          MethodID: TypeMethods[0],
          Value: 0,
          BankNumber: "",
        },
      ],
    },
  });

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control,
      name: "PaymentsAll",
    }
  );

  useEffect(() => {
    if (data) {
      clearErrors();
      setValue("PaymentsAll", [
        {
          Value: data?.Order?.ToPay - data?.Payment?.TotalPayed,
          MethodID: TypeMethods[0],
          BankNumber: "",
        },
      ]);
    } else {
      reset();
    }
  }, [data, active]);

  const updateOptionMethodAll = (Types) => {
    let TypesClone = [...Types].filter((o) =>
      o?.Source === "THE_TIEN" ? o.Value > 0 : !o.Value
    );

    let newData = data?.OrderItems.map((item) => ({
      ProdID: item?.ProdID,
      MethodID: TypeMethods[0],
      Value: item?.ToPay,
      SubSourceID: item?.ID,
      ProdTitle: item.ProdTitle,
      ID: 0,
      Desc: "",
      IsAbstract: false,
      IsCash: false,
      UserInput: false,
    }));
    if (data?.Payment && data?.Payment && data?.Payment?.Days.length > 0) {
      for (let day of data?.Payment?.Days) {
        for (let cash of day?.Cashs) {
          let index = newData.findIndex(
            (o) => o.SubSourceID === cash.SubSourceID
          );
          if (index > -1) {
            newData[index].Value = newData[index].Value - cash.Value;
          }
        }
        for (let money of day?.MemberMoneys) {
          let index = newData.findIndex(
            (o) => o.SubSourceID === money.SubSourceID
          );
          if (index > -1) {
            newData[index].Value = newData[index].Value - money.Value * -1;
          }
        }
      }
    }
    newData = newData.filter((o) => o.Value > 0);
    let newTypes = [];
    for (let o of TypesClone) {
      if (o.Source === "THE_TIEN") {
        let { MoneyProd, MoneyService, MoneyInfo } = o;
        let { cates, manus, prods } = MoneyInfo.limit;
        newData = data?.OrderItems?.filter((x) =>
          newTypes.findIndex((k) => k.ProdID === x.ProdID)
        ).map((k) => {
          let { ProdID, ProdType, ProdManu, ProdOrService } = k;
          let isCates = cates ? cates.includes(ProdType) : !prods;
          let isManus = manus ? manus.includes(ProdManu) : false;
          let isProds = prods ? prods.includes(ProdID) : true;

          let has = false;

          if (MoneyProd === 0 && MoneyService === 0) {
            has = true;
          } else {
            if (ProdOrService === 0 && MoneyProd > 0) {
              has = true;
            }

            if (ProdOrService === 1 && MoneyService > 0) {
              has = true;
            }
          }

          return {
            ...k,
            isUse: (isCates || isManus || isProds) && has,
          };
        });
        if (newData.every((x) => x.isUse)) {
          newTypes.push(o);
        }
      } else {
        newTypes.push(o);
      }
    }
    return newTypes;
  };

  const paymentMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.clientsPaymentOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: data?.Order?.Member?.ID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientOrderViewPaymentID"]);
      if (prevState && prevState.invalidateQueries) {
        await Promise.all(
          prevState.invalidateQueries.map((key) =>
            queryClient.invalidateQueries([key])
          )
        );
      } else {
        await queryClient.invalidateQueries(["ClientOrderViewID"]);
        await queryClient.invalidateQueries(["OrderManageID"]);
      }
      return rs;
    },
  });

  const onSubmit = async ({ PaymentsAll }) => {
    if (
      PaymentsAll &&
      PaymentsAll.some((x) =>
        Brand?.Global?.Admin?.Pos_quan_ly?.thanh_toan_dh?.thanh_toan_vi_tt_am
          ? typeof x?.MethodID?.Total !== "undefined" &&
            x?.MethodID?.Total < x.Value &&
            x?.MethodID?.Type === "THE_TIEN"
          : typeof x?.MethodID?.Total !== "undefined" &&
            x?.MethodID?.Total < x.Value
      )
    ) {
      for (let [i, pay] of PaymentsAll.entries()) {
        if (
          pay?.MethodID?.Type === "VI" &&
          !Brand?.Global?.Admin?.Pos_quan_ly?.thanh_toan_dh
            ?.thanh_toan_vi_tt_am &&
          typeof pay?.MethodID?.Total !== "undefined" &&
          pay?.MethodID?.Total < pay.Value
        ) {
          setError(`PaymentsAll[${i}].Value`, {
            type: "Client",
            message: "Số dư trong ví không đủ.",
            shouldFocus: true,
          });
        }
        if (
          pay?.MethodID?.Type === "THE_TIEN" &&
          typeof pay?.MethodID?.Total !== "undefined" &&
          pay?.MethodID?.Total < pay.Value
        ) {
          setError(`PaymentsAll[${i}].Value`, {
            type: "Client",
            message: "Số dư thẻ tiền không đủ.",
            shouldFocus: true,
          });
        }
      }
      return;
    }

    f7.dialog.preloader("Đang thực hiện ...");

    let newPayments = [];
    for (let pay of PaymentsAll ? PaymentsAll.filter((x) => x.Value > 0) : []) {
      let { Value, MethodID, BankNumber } = pay;
      let newData = data?.OrderItems.map((item) => ({
        ProdID: item?.ProdID,
        MethodID: TypeMethods[0],
        Value: item?.ToPay,
        SubSourceID: item?.ID,
        ProdTitle: item.ProdTitle,
        ID: 0,
        Desc: "",
        IsAbstract: false,
        IsCash: false,
        UserInput: false,
      }));
      if (data?.Payment && data?.Payment && data?.Payment?.Days.length > 0) {
        for (let day of data?.Payment?.Days) {
          for (let cash of day?.Cashs) {
            let index = newData.findIndex(
              (o) => o.SubSourceID === cash.SubSourceID
            );
            if (index > -1) {
              newData[index].Value = newData[index].Value - cash.Value;
            }
          }
          for (let money of day?.MemberMoneys) {
            let index = newData.findIndex(
              (o) => o.SubSourceID === money.SubSourceID
            );
            if (index > -1) {
              newData[index].Value = newData[index].Value - money.Value * -1;
            }
          }
        }
      }
      newData = newData.filter((o) => o.Value > 0);

      let RemainPay = data?.Order?.ToPay - data?.Payment?.TotalPayed;
      let PaymentRate = (Value / RemainPay) * 100;

      let newPayment = newData.map((x) => ({
        ...x,
        Value: Math.round((x.Value * PaymentRate) / 100),
        MethodID: MethodID?.value || "",
        BankNumber:
          Number(MethodID?.value) === 2 && BankNumber
            ? `${BankNumber?.ngan_hang}|${BankNumber?.ten}|${BankNumber?.stk}`
            : "",
      }));

      let TotalPayedSend = ArrayHelpers.sumTotal(newPayment, "Value");
      if (Value - TotalPayedSend !== 0) {
        let Residual = Value - TotalPayedSend;

        if (Value - TotalPayedSend > 0) {
          newPayment[newPayment.length - 1]["Value"] =
            newPayment[newPayment.length - 1]["Value"] + Residual;
        } else {
          newPayment[newPayment.length - 1]["Value"] =
            newPayment[newPayment.length - 1]["Value"] - Residual;
        }
      }

      newPayments = newPayments.concat(newPayment);
    }

    var bodyFormData = new FormData();
    bodyFormData.append(
      "DayToPay",
      data?.Order?.DayToPay
        ? moment(data?.Order?.DayToPay).format("DD-MM-YYYY HH:mm")
        : ""
    );
    bodyFormData.append("mode", 1);
    bodyFormData.append("autobonus", 0);
    bodyFormData.append("set_desc", 1);
    bodyFormData.append("desc", data?.Order?.Desc || "");
    bodyFormData.append("add", JSON.stringify(newPayments));

    let rs = await paymentMutation.mutateAsync({
      OrderID: data?.Order?.ID,
      data: bodyFormData,
      Token: Auth?.token,
    });

    f7.dialog.close();

    if (rs?.data?.data.hasAuto) {
      f7.dialog.confirm(
        "Bạn có muốn thực hiện thưởng hoa hồng & doanh số tự động cho lần thanh toán này ?",
        () => {
          f7.views.main.router.navigate(
            `/admin/pos/orders/view/${f7route?.params?.id}/bonus-sales-commission-auto/`
          );
        }
      );
    } else {
      f7.dialog.confirm(
        "Bạn có muốn thực hiện thưởng hoa hồng & doanh số cho lần thanh toán này ?",
        () => {
          f7.views.main.router.navigate(
            `/admin/pos/orders/view/${f7route?.params?.id}/bonus-sales-commission/`
          );
        }
      );
    }
    toast.success("Thanh toán thành công.");
    window?.noti27?.TIN_NHAN &&
      window?.noti27.TIN_NHAN({
        type: "PAYMENT_POS",
        data: {
          ...data,
          Payments: newPayments,
        },
      });
  };

  const { PaymentsAll } = watch();

  let TotalPay = ArrayHelpers.sumTotal(PaymentsAll, "Value");
  let TotalBanks = ArrayHelpers.sumTotal(
    PaymentsAll.filter((x) => Number(x.MethodID.value) === 2),
    "Value"
  );
  return (
    <form
      className="relative flex flex-col h-full pb-safe-b"
      onSubmit={handleSubmit(onSubmit)}
    >
      <PullToRefresh className="overflow-auto grow ezs-ptr" onRefresh={refetch}>
        <div className="h-full p-4 overflow-auto">
          {fields &&
            fields.map((field, index) => (
              <div className="mb-4 border rounded last:mb-0" key={field.id}>
                <div className="flex gap-3 px-4 py-3 bg-gray-100 border-b rounded-t">
                  <div className="flex-1 font-semibold leading-6">
                    Thanh toán
                  </div>
                  <Link
                    noLinkClass
                    className="flex items-baseline justify-end w-10"
                    popoverOpen={`.popover-order-payment-action-${field.id}`}
                  >
                    <EllipsisHorizontalIcon className="w-7" />
                  </Link>
                  <Popover
                    className={clsx(
                      "w-[100px]",
                      `popover-order-payment-action-${field.id}`
                    )}
                  >
                    <div className="flex flex-col py-1">
                      <Link
                        popoverClose
                        className="flex justify-between p-3 font-medium border-b last:border-0"
                        noLinkClass
                        onClick={() =>
                          insert(index + 1, {
                            MethodID: TypeMethods[0],
                            Value:
                              DebtPay - TotalPay > 0 ? DebtPay - TotalPay : 0,
                            BankNumber: "",
                          })
                        }
                      >
                        Thêm
                      </Link>
                      {fields.length > 1 && (
                        <Link
                          popoverClose
                          className="flex justify-between p-3 font-medium border-b last:border-0 text-danger"
                          noLinkClass
                          onClick={() =>
                            f7.dialog.confirm("Xác nhận xoá ?", () =>
                              remove(index)
                            )
                          }
                        >
                          Xoá
                        </Link>
                      )}
                    </div>
                  </Popover>
                </div>
                <div className="p-4">
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-1 text-gray-500">Giá trị</div>
                    <Controller
                      name={`PaymentsAll[${index}].Value`}
                      control={control}
                      rules={{
                        required:
                          PaymentsAll[index].Value.MethodID?.Type === "VI"
                            ? PaymentsAll[index].Value >
                              PaymentsAll[index].MethodID?.Total
                            : false,
                      }}
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
                            onValueChange={(val) => {
                              clearErrors(`PaymentsAll[${index}].Value`);
                              field.onChange(val.floatValue || "");
                              if (
                                PaymentsAll[index]?.MethodID?.Type ===
                                "THE_TIEN"
                              ) {
                                let TotalUse = ArrayHelpers.sumTotal(
                                  PaymentsAll.filter(
                                    (x) =>
                                      x?.MethodID?.ID ===
                                      PaymentsAll[index]?.MethodID?.ID
                                  ),
                                  "Value"
                                );
                                if (
                                  Number(val.floatValue) >
                                  PaymentsAll[index]?.MethodID?.Total -
                                    TotalUse +
                                    Number(val.floatValue)
                                ) {
                                  setError(`PaymentsAll[${index}].Value`, {
                                    type: "Client",
                                    message: "Số dư thẻ tiền không đủ.",
                                    shouldFocus: true,
                                  });
                                }
                              }
                            }}
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
                      name={`PaymentsAll[${index}].MethodID`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <SelectPicker
                          isClearable={false}
                          placeholder="Chọn loại"
                          value={field.value}
                          options={updateOptionMethodAll(
                            data?.TypeMethods || TypeMethods,
                            PaymentsAll
                          )}
                          label="Chọn loại"
                          onChange={(val) => {
                            clearErrors(`PaymentsAll[${index}].Value`);
                            if (val?.Type === "VI") {
                              if (
                                !Brand?.Global?.Admin?.Pos_quan_ly
                                  ?.thanh_toan_dh?.thanh_toan_vi_tt_am &&
                                Number(PaymentsAll[index].Value) > val?.Total
                              ) {
                                setError(`PaymentsAll[${index}].Value`, {
                                  type: "Client",
                                  message: "Số dư trong ví không đủ.",
                                  shouldFocus: true,
                                });
                              }
                            }
                            if (val?.Type === "THE_TIEN") {
                              let Total = val?.Total;
                              let TotalUse = ArrayHelpers.sumTotal(
                                PaymentsAll.filter(
                                  (x) => x?.MethodID?.ID === val?.ID
                                ),
                                "Value"
                              );

                              if (
                                Number(PaymentsAll[index].Value) >
                                Total - TotalUse
                              ) {
                                setError(`PaymentsAll[${index}].Value`, {
                                  type: "Client",
                                  message: "Số dư thẻ tiền không đủ.",
                                  shouldFocus: true,
                                });
                              }
                            }
                            field.onChange(val);
                            if (data?.Banks && data?.Banks?.length > 0) {
                              setValue(
                                `PaymentsAll[${index}].BankNumber`,
                                val?.value === "2" ? data?.Banks[0] : null
                              );
                            }
                          }}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          autoHeight
                        />
                      )}
                    />
                    {PaymentsAll[index].MethodID?.value === "2" && (
                      <div className="mt-2">
                        <Controller
                          name={`PaymentsAll[${index}].BankNumber`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <SelectPicker
                              isClearable={true}
                              placeholder="Chọn ngân hàng"
                              value={field.value}
                              options={data?.Banks || []}
                              label="Ngân hàng"
                              onChange={(val) => field.onChange(val)}
                              errorMessage={fieldState?.error?.message}
                              errorMessageForce={fieldState?.invalid}
                              autoHeight
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* <div className="mb-3.5 last:mb-0">
                <div
                  onClick={() =>
                    append({
                      MethodID: TypeMethods[0],
                      Value: 0,
                      BankNumber: "",
                    })
                  }
                >
                  Thêm
                </div>
                <div>Xoá</div>
              </div> */}
              </div>
            ))}
        </div>
      </PullToRefresh>
      <div className="p-4 border-t">
        {DebtPay > 0 && (
          <div className="flex items-end justify-between mb-2.5">
            {TotalPay === DebtPay && (
              <>
                <div className="font-medium leading-3">Tổng thanh toán</div>
                <div className="text-base font-bold leading-3 font-lato">
                  ₫{StringHelpers.formatVND(TotalPay)}
                </div>
              </>
            )}
            {TotalPay < DebtPay && (
              <>
                <div className="font-medium leading-3">
                  Thanh toán còn thiếu
                </div>
                <div className="text-base font-bold leading-3 font-lato text-danger">
                  ₫{StringHelpers.formatVNDPositive(TotalPay - DebtPay)}
                </div>
              </>
            )}
            {TotalPay > DebtPay && (
              <>
                <div className="font-medium leading-3">Thanh toán dư</div>
                <div className="text-base font-bold leading-3 font-lato text-danger">
                  ₫{StringHelpers.formatVND(TotalPay - DebtPay)}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            popoverOpen=".popover-order-payments"
            type="button"
            className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
            fill
            large
            preloader
          >
            <EllipsisVerticalIcon className="w-6" />
          </Button>

          {TotalBanks > 0 && <QrBanks Order={data?.Order} Value={TotalBanks} />}

          <Button
            type="submit"
            className="flex-1 bg-success"
            fill
            large
            preloader
            loading={isLoading || paymentMutation.isLoading}
            disabled={
              isLoading ||
              TotalPay > DebtPay ||
              DebtPay === 0 ||
              TotalPay === 0 ||
              paymentMutation.isLoading ||
              DebtPay < 0 ||
              errors?.PaymentsAll
            }
          >
            {DebtPay === 0 && "Đã thanh toán"}
            {(DebtPay > 0 || DebtPay < 0) && "Thanh toán"}
          </Button>
          <Button
            type="button"
            className="w-[50px] bg-primary"
            fill
            large
            preloader
            onClick={() => {
              f7.views.main.router.navigate(
                `/admin/printers/order/${data?.Order?.ID}/`
              );
            }}
            loading={isLoading}
            disabled={isLoading}
          >
            <PrinterIcon className="w-6" />
          </Button>
        </div>
      </div>
    </form>
  );
};

const PaymentsSplit = ({
  data,
  DebtPay,
  isLoading,
  prevState,
  updateOptionMethod,
  active,
  f7route,
  refetch,
}) => {
  let queryClient = useQueryClient();
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");

  const {
    control,
    handleSubmit,
    clearErrors,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      Payments: [],
    },
  });

  const { fields, remove, insert } = useFieldArray({
    control,
    name: "Payments",
  });

  useEffect(() => {
    if (data) {
      clearErrors();
      let newData = data?.OrderItems.map((item) => ({
        ProdID: item?.ProdID,
        MethodID: TypeMethods[0],
        Value: item?.ToPay,
        SubSourceID: item?.ID,
        ProdTitle: item.ProdTitle,
        ID: 0,
        Desc: "",
        IsAbstract: false,
        IsCash: false,
        UserInput: false,
      }));
      if (data?.Payment && data?.Payment && data?.Payment?.Days.length > 0) {
        for (let day of data?.Payment?.Days) {
          for (let cash of day?.Cashs) {
            let index = newData.findIndex(
              (o) => o.SubSourceID === cash.SubSourceID
            );
            if (index > -1) {
              newData[index].Value = newData[index].Value - cash.Value;
            }
          }
          for (let money of day?.MemberMoneys) {
            let index = newData.findIndex(
              (o) => o.SubSourceID === money.SubSourceID
            );
            if (index > -1) {
              newData[index].Value = newData[index].Value - money.Value * -1;
            }
          }
        }
      }
      setValue(
        "Payments",
        newData.filter((o) => o.Value > 0)
      );
    } else {
      reset();
    }
  }, [data, active]);

  const paymentMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.clientsPaymentOrderId(body);
      await queryClient.invalidateQueries(["ClientOrderViewPaymentID"]);
      if (prevState && prevState.invalidateQueries) {
        await Promise.all(
          prevState.invalidateQueries.map((key) =>
            queryClient.invalidateQueries([key])
          )
        );
      } else {
        await queryClient.invalidateQueries(["ClientOrderViewID"]);
        await queryClient.invalidateQueries(["OrderManageID"]);
      }
      return rs;
    },
  });

  const onSubmit = (values) => {
    if (
      values?.Payments &&
      values?.Payments.some((x) =>
        Brand?.Global?.Admin?.Pos_quan_ly?.thanh_toan_dh?.thanh_toan_vi_tt_am
          ? typeof x?.MethodID?.Total !== "undefined" &&
            x?.MethodID?.Total < x.Value &&
            x?.MethodID?.Type === "THE_TIEN"
          : typeof x?.MethodID?.Total !== "undefined" &&
            x?.MethodID?.Total < x.Value
      )
    ) {
      for (let [i, pay] of values?.Payments.entries()) {
        if (
          pay?.MethodID?.Type === "VI" &&
          !Brand?.Global?.Admin?.Pos_quan_ly?.thanh_toan_dh
            ?.thanh_toan_vi_tt_am &&
          typeof pay?.MethodID?.Total !== "undefined" &&
          pay?.MethodID?.Total < pay.Value
        ) {
          setError(`Payments[${i}].Value`, {
            type: "Client",
            message: "Số dư trong ví không đủ.",
            shouldFocus: true,
          });
        }
        if (
          pay?.MethodID?.Type === "THE_TIEN" &&
          typeof pay?.MethodID?.Total !== "undefined" &&
          pay?.MethodID?.Total < pay.Value
        ) {
          setError(`Payments[${i}].Value`, {
            type: "Client",
            message: "Số dư thẻ tiền không đủ.",
            shouldFocus: true,
          });
        }
      }
      return;
    }

    f7.dialog.preloader("Đang thực hiện ...");

    let newPayment = values?.Payments.map((x) => ({
      ...x,
      MethodID: x.MethodID?.value || "",
      BankNumber:
        Number(x.MethodID?.value) === 2 && x.BankNumber
          ? `${x.BankNumber?.ngan_hang}|${x.BankNumber?.ten}|${x.BankNumber?.stk}`
          : "",
    }));

    var bodyFormData = new FormData();
    bodyFormData.append(
      "DayToPay",
      data?.Order?.DayToPay
        ? moment(data?.Order?.DayToPay).format("DD-MM-YYYY HH:mm")
        : ""
    );
    bodyFormData.append("mode", 1);
    bodyFormData.append("autobonus", 0);
    bodyFormData.append("set_desc", 1);
    bodyFormData.append("desc", data?.Order?.Desc || "");
    bodyFormData.append("add", JSON.stringify(newPayment));
    let rsData = data;
    paymentMutation.mutate(
      {
        OrderID: data?.Order?.ID,
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          f7.dialog.close();
          if (data?.data.hasAuto) {
            f7.dialog.confirm(
              "Bạn có muốn thực hiện thưởng hoa hồng & doanh số tự động cho lần thanh toán này ?",
              () => {
                f7.views.main.router.navigate(
                  `/admin/pos/orders/view/${f7route?.params?.id}/bonus-sales-commission-auto/`
                );
              }
            );
          } else {
            f7.dialog.confirm(
              "Bạn có muốn thực hiện thưởng hoa hồng & doanh số cho lần thanh toán này ?",
              () => {
                f7.views.main.router.navigate(
                  `/admin/pos/orders/view/${f7route?.params?.id}/bonus-sales-commission/`
                );
              }
            );
          }
          toast.success("Thanh toán thành công.");
          window?.noti27?.TIN_NHAN &&
            window?.noti27.TIN_NHAN({
              type: "PAYMENT_POS",
              data: {
                ...rsData,
                Payments: newPayments,
              },
            });
        },
      }
    );
  };

  let { Payments } = watch();
  let TotalPay = ArrayHelpers.sumTotal(Payments, "Value");
  let TotalBanks = ArrayHelpers.sumTotal(
    Payments.filter((x) => Number(x.MethodID.value) === 2),
    "Value"
  );

  return (
    <form
      className="relative flex flex-col h-full pb-safe-b"
      onSubmit={handleSubmit(onSubmit)}
    >
      <PullToRefresh className="grow ezs-ptr" onRefresh={refetch}>
        <div className="h-full p-4 overflow-auto">
          {fields &&
            fields.map((item, index) => (
              <div className="border rounded mb-3.5 last:mb-0" key={item.id}>
                <div className="flex gap-3 px-4 py-3 bg-gray-100 border-b rounded-t">
                  <div className="flex-1 font-semibold leading-6">
                    {item.ProdTitle}
                    {item.isNew && <span className="pl-1 text-success">*</span>}
                  </div>
                  <Link
                    noLinkClass
                    className="flex items-baseline justify-end w-10"
                    popoverOpen={`.popover-order-payment-action-${item.id}`}
                  >
                    <EllipsisHorizontalIcon className="w-7" />
                  </Link>
                  <Popover
                    className={clsx(
                      "w-[100px]",
                      `popover-order-payment-action-${item.id}`
                    )}
                  >
                    <div className="flex flex-col py-1">
                      <Link
                        popoverClose
                        className="flex justify-between p-3 font-medium border-b last:border-0"
                        noLinkClass
                        onClick={() =>
                          insert(index + 1, {
                            ...item,
                            Value: 0,
                            isNew: true,
                          })
                        }
                      >
                        Thêm
                      </Link>
                      {fields.length > 1 && (
                        <Link
                          popoverClose
                          className="flex justify-between p-3 font-medium border-b last:border-0 text-danger"
                          noLinkClass
                          onClick={() =>
                            f7.dialog.confirm("Xác nhận xoá ?", () =>
                              remove(index)
                            )
                          }
                        >
                          Xoá
                        </Link>
                      )}
                    </div>
                  </Popover>
                </div>
                <div className="p-4">
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-1 text-gray-500">Giá trị</div>
                    <Controller
                      name={`Payments[${index}].Value`}
                      control={control}
                      rules={{
                        required:
                          Payments[index].MethodID?.Type === "VI"
                            ? Payments[index].Value >
                              Payments[index].MethodID?.Total
                            : false,
                      }}
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
                            onValueChange={(val) => {
                              clearErrors(`Payments[${index}].Value`);
                              field.onChange(val.floatValue || "");
                              if (
                                Payments[index]?.MethodID?.Type === "THE_TIEN"
                              ) {
                                let TotalUse = ArrayHelpers.sumTotal(
                                  Payments.filter(
                                    (x) =>
                                      x?.MethodID?.ID ===
                                      Payments[index]?.MethodID?.ID
                                  ),
                                  "Value"
                                );
                                if (
                                  Number(val.floatValue) >
                                  Payments[index]?.MethodID?.Total -
                                    TotalUse +
                                    Number(val.floatValue)
                                ) {
                                  setError(`Payments[${index}].Value`, {
                                    type: "Client",
                                    message: "Số dư thẻ tiền không đủ.",
                                    shouldFocus: true,
                                  });
                                }
                              }
                            }}
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
                          options={updateOptionMethod(
                            data?.TypeMethods || TypeMethods,
                            item
                          )}
                          label="Chọn loại"
                          onChange={(val) => {
                            clearErrors(`Payments[${index}].Value`);
                            if (val?.Type === "VI") {
                              if (
                                !Brand?.Global?.Admin?.Pos_quan_ly
                                  ?.thanh_toan_dh?.thanh_toan_vi_tt_am &&
                                Number(Payments[index].Value) > val?.Total
                              ) {
                                setError(`Payments[${index}].Value`, {
                                  type: "Client",
                                  message: "Số dư trong ví không đủ.",
                                  shouldFocus: true,
                                });
                              }
                            }
                            if (val?.Type === "THE_TIEN") {
                              let Total = val?.Total;
                              let TotalUse = ArrayHelpers.sumTotal(
                                Payments.filter(
                                  (x) => x?.MethodID?.ID === val?.ID
                                ),
                                "Value"
                              );

                              if (
                                Number(Payments[index].Value) >
                                Total - TotalUse
                              ) {
                                setError(`Payments[${index}].Value`, {
                                  type: "Client",
                                  message: "Số dư thẻ tiền không đủ.",
                                  shouldFocus: true,
                                });
                              }
                            }
                            field.onChange(val);
                            if (data?.Banks && data?.Banks?.length > 0) {
                              setValue(
                                `Payments[${index}].BankNumber`,
                                val?.value === "2" ? data?.Banks[0] : null
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
                              options={data?.Banks || []}
                              label="Ngân hàng"
                              onChange={(val) => field.onChange(val)}
                              errorMessage={fieldState?.error?.message}
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
        </div>
      </PullToRefresh>
      <div className="p-4 border-t">
        {DebtPay > 0 && (
          <div className="flex items-end justify-between mb-2.5">
            {TotalPay <= DebtPay && (
              <>
                <div className="font-medium leading-3">Tổng thanh toán</div>
                <div className="text-base font-bold leading-3 font-lato">
                  ₫{StringHelpers.formatVND(TotalPay)}
                </div>
              </>
            )}
            {TotalPay > DebtPay && (
              <>
                <div className="font-medium leading-3">Thanh toán dư</div>
                <div className="text-base font-bold leading-3 font-lato text-danger">
                  ₫{StringHelpers.formatVND(TotalPay - DebtPay)}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            popoverOpen=".popover-order-payments"
            type="button"
            className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
            fill
            large
            preloader
          >
            <EllipsisVerticalIcon className="w-6" />
          </Button>

          {TotalBanks > 0 && <QrBanks Order={data?.Order} Value={TotalBanks} />}

          <Button
            type="submit"
            className="flex-1 bg-success"
            fill
            large
            preloader
            loading={isLoading || paymentMutation.isLoading}
            disabled={
              isLoading ||
              TotalPay > DebtPay ||
              Payments.length === 0 ||
              DebtPay === 0 ||
              TotalPay === 0 ||
              paymentMutation.isLoading ||
              DebtPay < 0 ||
              errors?.Payments
            }
          >
            {DebtPay === 0 && "Đã thanh toán"}
            {(DebtPay > 0 || DebtPay < 0) && "Thanh toán"}
          </Button>
          <Button
            type="button"
            className="w-[50px] bg-primary"
            fill
            large
            preloader
            onClick={() => {
              f7.views.main.router.navigate(
                `/admin/printers/order/${data?.Order?.ID}/`
              );
            }}
            loading={isLoading}
            disabled={isLoading}
          >
            <PrinterIcon className="w-6" />
          </Button>
        </div>
      </div>
    </form>
  );
};

function OrderSplitPayments({ f7route }) {
  let Auth = useStore("Auth");

  let [active, setActive] = useState(null);

  let prevState = f7route?.query?.prevState
    ? JSON.parse(f7route?.query?.prevState)
    : null;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ClientOrderViewPaymentID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsViewOrderPaymentId({
        OrderID: f7route?.params?.id,
        Token: Auth?.token,
      });

      let newTypeMethods = [...TypeMethods];

      if (data?.data?.MMMethods && data?.data?.MMMethods.length > 0) {
        for (let item of data?.data?.MMMethods) {
          if (item.ID === 0) {
            let index = newTypeMethods.findIndex((x) => Number(x.value) === 0);
            if (index > -1) {
              newTypeMethods[index]["Total"] = item.Value;
              newTypeMethods[index]["label"] =
                "Ví" + ` - Còn ${StringHelpers.formatVND(item.Value)}`;
              newTypeMethods[index]["Type"] = "VI";
            }
          }
          if (item.Source === "THE_TIEN") {
            newTypeMethods.push({
              ...item,
              label:
                item.MoneyTitle +
                ` - Còn ${StringHelpers.formatVND(item?.Value)}`,
              value: item.ID * -1,
              Type: item.Source,
              Total: item?.Value,
            });
          }
        }
      }

      return (
        {
          ...data?.data,
          Banks: data?.data?.ngan_hang?.ngan_hang
            ? data?.data?.ngan_hang?.ngan_hang.map((x) => ({
                ...x,
                label: `${x.ten} - ${x.ngan_hang.split(/[, ]+/).pop()}`,
                value: x.stk,
              }))
            : [],
          TypeMethods: newTypeMethods,
        } || null
      );
    },
    onSuccess: (data) => {
      if (data) {
        if (data?.Order?.ToPay - data?.Payment?.TotalPayed === 0) {
          f7.tab.show(Dom7("#" + "History"), true);
          setActive("History");
        } else {
          setActive("Payments");
          f7.tab.show(Dom7("#" + "Payments"), true);
        }
      }
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const updateOptionMethod = (Types, item) => {
    let newTypes = [...Types];
    if (item) {
      newTypes = newTypes
        .filter((o) => {
          if (o.Source !== "THE_TIEN") return true;
          if (o.Source === "THE_TIEN" && o?.MoneyInfo?.limit) {
            let { cates, manus, prods } = o?.MoneyInfo?.limit;
            let index = data?.OrderItems?.findIndex(
              (x) => x.ProdID === item?.ProdID
            );
            if (index > -1) {
              let { ProdID, ProdType, ProdManu } = data?.OrderItems[index];
              let isCates = cates ? cates.includes(ProdType) : !prods;
              let isManus = manus ? manus.includes(ProdManu) : false;
              let isProds = prods ? prods.includes(ProdID) : true;
              return isCates || isManus || isProds;
            } else {
              return false;
            }
          }
        })
        .map((o) => {
          if (o.Source !== "THE_TIEN") return o;
          if (o.Source === "THE_TIEN" && !o?.MoneyInfo) return o;
          let { MoneyProd, MoneyService, Value } = o;

          let index = data?.OrderItems?.findIndex(
            (x) => x.ProdID === item?.ProdID
          );

          if (index > -1) {
            let { ProdOrService } = data?.OrderItems[index];
            let newObj = {
              ...o,
            };
            if (MoneyService === 0 && MoneyProd === 0) {
              newObj.Total = Value;
              newObj.label =
                o.MoneyTitle + ` - Còn ${StringHelpers.formatVND(Value)}`;
              return newObj;
            } else {
              if (ProdOrService === 1) {
                newObj.Total = MoneyService;
                newObj.label =
                  o.MoneyTitle +
                  ` - Còn ${StringHelpers.formatVND(MoneyService)}`;
                if (MoneyService === 0) newObj.IsRemove = MoneyService === 0;
                return newObj;
              }
              if (ProdOrService === 0) {
                newObj.Total = MoneyProd;
                newObj.label =
                  o.MoneyTitle + ` - Còn ${StringHelpers.formatVND(MoneyProd)}`;
                if (MoneyProd === 0) newObj.IsRemove = MoneyProd === 0;
                return newObj;
              }
              return o;
            }
          } else {
            return o;
          }
        })
        .filter(
          (o) =>
            !o.IsRemove && (o.Source === "THE_TIEN" ? o.Value > 0 : !o.Value)
        );
    }
    return newTypes;
  };

  const getTitleMethod = (MethodID) => {
    let index = (data?.TypeMethods || TypeMethods).findIndex(
      (x) => Number(x.value) === Number(MethodID)
    );
    if (index > -1) {
      return (data?.TypeMethods || TypeMethods)[index].label.split("-")[0];
    }
    return "Chưa xác định";
  };

  let DebtPay = data?.Order?.ToPay - data?.Payment?.TotalPayed;
  let TotalBanks = ArrayHelpers.sumTotal(
    data?.Payment?.Days.filter((x) => Number(x.MethodID) === 2),
    "Value"
  );

  return (
    <Page
      className="bg-white"
      name="Order-view"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      // ptr
      // onPtrRefresh={(done) => refetch().then(() => done())}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Thanh toán đơn hàng #{f7route?.params?.id}</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full">
        <div className="px-4 border-b h-[var(--f7-navbar-height)]">
          <MenuSubSplitPay
            data={[
              {
                Index: 1,
                ID: "Payments",
                Title: "Tổng đơn",
                children: [],
                disabled: DebtPay === 0 && data?.Payment?.TotalPayed !== 0,
              },
              {
                Index: 2,
                ID: "PaymentsSplit",
                Title: "Thanh toán từng phần",
                children: [],
                disabled: DebtPay === 0 && data?.Payment?.TotalPayed !== 0,
              },
              {
                Index: 3,
                ID: "History",
                Title: "Lịch sử thanh toán",
                children: Array(data?.Payment?.Days.length).fill(),
                disabled: data?.Payment?.Days?.length === 0,
              },
            ]}
            selected={active}
            setSelected={(o) => {
              setActive(o);
              f7.tab.show(Dom7("#" + o), true);
            }}
          />
        </div>

        <div style={{ height: "calc(100% - var(--f7-navbar-height))" }}>
          <Tabs animated className="h-full">
            <Tab
              id="Payments"
              className="h-full"
              tabActive={active === "Payments"}
            >
              {(isLoading || !active) && (
                <div
                  role="status"
                  className={clsx(
                    "left-0 flex items-center justify-center w-full h-full transition top-0 z-10 bg-white/50"
                  )}
                >
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 mr-2 text-gray-300 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      className="fill-muted"
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              )}
              {!isLoading && (
                <Payments
                  data={data}
                  DebtPay={DebtPay}
                  isLoading={isLoading}
                  prevState={prevState}
                  active={active}
                  f7route={f7route}
                  refetch={refetch}
                />
              )}
            </Tab>
            <Tab
              id="PaymentsSplit"
              className="h-full"
              tabActive={active === "PaymentsSplit"}
            >
              {!isLoading && (
                <PaymentsSplit
                  data={data}
                  DebtPay={DebtPay}
                  isLoading={isLoading}
                  updateOptionMethod={updateOptionMethod}
                  prevState={prevState}
                  active={active}
                  f7route={f7route}
                  refetch={refetch}
                />
              )}
            </Tab>
            <Tab
              id="History"
              className="h-full"
              tabActive={active === "History"}
            >
              {!isLoading && (
                <div className="flex flex-col h-full pb-safe-b">
                  <PullToRefresh
                    className="overflow-auto grow ezs-ptr"
                    onRefresh={refetch}
                  >
                    <div className="h-full p-4 overflow-auto">
                      {data?.Payment?.Days &&
                        data?.Payment?.Days.map((item, index) => (
                          <div
                            className="mb-4 border rounded last:mb-0"
                            key={index}
                          >
                            <PickerEditHisPayment
                              data={item}
                              TypeMethods={updateOptionMethod(
                                data?.TypeMethods || TypeMethods,
                                item
                              )}
                              TypeMethodsServer={
                                data?.TypeMethods || TypeMethods
                              }
                              Order={data}
                              Banks={data?.Banks || []}
                            >
                              {({ open }) => (
                                <div
                                  className="flex justify-between px-4 py-3 bg-gray-100 rounded-t"
                                  onClick={open}
                                >
                                  <div className="font-semibold">
                                    {item?.D}/{item?.M}/{item?.Y}
                                  </div>
                                  <div>
                                    <PencilSquareIcon className="w-5" />
                                  </div>
                                </div>
                              )}
                            </PickerEditHisPayment>
                            <div className="flex justify-between px-4 py-3 border-b">
                              <div className="text-gray-500">PTTT</div>
                              <div className="font-medium">
                                {item?.MethodID
                                  ? getTitleMethod(item?.MethodID)
                                  : "Chưa xác định"}

                                {/* {item?.MethodID !== ""
                                  ? (data?.TypeMethods || TypeMethods)
                                      .filter(
                                        (x) =>
                                          Number(x.value) ===
                                          Number(item?.MethodID * -1)
                                      )[0]
                                      .label.split("-")[0]
                                  : "Chưa xác định"} */}
                              </div>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                              <div className="text-gray-500">Giá trị</div>
                              <div className="font-bold font-lato text-[15px]">
                                {StringHelpers.formatVND(item.Value)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </PullToRefresh>
                  {DebtPay === 0 && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          popoverOpen=".popover-order-payments"
                          type="button"
                          className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
                          fill
                          large
                          preloader
                        >
                          <EllipsisVerticalIcon className="w-6" />
                        </Button>
                        {TotalBanks > 0 && (
                          <QrBanks Order={data?.Order} Value={TotalBanks} />
                        )}
                        <Button
                          type="button"
                          className="flex-1 bg-success"
                          fill
                          large
                          preloader
                          loading={isLoading}
                          disabled={
                            isLoading || Payments.length === 0 || DebtPay === 0
                          }
                        >
                          Đã thanh toán
                        </Button>
                        <Button
                          type="button"
                          className="w-[50px] bg-primary"
                          fill
                          large
                          preloader
                          onClick={() => {
                            f7.views.main.router.navigate(
                              `/admin/printers/order/${data?.Order?.ID}/`
                            );
                          }}
                          loading={isLoading}
                          disabled={isLoading}
                        >
                          <PrinterIcon className="w-6" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Tab>
          </Tabs>
        </div>
      </div>
      <Popover className="popover-order-payments">
        <div className="flex flex-col py-1">
          <PickerPaymentNoteOrder
            Order={data?.Order}
            OrderID={f7route?.params?.id}
          >
            {({ open }) => (
              <Link
                onClick={open}
                popoverClose
                className="flex justify-between p-3 font-medium border-b last:border-0"
                noLinkClass
              >
                Ghi chú
              </Link>
            )}
          </PickerPaymentNoteOrder>

          <PickerPaymentDateOrder
            Order={data?.Order}
            OrderID={f7route?.params?.id}
          >
            {({ open }) => (
              <Link
                onClick={open}
                popoverClose
                className="flex justify-between p-3 font-medium border-b last:border-0"
                noLinkClass
              >
                Ngày thanh toán dự kiến
              </Link>
            )}
          </PickerPaymentDateOrder>
        </div>
      </Popover>
    </Page>
  );
}

export default OrderSplitPayments;

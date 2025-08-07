import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { getDatabase, ref, remove, set } from "firebase/database";

const PHI_QUET_THE = ({ Client, Order, SettingFee, Auth, CrStocks, close }) => {
  const queryClient = useQueryClient();
  let { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      Total: "",
      Value: "",
      FeeTotal: "",
      isDisabled: false,
    },
  });

  useEffect(() => {
    if (Order && Order.Order) {
      let newTotal = Order.Order.ToPay - Order.Order.PayByMemberMoneyValue;

      let index =
        Order.OrderItems &&
        Order.OrderItems.findIndex(
          (x) => x.ProdID === Number(SettingFee.PHIQUETTHE.ProdID)
        );

      if (index > -1) {
        newTotal = newTotal - Order.OrderItems[index].PriceOrder;
      }

      reset({
        Total: newTotal,
        Value: SettingFee.PHIQUETTHE.Value,
        FeeTotal: (newTotal * Number(SettingFee.PHIQUETTHE.Value)) / 100,
        isDisabled: index > -1,
      });
    }
  }, [Order, SettingFee]);

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addOrderCheckIn(body);

      await Promise.all([
        queryClient.invalidateQueries(["OrderManageID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["ClientManageID"]),
      ]);

      return data || null;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    var bodyFormData = new FormData();
    bodyFormData.append("CheckInID", Client?.CheckIn?.ID);
    bodyFormData.append(
      "arr",
      JSON.stringify([
        {
          id: SettingFee.PHIQUETTHE.ProdID,
          qty: 1,
          IsService: 0,
          IsAddFee: 0,
          priceorder: values.FeeTotal,
        },
      ])
    );

    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          f7.dialog.close();
          toast.success("Thực hiện thành công.");
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

  const { Total, Value, isDisabled } = watch();

  if (isDisabled) return <></>;

  return (
    <form
      onSubmit={handleSubmitWithoutPropagation}
      className="pb-4 mb-4 border-b last:pb-0 last:mb-0 last:border-0"
    >
      <div className="mb-3 font-semibold uppercase">Phí quẹt thẻ</div>
      <div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px font-light">Số tiền quẹt thẻ</div>
          <Controller
            name="Total"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <div className="relative">
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={true}
                    placeholder="Nhập số tiền quẹt thẻ"
                    value={field.value}
                    onValueChange={(val) => {
                      let newValue =
                        typeof val.floatValue === "undefined"
                          ? val.value
                          : val.floatValue;
                      field.onChange(newValue);
                      let newFeeTotal = Math.round(
                        ((Number(newValue) > 0 && Value > 0
                          ? (Number(newValue) * Number(Value)) / 100
                          : 0) *
                          100) /
                          100
                      );
                      setValue("FeeTotal", newFeeTotal);
                    }}
                  />
                  {field.value ? (
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={() => field.onChange("")}
                    >
                      <XMarkIcon className="w-5" />
                    </div>
                  ) : <></>}
                </div>
              </div>
            )}
          />
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px font-light">Phí dịch vụ</div>
          <Controller
            name="Value"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <div className="relative">
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={false}
                    placeholder="Nhập phí dịch vụ"
                    value={field.value}
                    onValueChange={(val) => {
                      let newValue =
                        typeof val.floatValue === "undefined"
                          ? val.value
                          : val.floatValue;
                      field.onChange(newValue);

                      let newFeeTotal = Math.round(
                        ((Total > 0 && Number(newValue) > 0
                          ? (Total * Number(newValue)) / 100
                          : 0) *
                          100) /
                          100
                      );
                      setValue("FeeTotal", newFeeTotal);
                    }}
                    isAllowed={({ floatValue, value }) =>
                      floatValue <= 100 || value === ""
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
              </div>
            )}
          />
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px font-light">Tiền phí</div>
          <Controller
            name="FeeTotal"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <div className="relative">
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={true}
                    placeholder="Nhập số tiền quẹt thẻ"
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange(val.floatValue || "")
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
              </div>
            )}
          />
        </div>
        <div className="mb-3.5 last:mb-0">
          <Button
            type="submit"
            className="rounded bg-app"
            fill
            large
            preloader
            loading={addMutation.isLoading}
            disabled={addMutation.isLoading}
          >
            Thực hiện
          </Button>
        </div>
      </div>
    </form>
  );
};

const TIP = ({ Client, Order, SettingFee, Auth, CrStocks, Brand, close }) => {
  const FirebaseApp = useStore("FirebaseApp");

  const database = FirebaseApp && getDatabase(FirebaseApp);

  const queryClient = useQueryClient();
  let { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      Tip: "",
      isDisabled: false,
    },
  });

  useEffect(() => {
    if (Order && Order.Order && Client?.CheckIn) {
      let index =
        Order.OrderItems &&
        Order.OrderItems.findIndex(
          (x) => x.ProdID === Number(SettingFee.TIP.ProdID)
        );

      reset({
        Tip:
          index > -1
            ? Order.OrderItems[index].PriceOrder
            : Client?.CheckIn?.MemberTipAmount,
        isDisabled: index > -1,
      });
    }
  }, [Order, SettingFee]);

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addOrderCheckIn(body);

      await Promise.all([
        queryClient.invalidateQueries(["OrderManageID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["ClientManageID"]),
      ]);

      return data || null;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    var bodyFormData = new FormData();
    bodyFormData.append("CheckInID", Client?.CheckIn?.ID);
    bodyFormData.append(
      "arr",
      JSON.stringify([
        {
          id: SettingFee.TIP.ProdID,
          qty: 1,
          IsService: 0,
          IsAddFee: 0,
          priceorder: values.Tip,
        },
      ])
    );

    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          f7.dialog.close();
          toast.success("Thực hiện thành công.");
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

  const onIpadOpenTIP = () => {
    f7.dialog.preloader("Đang thực hiện ...");

    if (FirebaseApp) {
      remove(
        ref(
          database,
          "tip/" +
            Brand?.Domain?.replace(/^https?:\/\//, "")
              .replaceAll(".", "_")
              .toUpperCase() +
            "/" +
            CrStocks?.ID
        )
      )
        .then(function () {
          set(
            ref(
              database,
              "tip/" +
                Brand?.Domain?.replace(/^https?:\/\//, "")
                  .replaceAll(".", "_")
                  .toUpperCase() +
                "/" +
                CrStocks?.ID +
                "/" +
                Client?.ID
            ),
            {
              CreateDate: moment(new Date()).format("HH:mm DD/MM/YYYY"),
              StockCurrent: CrStocks?.ID,
              FullName: Client?.FullName,
              ID: Client?.ID,
            }
          )
            .then(() => {
              toast.success("Bật TIP thành công.");
              f7.dialog.close();
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch(function (error) {
          console.log("Remove failed: " + error.message);
        });
    } else {
      f7.dialog.close();
      toast.error("Firebase chưa được kết nối.");
    }
  };

  const { isDisabled } = watch();

  if (isDisabled) return <></>;

  return (
    <form
      onSubmit={handleSubmitWithoutPropagation}
      className="pb-4 mb-4 border-b last:pb-0 last:mb-0 last:border-0"
    >
      <div className="mb-3 font-semibold uppercase">TIP</div>
      <div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px font-light">Số tiền TIP</div>
          <Controller
            name="Tip"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <div className="relative">
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={true}
                    placeholder="Nhập số tiền quẹt thẻ"
                    value={field.value}
                    onValueChange={(val) => {
                      let newValue =
                        typeof val.floatValue === "undefined"
                          ? val.value
                          : val.floatValue;
                      field.onChange(newValue);
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
              </div>
            )}
          />
        </div>
        <div className="mb-3.5 last:mb-0 grid-cols-2 gap-2 grid">
          <Button
            type="submit"
            className="rounded bg-app"
            fill
            large
            preloader
            loading={addMutation.isLoading}
            disabled={addMutation.isLoading}
          >
            Thực hiện
          </Button>
          <Button
            type="button"
            className="bg-[#E4E6EF] text-[#3F4254] rounded"
            fill
            large
            preloader
            onClick={onIpadOpenTIP}
          >
            Bật TIP IPAD
          </Button>
        </div>
      </div>
    </form>
  );
};

const PHI_DICH_VU = ({
  Client,
  Order,
  SettingFee,
  Auth,
  CrStocks,
  ServicesUse,
  close,
}) => {
  const queryClient = useQueryClient();
  let { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      Total: "",
      Value: "",
      FeeTotal: "",
      isDisabled: false,
    },
  });

  useEffect(() => {
    if (Order && Order.Order && Client?.CheckIn) {
      let newTotal = 0;

      let index =
        Order.OrderItems &&
        Order.OrderItems.findIndex(
          (x) => x.ProdID === Number(SettingFee.PHIDICHVU.ProdID)
        );

      if (SettingFee.PHIDICHVU.Type === "don_hang") {
        let newOrderItems =
          Order.OrderItems &&
          Order.OrderItems.filter((x) =>
            SettingFee.PHIDICHVU.donhang_type.includes(x.ProdOrService)
          )
            .filter(
              (x) =>
                x.ProdID !== Number(SettingFee.TIP.ProdID) &&
                x.ProdID !== Number(SettingFee.PHIDICHVU.ProdID) &&
                x.ProdID !== Number(SettingFee.PHIQUETTHE.ProdID)
            )
            .map((x) => {
              let TotalPrice = 0;
              if (SettingFee.PHIDICHVU.donhang_price === "NG") {
                TotalPrice = x.Qty * x.Price;
              } else {
                TotalPrice = x.ToPay;
              }
              return TotalPrice;
            });
        newTotal = newOrderItems.reduce((accumulator, currentValue) => {
          return accumulator + currentValue;
        }, 0);
      } else {
        if (ServicesUse && ServicesUse.length > 0) {
          for (let service of ServicesUse) {
            if (service.CostMerthod === 1) {
              newTotal += service.Cost1;
            }
            if (service.CostMerthod === 2) {
              newTotal += service.Cost2;
            }
            if (service.CostMerthod === 3) {
              newTotal += service.Cost3;
            }
            if (
              service.Fees &&
              service.Fees.length > 0 &&
              Order?.ServiceAll &&
              Order?.ServiceAll.length > 0
            ) {
              for (let fee of service.Fees) {
                if (fee.Ids && fee.Ids.length > 0) {
                  for (let id of fee.Ids) {
                    let index = Order?.ServiceAll.findIndex((x) => x.ID === id);

                    if (index > -1) {
                      if (Order?.ServiceAll[index].CostMerthod === 1) {
                        newTotal += Order?.ServiceAll[index].Cost1;
                      }
                      if (Order?.ServiceAll[index].CostMerthod === 2) {
                        newTotal += Order?.ServiceAll[index].Cost2;
                      }
                      if (Order?.ServiceAll[index].CostMerthod === 3) {
                        newTotal += Order?.ServiceAll[index].Cost3;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (index > -1) {
        newTotal = newTotal - Order.OrderItems[index].PriceOrder;
      }

      let newFeeTotal = (newTotal * Number(SettingFee.PHIDICHVU.Value)) / 100;

      if (newFeeTotal > SettingFee.PHIDICHVU.max) {
        newFeeTotal = SettingFee.PHIDICHVU.max;
      }

      reset({
        Total: newTotal,
        Value: SettingFee.PHIDICHVU.Value,
        FeeTotal: newFeeTotal,
        isDisabled: index > -1,
      });
    }
  }, [Order, SettingFee, ServicesUse]);

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addOrderCheckIn(body);

      await Promise.all([
        queryClient.invalidateQueries(["OrderManageID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["ClientManageID"]),
      ]);

      return data || null;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    var bodyFormData = new FormData();
    bodyFormData.append("CheckInID", Client?.CheckIn?.ID);
    bodyFormData.append(
      "arr",
      JSON.stringify([
        {
          id: SettingFee.PHIDICHVU.ProdID,
          qty: 1,
          IsService: 0,
          IsAddFee: 0,
          priceorder: values.FeeTotal,
        },
      ])
    );

    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          f7.dialog.close();
          toast.success("Thực hiện thành công.");
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

  const { Total, Value, isDisabled } = watch();

  if (isDisabled) return <></>;

  return (
    <form
      onSubmit={handleSubmitWithoutPropagation}
      className="pb-4 mb-4 border-b last:pb-0 last:mb-0 last:border-0"
    >
      <div className="mb-3 font-semibold uppercase">Phí dịch vụ</div>
      <div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px font-light">Tổng tiền</div>
          <Controller
            name="Total"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <div className="relative">
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={true}
                    placeholder="Nhập tổng tiền"
                    value={field.value}
                    onValueChange={(val) => {
                      let newValue =
                        typeof val.floatValue === "undefined"
                          ? val.value
                          : val.floatValue;
                      field.onChange(newValue);
                      let newFeeTotal = Math.round(
                        ((Number(newValue) > 0 && Value > 0
                          ? (Number(newValue) * Number(Value)) / 100
                          : 0) *
                          100) /
                          100
                      );
                      setValue(
                        "FeeTotal",
                        newFeeTotal > SettingFee.PHIDICHVU.max
                          ? SettingFee.PHIDICHVU.max
                          : newFeeTotal
                      );
                    }}
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
              </div>
            )}
          />
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px font-light">Phí dịch vụ</div>
          <Controller
            name="Value"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <div className="relative">
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={false}
                    placeholder="Nhập phí dịch vụ"
                    value={field.value}
                    onValueChange={(val) => {
                      let newValue =
                        typeof val.floatValue === "undefined"
                          ? val.value
                          : val.floatValue;
                      field.onChange(newValue);

                      let newFeeTotal = Math.round(
                        ((Total > 0 && Number(newValue) > 0
                          ? (Total * Number(newValue)) / 100
                          : 0) *
                          100) /
                          100
                      );
                      setValue(
                        "FeeTotal",
                        newFeeTotal > SettingFee.PHIDICHVU.max
                          ? SettingFee.PHIDICHVU.max
                          : newFeeTotal
                      );
                    }}
                    isAllowed={({ floatValue, value }) =>
                      floatValue <= 100 || value === ""
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
              </div>
            )}
          />
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px font-light">Tiền phí</div>
          <Controller
            name="FeeTotal"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <div className="relative">
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={true}
                    placeholder="Nhập số tiền phí"
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange(
                        typeof val.floatValue === "undefined"
                          ? val.value
                          : val.floatValue
                      )
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
              </div>
            )}
          />
        </div>
        <div className="mb-3.5 last:mb-0">
          <Button
            type="submit"
            className="rounded bg-app"
            fill
            large
            preloader
            loading={addMutation.isLoading}
            disabled={addMutation.isLoading}
          >
            Thực hiện
          </Button>
        </div>
      </div>
    </form>
  );
};

function PickerAddEditFee({ children, ServicesUse, Client, Order }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientAddEditTIP(body);
      await queryClient.invalidateQueries(["ClientManageID"]);

      return data;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let newValues = {
      Amount: values.Value,
      MemberCheckInID: Client?.CheckIn?.ID,
    };
    addMutation.mutate(
      {
        data: newValues,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhật thành công.");
          f7.dialog.close();
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

  let newProps = {
    Auth,
    ServicesUse,
    Client,
    Order,
    CrStocks,
    SettingFee: Brand?.Global?.Admin.cai_dat_phi,
    Brand,
    close,
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
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] pb-safe-b max-h-[85vh]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  Phí & TIP
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <div className="px-4 overflow-auto grow pb-safe-b">
                  <div className="pb-4">
                    <PHI_QUET_THE {...newProps} />
                    <TIP {...newProps} />
                    <PHI_DICH_VU {...newProps} />
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

export default PickerAddEditFee;

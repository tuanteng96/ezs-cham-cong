import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { SelectPicker } from "@/partials/forms";
import StringHelpers from "@/helpers/StringHelpers";
import { BonusRose, BonusSales, SelectMembersBouns } from ".";

function PickerMultiEmployees({ children, Order }) {
  const queryClient = useQueryClient();
  let Brand = useStore("Brand");
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const [visible, setVisible] = useState(false);
  const [visibleValues, setVisibleValues] = useState(false);
  let [GroupUsers, setGroupUsers] = useState([]);

  const methods = useForm({
    defaultValues: {
      Divided: [],
      DividedValues: [],
    },
  });

  const { control, handleSubmit, setValue, reset, watch } = methods;

  const { fields, remove, append } = useFieldArray({
    control,
    name: "Divided",
  });

  const { fields: fieldsValues, remove: removeFieldsValues } = useFieldArray({
    control,
    name: "DividedValues",
  });

  useEffect(() => {
    let newGroup = [
      {
        value: "TU_VAN",
        label: Brand?.Global?.Admin?.hoa_hong_tu_van || "Hoa hồng tư vấn",
      },
    ];
    if (!Brand?.Global?.Admin?.hoa_hong_tu_van_ktv_an) {
      newGroup = [
        {
          value: "TU_VAN",
          label: Brand?.Global?.Admin?.hoa_hong_tu_van || "Hoa hồng tư vấn",
        },
        {
          value: "KY_THUAT_VIEN",
          label:
            Brand?.Global?.Admin?.hoa_hong_tu_van_khm ||
            "Hoa hồng tư vấn ( KH mới )",
        },
      ];
    }
    setGroupUsers(newGroup);
  }, [Brand]);

  useEffect(() => {
    if (Order) {
      const { oiItems } = Order;
      let newObt =
        oiItems && oiItems.length > 0
          ? oiItems.map((item) => ({
              Product: item,
              Staff: null,
              Type: GroupUsers[0],
            }))
          : [];

      if (
        Brand?.Global?.Admin?.cai_dat_phi?.visible &&
        Brand?.Global?.Admin?.cai_dat_phi?.an_tinh_hs_ds
      ) {
        newObt = newObt.filter(
          (x) =>
            x.Product.ProdTitle !==
              Brand?.Global?.Admin?.cai_dat_phi?.TIP?.ProdTitle &&
            x.Product.ProdTitle !==
              Brand?.Global?.Admin?.cai_dat_phi?.PHIDICHVU?.ProdTitle &&
            x.Product.ProdTitle !==
              Brand?.Global?.Admin?.cai_dat_phi?.PHIQUETTHE?.ProdTitle
        );
      }

      setValue("Divided", newObt);
    }
  }, [Order]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setValue("Divided", []);
    setValue("DividedValues", []);
    setVisible(false);
  };

  let openValues = () => {
    setVisibleValues(true);
  };

  let closeValues = () => {
    setValue("DividedValues", []);
    setVisibleValues(false);
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

  const getValueHH = ({ item, user }) => {
    if (item.gia_tri_thanh_toan === "NaN") {
      if (
        item?.prodBonus?.BonusSaleLevels &&
        item?.prodBonus?.BonusSaleLevels.some((x) => x.Salary) &&
        Type.value !== "KY_THUAT_VIEN"
      ) {
        let { BonusSaleLevels } = item?.prodBonus;
        let index = BonusSaleLevels.findIndex((x) => x.Level === user.level);
        let Salary = 0;
        if (index > -1) {
          Salary = BonusSaleLevels[index].Salary;
        }
        return Salary * item.Qty;
      }
      if (Type.value !== "KY_THUAT_VIEN") {
        return item.prodBonus.BonusSale * item.Qty;
      }
      return item.prodBonus.BonusSale2 * item.Qty;
    }
    if (
      item?.prodBonus?.BonusSaleLevels &&
      item?.prodBonus?.BonusSaleLevels.some((x) => x.Salary)
    ) {
      let { BonusSaleLevels } = item?.prodBonus;
      let index = BonusSaleLevels.findIndex((x) => x.Level === user.level);
      let Salary = 0;
      if (index > -1) {
        Salary = BonusSaleLevels[index].Salary;
      }
      if (Salary < 100) {
        return Math.round((item.gia_tri_thanh_toan_thuc_te * Salary) / 100);
      }
      return item.prodBonus.BonusSale > 100
        ? Math.round(
            (item.gia_tri_thanh_toan_thuc_te *
              item.prodBonus.BonusSale *
              item.Qty) /
              item.ToPay
          )
        : Math.round(
            (item.prodBonus.BonusSale / 100) * item.gia_tri_thanh_toan_thuc_te
          );
    }
    return item.prodBonus.BonusSale > 100
      ? item.gia_tri_thanh_toan * item.Qty
      : item.gia_tri_thanh_toan;
  };

  const getValueKTV = ({ item }) => {
    return item.prodBonus.BonusSale2 > 100
      ? Math.round(
          (item.prodBonus.BonusSale2 *
            item.gia_tri_thanh_toan_thuc_te *
            item.Qty) /
            item.ToPay
        )
      : Math.round(
          item.gia_tri_thanh_toan_thuc_te * (item.prodBonus.BonusSale2 / 100)
        );
  };

  const onSubmit = (values) => {
    const { Divided, Type } = values;
    const newDivided =
      Divided && Divided.length > 0
        ? Divided.filter((item) => item.Staff && item.Staff.length > 0)
        : [];

    if (newDivided.length > 0) {
      const newArr = newDivided.map((item) => ({
        Product: item.Product,
        Hoa_Hong: item.Staff.map((x) => ({
          Product: item.Product,
          Staff: x,
          Value:
            item.Type.value === "KY_THUAT_VIEN"
              ? getValueKTV({ item: item.Product, user: x }) / item.Staff.length
              : getValueHH({
                  item: item.Product,
                  user: item.Staff,
                  Type: item.Type,
                }) / item.Staff.length,
        })),
        Doanh_So: item.Staff.map((x) => ({
          Product: item.Product,
          Staff: x,
          Value: item.Product.gia_tri_doanh_so / item.Staff.length,
        })),
      }));
      setValue("DividedValues", newArr);
      openValues();
    }
  };

  const onSubmitValues = (values) => {
    let { DividedValues } = values;
    const Hoa_Hong = [].concat.apply(
      [],
      DividedValues && DividedValues.length > 0
        ? DividedValues.map((item) => item.Hoa_Hong)
        : []
    );
    let Doanh_So = [];
    if (Brand?.Global?.Admin?.thuong_ds_theo_loai) {
      Doanh_So = [].concat
        .apply(
          [],
          DividedValues && DividedValues.length > 0
            ? DividedValues.map((item) => item.Doanh_So)
            : []
        )
        .map((x) => ({ ...x, Type: x.Type ? x.Type.value : "" }));
    } else {
      Doanh_So = [].concat.apply(
        [],
        DividedValues && DividedValues.length > 0
          ? DividedValues.map((item) => item.Doanh_So)
          : []
      );
    }
    const dataSubmit = {
      OrderID: Order?.OrderID,
      save: {
        them_hoa_hong: Hoa_Hong.map((item) => ({
          Value: item.Value || 0,
          ReceiverUserID: item.Staff?.ID,
          SubSourceID: item.Product?.ID,
        })).filter((o) => o.Value !== null),
        them_doanh_so: Doanh_So.map((item) => ({
          Value: item.Value || 0,
          ReceiverUserID: item.Staff?.ID,
          OrderItemID: item.Product?.ID,
          KpiType: item.Type,
        })).filter((o) => o.Value !== null),
      },
    };
    updateMutation.mutate(
      {
        data: dataSubmit,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          toast.success("Cập nhật thành công.");
          reset({
            ...watch(),
            Divided: [],
            DividedValues: [],
          });
          setVisible(false);
          setVisibleValues(false);
        },
      }
    );
  };

  let { Divided } = watch();

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
                  <div className="relative flex px-4 py-5 text-xl font-semibold">
                    <div className="pr-8 truncate">
                      Áp dụng mỗi nhân viên 1 sản phẩm
                    </div>
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
                          className="mb-3.5 last:mb-0 border-b border-dashed pb-4 last:border-0 last:pb-0"
                          key={item.id}
                        >
                          <div>
                            <div className="mb-1 font-semibold">
                              {item?.Product?.ProdTitle}
                            </div>
                            {/* <div className="mb-px text-gray-500">Nhân viên</div> */}
                            <Controller
                              name={`Divided[${index}].Staff`}
                              control={control}
                              render={({ field, fieldState }) => (
                                <SelectMembersBouns
                                  isMulti
                                  isClearable
                                  placeholder="Chọn nhân viên"
                                  value={field.value}
                                  options={Order?.nhan_vien || []}
                                  label="Chọn nhân viên"
                                  onChange={(option) => {
                                    const indexType = GroupUsers.findIndex(
                                      (o) => o.value === option?.loai_hoa_hong
                                    );
                                    setValue(
                                      `Divided[${index}].Type`,
                                      indexType > -1
                                        ? GroupUsers[indexType]
                                        : GroupUsers[0]
                                    );
                                    field.onChange(option);
                                  }}
                                  errorMessage={fieldState?.error?.message}
                                  errorMessageForce={fieldState?.invalid}
                                />
                              )}
                            />
                          </div>
                          {!Brand?.Global?.Admin?.hoa_hong_tu_van_ktv_an && (
                            <div className="mt-2">
                              <Controller
                                name={`Divided[${index}].Type`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable={false}
                                    placeholder="Chọn nhóm nhân viên"
                                    value={field.value}
                                    options={GroupUsers}
                                    label="Nhóm nhân viên"
                                    onChange={(val) => {
                                      field.onChange(val);
                                    }}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                  />
                                )}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      //   loading={addMutation.isLoading}
                      disabled={
                        !fields ||
                        fields.length === 0 ||
                        Divided.filter((x) => x.Staff).length === 0
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

        {visibleValues &&
          createPortal(
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeValues}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]  max-h-[90%]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <FormProvider {...methods}>
                  <form
                    className="flex flex-col h-full pb-safe-b"
                    onSubmit={handleSubmit(onSubmitValues)}
                  >
                    <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                      Hoa hồng, Doanh số
                      <div
                        className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                        onClick={closeValues}
                      >
                        <XMarkIcon className="w-6" />
                      </div>
                    </div>

                    <div className="px-4 overflow-auto grow">
                      {fieldsValues &&
                        fieldsValues.map((item, index) => (
                          <div
                            className="mb-4 border rounded last:mb-0"
                            key={item.id}
                          >
                            <div className="flex gap-3 px-4 py-2.5 border-b bg-gray-50 rounded-t">
                              <div className="flex-1 font-medium">
                                {item?.Product?.label}
                                <div className="mt-1.5 font-lato">
                                  {item.Product.Qty}
                                  <span className="px-1">x</span>
                                  {StringHelpers.formatVND(
                                    item.Product.don_gia
                                  )}
                                  <span className="px-1">=</span>
                                  {StringHelpers.formatVND(item.Product.ToPay)}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="border-b">
                                <div className="flex items-center px-4 pt-4 font-semibold uppercase">
                                  Hoa hồng
                                </div>
                                <BonusRose
                                  name={`DividedValues[${index}].Hoa_Hong`}
                                  adminTools_byStock={true}
                                />
                              </div>
                              <div>
                                <div className="px-4 pt-4 font-semibold uppercase">
                                  Doanh số
                                </div>
                                <BonusSales
                                  name={`DividedValues[${index}].Doanh_So`}
                                  adminTools_byStock={true}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="p-4">
                      <Button
                        type="submit"
                        className="flex-1 rounded-full bg-app"
                        fill
                        large
                        preloader
                        loading={updateMutation.isLoading}
                        disabled={updateMutation.isLoading}
                      >
                        Cập nhật
                      </Button>
                    </div>
                  </form>
                </FormProvider>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerMultiEmployees;

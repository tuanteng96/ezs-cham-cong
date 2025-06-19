import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { SelectPicker, SelectPickersGroup } from "@/partials/forms";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import StringHelpers from "@/helpers/StringHelpers";
import { BonusRose, BonusSales, SelectMembersBouns } from ".";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function PickerOneEmployees({ children, Order }) {
  const queryClient = useQueryClient();
  let Brand = useStore("Brand");
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const [visible, setVisible] = useState(false);
  const [visibleValues, setVisibleValues] = useState(false);
  let [GroupUsers, setGroupUsers] = useState([]);

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const methods = useForm({
    defaultValues: {
      Equally: [],
      EquallyValues: [],
      Type: "",
    },
  });

  const { control, handleSubmit, setValue, reset, watch } = methods;

  const { fields, remove, append } = useFieldArray({
    control,
    name: "Equally",
  });

  const { fields: fieldsValues, remove: removeFieldsValues } = useFieldArray({
    control,
    name: "EquallyValues",
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
    setValue("Type", newGroup[0]);
    setGroupUsers(newGroup);
  }, [Brand]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setValue("Equally", []);
    setValue("EquallyValues", []);
    setVisible(false);
  };

  let openValues = () => {
    setVisibleValues(true);
  };

  let closeValues = () => {
    setValue("EquallyValues", []);

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

  const onSubmit = (values) => {
    const { Equally, Type } = values;
    if (Equally.length > 0) {
      const newArr =
        Order && Order.oiItems && Order.oiItems.length > 0
          ? Order.oiItems.map((item) => ({
              Product: item,
              Hoa_Hong: Equally.map((user) => ({
                Product: item,
                Staff: user,
                Value: ArrayHelpers.getCommissionValue({ user, item, Type }),
              })),
              Doanh_So: Equally.map((user) => ({
                Product: item,
                Staff: user,
                Value:
                  item.gia_tri_doanh_so > 0
                    ? Math.round((user.Value * item.gia_tri_doanh_so) / 100)
                    : 0,
                Type: item?.KpiType
                  ? { value: item?.KpiType, label: "Loại " + item?.KpiType }
                  : "",
              })),
            }))
          : [];
      setValue("EquallyValues", newArr);
      openValues();
    }
  };

  const onSubmitValues = (values) => {
    let { EquallyValues } = values;
    const Hoa_Hong = [].concat.apply(
      [],
      EquallyValues && EquallyValues.length > 0
        ? EquallyValues.map((item) => item.Hoa_Hong)
        : []
    );
    let Doanh_So = [];
    if (Brand?.Global?.Admin?.thuong_ds_theo_loai) {
      Doanh_So = [].concat
        .apply(
          [],
          EquallyValues && EquallyValues.length > 0
            ? EquallyValues.map((item) => item.Doanh_So)
            : []
        )
        .map((x) => ({ ...x, Type: x.Type ? x.Type.value : "" }));
    } else {
      Doanh_So = [].concat.apply(
        [],
        EquallyValues && EquallyValues.length > 0
          ? EquallyValues.map((item) => item.Doanh_So)
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
        StockID: CrStocks?.ID
      },
      {
        onSuccess: (data) => {
          toast.success("Cập nhật thành công.");
          reset({
            ...watch(),
            Equally: [],
            EquallyValues: [],
          });
          setVisible(false);
          setVisibleValues(false);
        },
      }
    );
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
                    Áp dụng 1 hoặc nhiều NV
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>

                  <div className="px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Nhân viên</div>
                      <Controller
                        name="Equally"
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
                              let newOption = [];
                              if (option.length <= 10) {
                                let arrCount = ArrayHelpers.employeeRatio(
                                  option.length
                                );
                                newOption =
                                  option && option.length > 0
                                    ? option.map((item, i) => ({
                                        ...item,
                                        Value: arrCount[i],
                                      }))
                                    : [];
                              } else {
                                newOption =
                                  option && option.length > 0
                                    ? option.map((item, i) => ({
                                        ...item,
                                        Value: 0,
                                      }))
                                    : [];
                              }

                              reset({
                                ...watch(),
                                Equally: newOption,
                                EquallyValues: [],
                              });
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    {!Brand?.Global?.Admin?.hoa_hong_tu_van_ktv_an && (
                      <div className="mb-3.5 last:mb-0">
                        <div className="mb-px">Nhóm nhân viên</div>
                        <Controller
                          name="Type"
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

                    {fields && fields.length > 0 && (
                      <div className="mb-3.5 last:mb-0">
                        <div className="mb-2">Tỉ lệ chia thưởng</div>
                        <div>
                          {fields.map((item, index) => (
                            <div className="mb-3.5 last:mb-0" key={item.id}>
                              <div className="mb-px font-semibold">
                                {item?.Fn}
                              </div>
                              <Controller
                                name={`Equally[${index}].Value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <div className="relative">
                                    <NumericFormat
                                      className={clsx(
                                        "w-full text-[15px] border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                        fieldState?.invalid
                                          ? "border-danger"
                                          : "border-[#d5d7da]"
                                      )}
                                      type="text"
                                      autoComplete="off"
                                      thousandSeparator={false}
                                      placeholder="Nhập tỉ lệ"
                                      value={field.value}
                                      onValueChange={(val) =>
                                        field.onChange(val.floatValue || "")
                                      }
                                    />
                                    {field.value && (
                                      <div
                                        className="absolute top-0 flex items-center justify-center w-12 h-full right-12"
                                        onClick={() => field.onChange("")}
                                      >
                                        <XMarkIcon className="w-5" />
                                      </div>
                                    )}
                                    <div className="top-0 right-0 flex items-center justify-center w-12 h-full absolute after:content-[''] after:absolute after:right-0 after:h-4/6 after:w-[1px] after:bg-[#d5d7da] after:left-0 pointer-events-none">
                                      %
                                    </div>
                                  </div>
                                )}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 font-light text-gray-500">
                          Số tiền hoa hồng tư vấn nhân viên được hưởng đã được
                          tính toán tự động theo setup hoa hồng của từng sản
                          phẩm / dịch vụ. Trường hợp bạn áp dụng 2 nhân viên
                          được hưởng ( bạn có thể chia tỉ lệ mỗi người được
                          hưởng 50 50; 40 60 theo tỉ lệ mà các bạn thỏa thuận do
                          cùng tư vấn khách hàng )
                        </div>
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
                      //   loading={addMutation.isLoading}
                      disabled={!fields || fields.length === 0}
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
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
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
                                  name={`EquallyValues[${index}].Hoa_Hong`}
                                  adminTools_byStock={adminTools_byStock}
                                />
                              </div>
                              <div>
                                <div className="px-4 pt-4 font-semibold uppercase">
                                  Doanh số
                                </div>
                                <BonusSales
                                  name={`EquallyValues[${index}].Doanh_So`}
                                  adminTools_byStock={adminTools_byStock}
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

export default PickerOneEmployees;

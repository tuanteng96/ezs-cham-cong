import { RolesHelpers } from "@/helpers/RolesHelpers";
import {
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Link, Popover, useStore } from "framework7-react";
import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import SelectMembersBouns from "./SelectMembersBouns";
import { SelectPicker } from "@/partials/forms";
import { NumericFormat } from "react-number-format";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import ConditionsHelpers from "@/helpers/ConditionsHelpers";
import { toast } from "react-toastify";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";

const PickerSalesCommissionSharing = forwardRef(
  ({ Order, f7router, ...props }, ref) => {
    const queryClient = useQueryClient();

    const [visible, setVisible] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);

    let [MembersBouns, setMembersBouns] = useState(Order?.nhan_vien || []);
    let [GroupUsers, setGroupUsers] = useState([]);

    let Auth = useStore("Auth");
    let CrStocks = useStore("CrStocks");
    let Brand = useStore("Brand");

    let memberRef = useRef();

    const { adminTools_byStock } = RolesHelpers.useRoles({
      nameRoles: ["adminTools_byStock"],
      auth: Auth,
      CrStocks,
    });

    const methods = useForm({
      defaultValues: {
        Equally: [],
        EquallyType: "",
        Divided: [],
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

    const { fields: fieldsEqually } = useFieldArray({
      control,
      name: "Equally",
    });

    const { fields: fieldsDivided } = useFieldArray({
      control,
      name: "Divided",
    });

    const {
      fields: fieldsAdvanced,
      remove: removeAdvanced,
      append: appendAdvanced,
    } = useFieldArray({
      control,
      name: "Advanced",
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
      setValue("EquallyType", newGroup[0]);
      setGroupUsers(newGroup);
    }, [Brand]);

    useEffect(() => {
      if (visible) {
        if (tabIndex === 1) {
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

            reset({
              Equally: [],
              EquallyType: "",
              Divided: newObt,
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
            });
          }
        }
      }
    }, [visible, tabIndex, Order]);

    let open = () => setVisible(true);

    let close = () => setVisible(false);

    useImperativeHandle(ref, () => ({
      open: (index) => {
        open();
        setTabIndex(index || 0);
      },
      close: () => {
        close();
      },
    }));

    useEffect(() => {
      if (visible) {
        if (tabIndex === 0 || tabIndex === 1) {
          memberRef?.current?.click();
        }

        setMembersBouns(Order?.nhan_vien || []);
      }
    }, [visible]);

    const onChangeTab = (index) => {
      setTabIndex(index);
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
      let { Equally, EquallyType, Divided, Advanced } = values;

      let dataSubmit = null;

      if (tabIndex === 0) {
        let EquallyValues =
          Order && Order.oiItems && Order.oiItems.length > 0
            ? Order.oiItems.map((item) => ({
                Product: item,
                Hoa_Hong: Equally.map((user) => ({
                  Product: item,
                  Staff: user,
                  Value: ArrayHelpers.getCommissionValue({
                    user,
                    item,
                    Type: EquallyType,
                  }),
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

        if (
          Brand?.Global?.Admin?.cai_dat_phi?.visible &&
          Brand?.Global?.Admin?.cai_dat_phi?.an_tinh_hs_ds
        ) {
          EquallyValues = EquallyValues.filter(
            (x) =>
              x.Product.ProdTitle !==
                Brand?.Global?.Admin?.cai_dat_phi?.TIP?.ProdTitle &&
              x.Product.ProdTitle !==
                Brand?.Global?.Admin?.cai_dat_phi?.PHIDICHVU?.ProdTitle &&
              x.Product.ProdTitle !==
                Brand?.Global?.Admin?.cai_dat_phi?.PHIQUETTHE?.ProdTitle
          );
        }

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
        dataSubmit = {
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
      }
      if (tabIndex === 1) {
        let DividedValues = Divided.filter(
          (item) => item?.Staff?.length > 0
        ).map((item) => ({
          Product: item.Product,
          Hoa_Hong: item?.Staff.map((x) => ({
            Product: item.Product,
            Staff: x,
            Value:
              item.Type.value === "KY_THUAT_VIEN"
                ? getValueKTV({ item: item.Product, user: x }) /
                  item.Staff.length
                : getValueHH({
                    item: item.Product,
                    user: x,
                    Type: item.Type,
                  }) / item.Staff.length,
          })),
          Doanh_So: item?.Staff.map((x) => ({
            Product: item.Product,
            Staff: x,
            Value: item.Product.gia_tri_doanh_so / item.Staff.length,
          })),
        }));
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

        dataSubmit = {
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
      }
      if (tabIndex === 2) {
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
        dataSubmit = {
          OrderID: Order?.OrderID,
          save: {
            them_hoa_hong: Hoa_hong,
            them_doanh_so: Doanh_so,
          },
        };
      }

      updateMutation.mutate(
        {
          data: dataSubmit,
          Token: Auth?.token,
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: (data) => {
            toast.success("Cập nhật thành công.");
            memberRef?.current?.close();
            reset();
            close();
            f7router.back();
          },
        }
      );
    };

    let { Equally, EquallyType } = watch();

    let oiItems = Order?.oiItems || [];

    if (
      Brand?.Global?.Admin?.cai_dat_phi?.visible &&
      Brand?.Global?.Admin?.cai_dat_phi?.an_tinh_hs_ds
    ) {
      oiItems = oiItems.filter(
        (x) =>
          x.ProdTitle !== Brand?.Global?.Admin?.cai_dat_phi?.TIP?.ProdTitle &&
          x.ProdTitle !==
            Brand?.Global?.Admin?.cai_dat_phi?.PHIDICHVU?.ProdTitle &&
          x.ProdTitle !==
            Brand?.Global?.Admin?.cai_dat_phi?.PHIQUETTHE?.ProdTitle
      );
    }

    return (
      <AnimatePresence initial={false}>
        <>
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
                  <FormProvider {...methods}>
                    <form
                      className="flex flex-col h-full pb-safe-b"
                      onSubmit={handleSubmitWithoutPropagation}
                    >
                      <div className="relative flex px-4 py-5 text-lg font-semibold">
                        <Link
                          popoverOpen=".popover-add-bonus-sharing"
                          noLinkClass
                          className="flex items-center pr-8"
                        >
                          <div className="flex-1 truncate">
                            {tabIndex === 0 && "Áp dụng 1 hoặc nhiều NV"}
                            {tabIndex === 1 && "Áp dụng mỗi NV 1 SP"}
                            {tabIndex === 2 && "Nâng cao"}
                          </div>
                          <div className="ml-1.5">
                            <ChevronDownIcon className="w-5" />
                          </div>
                        </Link>
                        <Popover className="popover-add-bonus-sharing min-w-[270px]">
                          <div className="flex flex-col py-1">
                            <Link
                              className={clsx(
                                "relative px-4 py-3 font-medium border-b last:border-0",
                                tabIndex === 0 && "text-app"
                              )}
                              popoverClose
                              noLinkClass
                              onClick={() => onChangeTab(0)}
                            >
                              Áp dụng 1 hoặc nhiều NV
                            </Link>
                            <Link
                              onClick={() => onChangeTab(1)}
                              popoverClose
                              className={clsx(
                                "relative px-4 py-3 font-medium border-b last:border-0",
                                tabIndex === 1 && "text-app"
                              )}
                              noLinkClass
                            >
                              Áp dụng mỗi nhân viên 1 sản phẩm
                            </Link>

                            {(Brand?.Global?.Admin?.thuong_ds_nang_cao
                              ? adminTools_byStock?.hasRight
                              : !Brand?.Global?.Admin?.thuong_ds_nang_cao) && (
                              <Link
                                onClick={() => onChangeTab(2)}
                                popoverClose
                                className={clsx(
                                  "relative px-4 py-3 font-medium border-b last:border-0",
                                  tabIndex === 2 && "text-app"
                                )}
                                noLinkClass
                              >
                                Nâng cao
                              </Link>
                            )}
                          </div>
                        </Popover>
                        <div
                          className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                          onClick={close}
                        >
                          <XMarkIcon className="w-6" />
                        </div>
                      </div>

                      <div className="px-4 overflow-auto grow">
                        {tabIndex === 0 && (
                          <>
                            <div className="mb-3.5 last:mb-0">
                              <div className="mb-px">Nhân viên</div>
                              <Controller
                                name="Equally"
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectMembersBouns
                                    ref={memberRef}
                                    isMulti
                                    isClearable
                                    placeholder="Chọn nhân viên"
                                    value={field.value}
                                    options={MembersBouns || []}
                                    label="Chọn nhân viên"
                                    onChange={(option) => {
                                      if (
                                        Brand?.Global?.Admin
                                          ?.so_luong_nv_buoi_dv
                                      ) {
                                        if (
                                          field.value &&
                                          field.value.length >=
                                            Brand?.Global?.Admin
                                              ?.so_luong_nv_buoi_dv
                                        ) {
                                          toast.error(
                                            `Chỉ có thể chọn tối đa ${Brand?.Global?.Admin?.so_luong_nv_buoi_dv} nhân viên.`
                                          );
                                          return;
                                        }
                                      }
                                      let newOption = [];
                                      if (option.length <= 10) {
                                        let arrCount =
                                          ArrayHelpers.employeeRatio(
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

                                      let newMembersBouns = [...MembersBouns];

                                      for (const [
                                        index,
                                        Stocks,
                                      ] of newMembersBouns.entries()) {
                                        newMembersBouns[index].options =
                                          Stocks.options.map((x) => {
                                            let obj = { ...x, sub: "" };
                                            let index = newOption.findIndex(
                                              (o) => x.value === o.value
                                            );
                                            if (index > -1)
                                              obj.sub = `${newOption[index].Value}%`;
                                            return obj;
                                          });
                                      }

                                      setMembersBouns(newMembersBouns);
                                      reset({
                                        Equally: newOption,
                                        EquallyType,
                                        Divided: [],
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
                                      });
                                    }}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                    actions={[
                                      {
                                        Title: (
                                          <div>
                                            <EllipsisHorizontalIcon className="w-6" />
                                          </div>
                                        ),
                                        className:
                                          "bg-white max-w-[50px] text-black border border-[#d3d3d3]",
                                        onClick: (close) => close(),
                                        isLoading: updateMutation.isLoading,
                                        isDisabled: updateMutation.isLoading,
                                      },
                                      {
                                        Title: "Cập nhật",
                                        className: "rounded bg-app flex-1",
                                        onClick: () => handleSubmit(onSubmit)(),
                                        isLoading: updateMutation.isLoading,
                                        isDisabled:
                                          !Equally ||
                                          Equally.length === 0 ||
                                          updateMutation.isLoading,
                                      },
                                    ]}
                                    formRender={
                                      !Brand?.Global?.Admin
                                        ?.hoa_hong_tu_van_ktv_an ? (
                                        <div className="px-4 pt-4">
                                          <div className="mb-3.5 last:mb-0">
                                            <Controller
                                              name="EquallyType"
                                              control={control}
                                              render={({
                                                field,
                                                fieldState,
                                              }) => (
                                                <SelectPicker
                                                  isClearable={false}
                                                  placeholder="Chọn nhóm nhân viên"
                                                  value={field.value}
                                                  options={GroupUsers}
                                                  label="Nhóm nhân viên"
                                                  onChange={(val) => {
                                                    field.onChange(val);
                                                  }}
                                                  errorMessage={
                                                    fieldState?.error?.message
                                                  }
                                                  errorMessageForce={
                                                    fieldState?.invalid
                                                  }
                                                />
                                              )}
                                            />
                                          </div>
                                        </div>
                                      ) : null
                                    }
                                  />
                                )}
                              />
                            </div>
                            {!Brand?.Global?.Admin?.hoa_hong_tu_van_ktv_an && (
                              <div className="mb-3.5 last:mb-0">
                                <div className="mb-px">Nhóm nhân viên</div>
                                <Controller
                                  name="EquallyType"
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

                            {fieldsEqually && fieldsEqually.length > 0 && (
                              <div className="mb-3.5 last:mb-0">
                                <div className="mb-2 font-medium text-gray-600">
                                  Tỉ lệ chia thưởng
                                </div>
                                <div>
                                  {fieldsEqually.map((item, index) => (
                                    <div
                                      className="mb-3.5 last:mb-0"
                                      key={item.id}
                                    >
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
                                                field.onChange(
                                                  val.floatValue || ""
                                                )
                                              }
                                            />
                                            {field.value && (
                                              <div
                                                className="absolute top-0 flex items-center justify-center w-12 h-full right-12"
                                                onClick={() =>
                                                  field.onChange("")
                                                }
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
                                  Số tiền hoa hồng tư vấn nhân viên được hưởng
                                  đã được tính toán tự động theo setup hoa hồng
                                  của từng sản phẩm / dịch vụ. Trường hợp bạn áp
                                  dụng 2 nhân viên được hưởng ( bạn có thể chia
                                  tỉ lệ mỗi người được hưởng 50 50; 40 60 theo
                                  tỉ lệ mà các bạn thỏa thuận do cùng tư vấn
                                  khách hàng )
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {tabIndex === 1 && (
                          <>
                            {fieldsDivided &&
                              fieldsDivided.map((item, index) => (
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
                                            const indexType =
                                              GroupUsers.findIndex(
                                                (o) =>
                                                  o.value ===
                                                  option?.loai_hoa_hong
                                              );
                                            setValue(
                                              `Divided[${index}].Type`,
                                              indexType > -1
                                                ? GroupUsers[indexType]
                                                : GroupUsers[0]
                                            );
                                            field.onChange(option);
                                          }}
                                          errorMessage={
                                            fieldState?.error?.message
                                          }
                                          errorMessageForce={
                                            fieldState?.invalid
                                          }
                                        />
                                      )}
                                    />
                                  </div>
                                  {!Brand?.Global?.Admin
                                    ?.hoa_hong_tu_van_ktv_an && (
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
                                            errorMessage={
                                              fieldState?.error?.message
                                            }
                                            errorMessageForce={
                                              fieldState?.invalid
                                            }
                                          />
                                        )}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                          </>
                        )}
                        {tabIndex === 2 && (
                          <>
                            {fieldsAdvanced &&
                              fieldsAdvanced.map((item, index) => (
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
                                          options={oiItems}
                                          label="Chọn sản phẩm"
                                          onChange={(val) => {
                                            field.onChange(val);
                                          }}
                                          errorMessage={
                                            fieldState?.error?.message
                                          }
                                          errorMessageForce={
                                            fieldState?.invalid
                                          }
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
                                          errorMessage={
                                            fieldState?.error?.message
                                          }
                                          errorMessageForce={
                                            fieldState?.invalid
                                          }
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
                                          errorMessage={
                                            fieldState?.error?.message
                                          }
                                          errorMessageForce={
                                            fieldState?.invalid
                                          }
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
                                              field.onChange(
                                                val.floatValue || ""
                                              )
                                            }
                                            disabled={ConditionsHelpers.isDisabledSalesSommission(
                                              item,
                                              Brand?.Global?.Admin
                                                ?.thuong_ds_nang_cao,
                                              adminTools_byStock.hasRight
                                            )}
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
                                        appendAdvanced({
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
                                    {fieldsAdvanced.length > 1 && (
                                      <button
                                        className="w-auto px-3 text-white bg-danger py-2.5 rounded"
                                        type="button"
                                        onClick={() =>
                                          f7.dialog.confirm(
                                            "Xác nhận xoá ? ",
                                            () => removeAdvanced(index)
                                          )
                                        }
                                      >
                                        <TrashIcon className="w-5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </>
                        )}
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
);

export default PickerSalesCommissionSharing;

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Button, f7, Input, useStore } from "framework7-react";
import { useForm, Controller } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { DatePicker, SelectPicker } from "@/partials/forms";
import {
  SelectClassifyCash,
  SelectMembers,
  SelectMethodCash,
} from "@/partials/forms/select";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function PickerCashAddEdit({
  children,
  initialValues,
  onOpenParent,
  onOpen,
  onClose,
}) {
  const queryClient = useQueryClient();

  const [currentView, setCurrentView] = useState(null); // 'type' | 'form' | null
  const [selectedType, setSelectedType] = useState(null);

  const [OptionsCreate, setOptionsCreate] = useState([
    {
      ID: "2034",
      Title: "Tạo thu",
      Edit: "Sửa khoản thu",
      hidden: true,
      Type: "THU",
    },
    { ID: "2041", Title: "Tạo thu", Edit: "Sửa khoản thu", Type: "THU" },
    { ID: "2049", Title: "Tạo chi", Edit: "Sửa khoản chi", Type: "CHI" },
    { ID: "2044", Title: "Hoàn ứng", Edit: "Sửa hoàn ứng" },
    { ID: "2052", Title: "Tạm ứng", Edit: "Sửa tạm ứng" },
    { ID: "2059", Title: "Trả giữ lương", Edit: "Sửa trả giữ lương" },
  ]);

  let Auth = useStore("Auth");
  let Stocks = useStore("Stocks");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock, tong_hop_cash, thu_chi_cash } =
    RolesHelpers.useRoles({
      nameRoles: ["adminTools_byStock", "tong_hop_cash", "thu_chi_cash"],
      auth: Auth,
      CrStocks,
    });

  useEffect(() => {
    if (!tong_hop_cash?.hasRight) {
      setOptionsCreate((prevState) =>
        prevState.filter(
          (x) => x.ID !== "2044" && x.ID !== "2052" && x.ID !== "2059"
        )
      );
    }
  }, [tong_hop_cash?.hasRight]);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      ID: 0,
      Value: "",
      IsOut: false,
      StockID: CrStocks?.ID
        ? {
            ...CrStocks,
            label: CrStocks?.Title,
            value: CrStocks?.ID,
          }
        : null,
      SysTagID: "",
      MethodID: "",
      Desc: "",
      CustomType: "",
      ReceiverUserID: "",
      CreateDate: null,
    },
  });

  useEffect(() => {
    if (initialValues?.ID) {
      let index = OptionsCreate.findIndex(
        (x) => Number(x.ID) === initialValues.SysTagID
      );
      if (index > -1) {
        setSelectedType({
          ...OptionsCreate[index],
          Title: OptionsCreate[index].Edit,
        });
      }
      let MethodTitle = "";
      if (initialValues?.MethodID === 1) MethodTitle = "Tiền mặt";
      if (initialValues?.MethodID === 2) MethodTitle = "Chuyển khoản";
      if (initialValues?.MethodID === 1) MethodTitle = "Quẹt thẻ";

      let StockTitle = "";
      if (initialValues?.StockID && !initialValues?.StockTitle) {
        let Stock = Stocks.find((x) => x.ID === initialValues?.StockID);
        StockTitle = Stock?.Title || "";
      }

      reset({
        ID: initialValues?.ID,
        Value: Math.abs(initialValues?.Value),
        IsOut: initialValues?.IsOut,
        StockID: initialValues?.StockID
          ? {
              label: initialValues?.StockTitle || StockTitle,
              value: initialValues?.StockID,
            }
          : null,
        SysTagID: initialValues?.SysTagID,
        MethodID: initialValues?.MethodID
          ? {
              label: MethodTitle,
              value: initialValues?.MethodID,
            }
          : null,
        Desc: initialValues?.Desc,
        CustomType: initialValues?.CustomType
          ? initialValues?.CustomType.split(",").map((x) => ({
              label: x,
              value: x,
            }))
          : null,
        ReceiverUserID: initialValues?.ReceiverUserID
          ? {
              label: initialValues?.ReceiverName || "",
              value: initialValues?.ReceiverUserID,
            }
          : null,
        CreateDate: initialValues?.CreateDate,
      });
    } else {
      reset({
        ID: 0,
        Value: "",
        IsOut: "",
        StockID: CrStocks?.ID
          ? {
              ...CrStocks,
              label: CrStocks?.Title,
              value: CrStocks?.ID,
            }
          : null,
        SysTagID: "",
        MethodID: "",
        Desc: "",
        CustomType: "",
        ReceiverUserID: "",
        CreateDate: null,
      });
    }
  }, [initialValues, Stocks]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.addEditCashs(body);
      await queryClient.invalidateQueries({ queryKey: ["CashWithSource"] });
      await queryClient.invalidateQueries({ queryKey: ["CashList"] });
      return data;
    },
  });

  const open = () => {
    if (initialValues?.ID) {
      setCurrentView("form");
    } else {
      setCurrentView("type");
    }
    onOpen?.();
  };

  const close = () => {
    setCurrentView(null);
    onClose?.();
  };

  const handleSelectType = (item) => {
    setSelectedType(item);
    setCurrentView("form");
  };

  const handleCloseForm = () => {
    if (initialValues?.ID) {
      setCurrentView(null);
      onOpenParent?.();
      onClose?.();
    } else {
      setCurrentView("type");
      reset({
        ID: 0,
        Value: "",
        IsOut: "",
        StockID: CrStocks?.ID
          ? {
              ...CrStocks,
              label: CrStocks?.Title,
              value: CrStocks?.ID,
            }
          : null,
        SysTagID: "",
        MethodID: "",
        Desc: "",
        CustomType: "",
        ReceiverUserID: "",
        CreateDate: null,
      });
    }
  };

  const onSubmit = (values) => {
    let newValues = { ...values, ID: initialValues?.ID || 0 };
    newValues.CustomType = values?.CustomType
      ? values?.CustomType.map((x) => x.value).toString()
      : "";
    newValues.MethodID = values?.MethodID?.value || "";
    newValues.ReceiverUserID = values?.ReceiverUserID?.value || "";
    newValues.StockID = values?.StockID?.value || "";
    newValues.SysTagID = values?.SysTagID || selectedType?.ID;
    if (values.CreateDate) {
      newValues.CreateDate = moment(values.CreateDate).format(
        "DD/MM/YYYY HH:mm"
      );
    } else {
      delete newValues.CreateDate;
    }

    const formData = new FormData();

    Object.entries(newValues).forEach(([key, value]) => {
      formData.append(`[${key}]`, value);
    });

    updateMutation.mutate(
      {
        data: formData,
        Token: Auth?.token,
      },
      {
        onSuccess: (data) => {
          toast.success(
            initialValues?.ID ? "Cập nhật thành công" : "Thêm mới thành công"
          );
          close();
          if (f7.views.main.router.currentRoute?.url !== "/admin/cash/") {
            f7.views.main.router.navigate("/admin/cash/");
          }
        },
      }
    );
  };

  let { SysTagID } = watch();

  return (
    <>
      {children({ open, close })}

      {createPortal(
        <AnimatePresence>
          {currentView && (
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              {/* Overlay */}
              <motion.div
                key="overlay"
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={currentView === "type" ? close : handleCloseForm}
              />

              {/* Sheet */}
              <motion.div
                key={currentView}
                className="relative z-20 rounded-t-[var(--f7-sheet-border-radius)] w-full max-h-[calc(100%-var(--f7-safe-area-top)-var(--f7-navbar-height))]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                {currentView === "type" && (
                  <div className="flex flex-col p-2.5">
                    <div className="overflow-hidden rounded-xl mb-2.5 last:mb-0 bg-white">
                      <div className="flex items-center justify-center border-b h-[54px] text-muted">
                        Bạn muốn thực hiện tạo ?
                      </div>
                      <div>
                        {OptionsCreate &&
                          OptionsCreate.filter((x) => !x.hidden).map(
                            (item, index) => (
                              <div
                                key={index}
                                className={clsx(
                                  "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer",
                                  item.ID === "2041" && "text-success",
                                  item.ID === "2049" && "text-danger"
                                )}
                                onClick={() => handleSelectType(item)}
                              >
                                {item.Title}
                              </div>
                            )
                          )}
                      </div>
                    </div>
                    <div className="mb-2.5 last:mb-0">
                      <div
                        className={clsx(
                          "flex items-center justify-center h-[54px] font-medium text-center bg-white rounded-xl cursor-pointer text-danger text-[15px]"
                        )}
                        onClick={close}
                      >
                        Đóng
                      </div>
                    </div>
                  </div>
                )}

                {currentView === "form" && (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="overflow-hidden flex flex-col h-full bg-white pb-safe-b rounded-t-[var(--f7-sheet-border-radius)]"
                    autoComplete="off"
                  >
                    <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                      {!initialValues?.ID && (
                        <div
                          className="absolute top-0 left-0 flex items-center justify-center w-12 h-full cursor-pointer"
                          onClick={handleCloseForm}
                        >
                          <ArrowLeftIcon className="w-6" />
                        </div>
                      )}

                      {selectedType?.Title}
                      <div
                        className="absolute top-0 right-0 flex items-center justify-center w-12 h-full cursor-pointer"
                        onClick={handleCloseForm}
                      >
                        <XMarkIcon className="w-6" />
                      </div>
                    </div>
                    <div className="flex-1 px-4 pb-4 overflow-auto">
                      {Number(selectedType?.ID) === 2044 ||
                      Number(selectedType?.ID) === 2052 ||
                      Number(selectedType?.ID) === 2059 ? (
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Nhân viên</div>
                          <Controller
                            name="ReceiverUserID"
                            control={control}
                            render={({ field, fieldState }) => (
                              <SelectMembers
                                placeholderInput="Tên nhân viên"
                                placeholder="Chọn nhân viên"
                                value={field.value}
                                label="Chọn nhân viên"
                                onChange={(val) => {
                                  field.onChange(val);
                                }}
                                isFilter
                              />
                            )}
                          />
                        </div>
                      ) : (
                        <></>
                      )}

                      <div className="mb-3.5 last:mb-0">
                        <div className="mb-px">Số tiền</div>
                        <div>
                          <Controller
                            name={`Value`}
                            control={control}
                            render={({
                              field: { ref, ...field },
                              fieldState,
                            }) => (
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
                                      typeof val.floatValue !== "undefined"
                                        ? val.floatValue
                                        : ""
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
                      </div>
                      {Number(selectedType?.ID) === 2041 ||
                      Number(selectedType?.ID) === 2049 ? (
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Phân loại</div>
                          <Controller
                            name="CustomType"
                            control={control}
                            render={({ field, fieldState }) => (
                              <SelectClassifyCash
                                isMulti
                                placeholderInput="Nhập từ khoá"
                                placeholder="Chọn phân loại"
                                value={field.value}
                                label="Chọn phân loại"
                                onChange={(val) => {
                                  field.onChange(val);
                                }}
                                isFilter
                                isClearable={true}
                                Type={selectedType?.Type}
                              />
                            )}
                          />
                        </div>
                      ) : (
                        <></>
                      )}

                      <div className="mb-3.5 last:mb-0">
                        <div className="mb-px">Phương thức thanh toán</div>
                        <Controller
                          name="MethodID"
                          control={control}
                          render={({ field, fieldState }) => (
                            <SelectMethodCash
                              placeholderInput="Nhập từ khoá"
                              placeholder="Chọn PTTT"
                              value={field.value}
                              label="Chọn PTTT"
                              onChange={(val) => {
                                field.onChange(val);
                              }}
                              isFilter
                              isClearable={true}
                            />
                          )}
                        />
                      </div>
                      {/* <div className="mb-3.5 last:mb-0">
                        <div className="mb-px">Cơ sở</div>
                        <div>
                          <Controller
                            name={`StockID`}
                            control={control}
                            render={({
                              field: { ref, ...field },
                              fieldState,
                            }) => (
                              <>
                                <SelectPicker
                                  isClearable={false}
                                  placeholder="Chọn cơ sở"
                                  value={field.value}
                                  options={Stocks}
                                  label="Cơ sở"
                                  onChange={(val) => {
                                    field.onChange(val);
                                  }}
                                  errorMessage={fieldState?.error?.message}
                                  errorMessageForce={fieldState?.invalid}
                                />
                              </>
                            )}
                          />
                        </div>
                      </div> */}
                      <div className="mb-3.5 last:mb-0">
                        <div className="mb-px">Nội dung</div>
                        <Controller
                          name="Desc"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Input
                              className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                              type="textarea"
                              placeholder="Nhập nội dung"
                              rows="4"
                              value={field.value}
                              errorMessage={fieldState?.error?.message}
                              errorMessageForce={fieldState?.invalid}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                      {adminTools_byStock?.hasRight && (
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px font-light">Thời gian</div>
                          <Controller
                            name="CreateDate"
                            control={control}
                            render={({ field, fieldState }) => (
                              <DatePicker
                                format="HH:mm DD-MM-YYYY"
                                errorMessage={fieldState?.error?.message}
                                errorMessageForce={fieldState?.invalid}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Chọn thời gian"
                                showHeader
                              />
                            )}
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <Button
                        type="submit"
                        className="rounded-full bg-app"
                        fill
                        large
                        preloader
                        loading={updateMutation.isLoading}
                        disabled={updateMutation.isLoading}
                      >
                        {initialValues?.ID ? "Lưu thay đổi" : "Thêm mới"}
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
}

export default PickerCashAddEdit;

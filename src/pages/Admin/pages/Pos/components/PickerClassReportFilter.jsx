import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, useStore } from "framework7-react";
import { SelectClassOs, SelectMembers } from "@/partials/forms/select";
import { DatePicker, SelectPicker } from "@/partials/forms";
import { RolesHelpers } from "@/helpers/RolesHelpers";

let OptionsWorkingTime = [
  { label: "Trong giờ", value: "1" },
  { label: "Ngoài giờ", value: "0" },
];

let OptionsStatus = [
  { label: "Đã hoàn thành", value: "1" },
  { label: "Chưa hoàn thành", value: "0" },
];

function PickerClassReportFilter({ children, filters, onChange }) {
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ClassIDs: null,
      TeachIDs: null,
      StockID: null,
      BeginFrom: new Date(),
      BeginTo: new Date(),
      Status: "",
      WorkingTime: null,
    },
  });

  useEffect(() => {
    visible && reset(filters);
  }, [filters, visible]);

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    onChange(values);
    close();
  };

  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: () => setVisible(true),
        })}
        {visible &&
          createPortal(
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col h-full max-h-[85vh] pb-safe-b"
                  autoComplete="off"
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Bộ lọc
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Từ ngày</div>
                      <Controller
                        name="BeginFrom"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DatePicker
                            format="DD-MM-YYYY"
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Chọn ngày"
                            showHeader
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Đến ngày</div>
                      <Controller
                        name="BeginTo"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DatePicker
                            format="DD-MM-YYYY"
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Chọn ngày"
                            showHeader
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Cơ sở</div>
                      <Controller
                        name="StockID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={false}
                            placeholder="Chọn cơ sở"
                            value={field.value}
                            label="Cơ sở"
                            options={adminTools_byStock?.StockRolesAll || []}
                            onChange={(val) => {
                              field.onChange(val || null);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Lớp</div>
                      <Controller
                        name="ClassIDs"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectClassOs
                            placeholderInput="Tên lớp"
                            placeholder="Chọn lớp"
                            value={field.value}
                            label="Chọn lớp"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            isFilter
                            StockIDs={
                              adminTools_byStock?.StockRolesAll
                                ? adminTools_byStock?.StockRolesAll.map(
                                    (x) => x.ID
                                  )
                                : []
                            }
                            //isMulti
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Huấn luyện viên</div>
                      <Controller
                        name="TeachIDs"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectMembers
                            placeholderInput="Tên huấn luyện viên"
                            placeholder="Chọn huấn luyện viên"
                            value={field.value}
                            label="Chọn huấn luyện viên"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            isFilter
                            //isMulti
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Trạng thái</div>
                      <Controller
                        name="Status"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={true}
                            placeholder="Chọn trạng thái"
                            value={field.value}
                            label="Trạng thái"
                            options={OptionsStatus || []}
                            onChange={(val) => {
                              field.onChange(val || null);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            autoHeight
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Loại giờ làm việc</div>
                      <Controller
                        name="WorkingTime"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={true}
                            placeholder="Chọn loại"
                            value={field.value}
                            label="Loại giờ làm việc"
                            options={OptionsWorkingTime || []}
                            onChange={(val) => {
                              field.onChange(val || null);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            autoHeight
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                    >
                      Áp dụng
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

export default PickerClassReportFilter;

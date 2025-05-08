import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, useStore } from "framework7-react";
import { SelectPicker } from "@/partials/forms";
import { SelectGroupRoles } from "@/partials/forms/select";
import { RolesHelpers } from "@/helpers/RolesHelpers";

let OptionsStatus = [
  {
    value: 0,
    label: "Hoạt động",
  },
  {
    value: -1,
    label: "Đã nghỉ",
  },
];

function PickerFilter({ children, initialValues, onChange }) {
  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  const StocksAll = useStore("StocksAll");

  const { usrmng } = RolesHelpers.useRoles({
    nameRoles: ["usrmng"],
    auth: Auth,
    CrStocks,
  });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      StockIDs: null,
      Status: [],
      GroupIDs: [],
    },
  });

  useEffect(() => {
    if (visible)
      reset({
        StockIDs: initialValues?.StockIDs,
        Status: initialValues?.Status || [],
        GroupIDs: initialValues?.GroupIDs || [],
      });
  }, [initialValues, visible]);

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
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
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
                  className="flex flex-col h-full pb-safe-b"
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
                  <div className="px-4 pb-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Cơ sở</div>
                      <Controller
                        name="StockIDs"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable={false}
                            placeholder="Chọn cơ sở"
                            value={field.value}
                            options={
                              StocksAll
                                ? StocksAll.map((x) => ({
                                    ...x,
                                    label: x.ID === 778 ? "Hệ thống" : x.Title,
                                    value: x.ID,
                                  }))
                                : []
                            }
                            label="Cơ sở"
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
                      <div className="mb-1">Nhóm</div>
                      <Controller
                        name="GroupIDs"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectGroupRoles
                            placeholderInput="Tên nhóm"
                            placeholder="Chọn nhóm"
                            value={field.value}
                            label="Chọn nhóm"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            isFilter
                            isMulti
                            StockRoles={usrmng?.StockRolesAll || []}
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
                            isMulti
                            isClearable={false}
                            placeholder="Chọn trạng thái"
                            value={field.value}
                            options={OptionsStatus}
                            label="Trạng thái"
                            onChange={(val) => {
                              field.onChange(val || null);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4">
                    <Button
                      type="button"
                      className="text-black bg-gray-200 rounded-full"
                      fill
                      large
                      preloader
                      onClick={() =>
                        reset({
                          BeginFrom: new Date(),
                          BeginTo: new Date(),
                          StockID: {
                            label: CrStocks?.Title,
                            value: CrStocks?.ID,
                          },
                        })
                      }
                    >
                      Cài lại
                    </Button>
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

export default PickerFilter;

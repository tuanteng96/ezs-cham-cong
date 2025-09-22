import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, useStore } from "framework7-react";
import { DatePicker, SelectPicker } from "@/partials/forms";
import {
  SelectClassifyCash,
  SelectMethodCash,
  SelectTagCash,
} from "@/partials/forms/select";
import clsx from "clsx";
import moment from "moment";
import { RolesHelpers } from "@/helpers/RolesHelpers";

let options = [
  { label: "Cơ bản", value: 1 },
  { label: "Nâng cao", value: 2 },
];

function PickerFilter({ children, initialValues, onChange }) {
  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");

  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: initialValues,
  });

  const { tong_hop_cash } = RolesHelpers.useRoles({
    nameRoles: ["tong_hop_cash"],
    auth: Auth,
    CrStocks,
  });

  useEffect(() => {
    if (visible) reset(initialValues);
  }, [initialValues, visible]);

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    onChange(values);
    close();
  };

  let getFromTo = (Type) => {
    let From = "";
    let To = "";

    if (Type === "Hôm nay") {
      From = moment().toDate();
      To = moment().toDate();
    }

    if (Type === "Hôm qua") {
      From = moment().subtract(1, "days").toDate();
      To = moment().subtract(1, "days").toDate();
    }

    if (Type === "7 ngày") {
      From = moment().subtract(7, "days").toDate();
      To = moment().toDate();
    }
    return { From, To };
  };

  let { Advanced, Type } = watch();

  return (
    <>
      {children({
        open: () => setVisible(true),
      })}
      {createPortal(
        <AnimatePresence initial={false}>
          {visible && (
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
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[calc(100%-var(--f7-safe-area-top)-var(--f7-navbar-height))]"
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
                  <div className="px-4 overflow-auto">
                    <Controller
                      name="Type"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="mb-3.5 last:mb-0 flex gap-1 ">
                          {["Hôm nay", "Hôm qua", "7 ngày", "Khác"].map(
                            (x, index) => (
                              <div
                                className={clsx(
                                  "px-4 py-1.5 rounded-2xl cursor-pointer",
                                  field.value === x
                                    ? "bg-app text-white"
                                    : "bg-gray-200"
                                )}
                                onClick={() => {
                                  field.onChange(x);
                                  let { From, To } = getFromTo(x);

                                  setValue("From", From);
                                  setValue("To", To);
                                }}
                                key={index}
                              >
                                {x}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    />
                    {Type === "Khác" && (
                      <>
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px font-light">Từ ngày</div>
                          <Controller
                            name="From"
                            control={control}
                            render={({ field, fieldState }) => (
                              <DatePicker
                                format="DD-MM-YYYY"
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
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px font-light">Đến ngày</div>
                          <Controller
                            name="To"
                            control={control}
                            render={({ field, fieldState }) => (
                              <DatePicker
                                format="DD-MM-YYYY"
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
                      </>
                    )}
                    {tong_hop_cash?.hasRight && (
                      <div className="mb-3.5 last:mb-0">
                        <div className="mb-px">Loại</div>
                        <Controller
                          name="Advanced"
                          control={control}
                          render={({ field, fieldState }) => (
                            <SelectPicker
                              isClearable={false}
                              placeholder="Chọn loại"
                              value={
                                field.value
                                  ? options.filter(
                                      (x) => x.value === field.value
                                    )
                                  : null
                              }
                              options={options}
                              label="Loại"
                              onChange={(val) => {
                                field.onChange(val?.value || null);
                              }}
                              errorMessage={fieldState?.error?.message}
                              errorMessageForce={fieldState?.invalid}
                            />
                          )}
                        />
                      </div>
                    )}

                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Tag</div>
                      <Controller
                        name="tag"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectTagCash
                            placeholderInput="Nhập từ khoá"
                            placeholder="Chọn tag"
                            value={field.value}
                            label="Tag"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            isClearable={true}
                            isAdvanced={Advanced === 2}
                          />
                        )}
                      />
                    </div>
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
                          />
                        )}
                      />
                    </div>
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
                          Key: "",
                          Dir: 0,
                          InOut: "",
                          tag: "",
                          MethodID: "",
                          pi: 1,
                          ps: 20,
                          From: "",
                          To: "",
                          Type: "Hôm nay",
                          sort: "[CreateDate] desc",
                          CustomType: "",
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
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
}

export default PickerFilter;

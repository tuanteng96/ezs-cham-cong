import React from "react";
import { f7, useStore } from "framework7-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { MinusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { NumericFormat } from "react-number-format";
import { SelectPicker } from "@/partials/forms";
import clsx from "clsx";
import moment from "moment";

function BonusSalesAuto({ name, adminTools_byStock }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");

  const { control } = useFormContext();

  const { fields, remove } = useFieldArray({
    control,
    name: name,
  });
  if (!fields || fields.length === 0)
    return (
      <div className="p-4 leading-6 text-gray-500">
        Chưa có thưởng doanh số.
      </div>
    );
  return (
    <div className="p-4">
      {fields.map((item, index) => (
        <div
          className="pb-3 mb-3 border-b border-dashed last:mb-0 last:pb-0 last:border-0"
          key={item.id}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-px font-medium">
                {item?.User?.FullName || item?.Staff?.label}
              </div>
            </div>
            {item?.OrderItemID &&
              (Brand?.Global?.Admin?.thuong_ds_nang_cao
                ? Auth?.ID === 1
                : adminTools_byStock?.hasRight ||
                  moment(item.CreateDate).format("DD-MM-YYYY") ===
                    moment().format("DD-MM-YYYY")) && (
                <div
                  className="text-danger"
                  onClick={() =>
                    f7.dialog.confirm("Xác nhận loại bỏ ?", () => remove(index))
                  }
                >
                  <MinusCircleIcon className="w-6" />
                </div>
              )}
          </div>
          <div className="mt-2.5">
            <div>
              <Controller
                name={`${name}[${index}].Value`}
                control={control}
                render={({ field, fieldState }) => (
                  <div>
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
                        disabled={
                          Brand?.Global?.Admin?.thuong_ds_nang_cao
                            ? Auth?.ID !== 1
                            : !(
                                adminTools_byStock?.hasRight ||
                                moment(item.CreateDate).format("DD-MM-YYYY") ===
                                  moment().format("DD-MM-YYYY")
                              )
                        }
                      />
                      {field.value &&
                      (Brand?.Global?.Admin?.thuong_ds_nang_cao
                        ? Auth?.ID === 1
                        : adminTools_byStock?.hasRight ||
                          moment(item.CreateDate).format("DD-MM-YYYY") ===
                            moment().format("DD-MM-YYYY")) ? (
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
            {Brand?.Global?.Admin?.thuong_ds_theo_loai && (
              <div className="mt-2.5">
                <Controller
                  name={`${name}[${index}].Type`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <SelectPicker
                      isDisabled={
                        Brand?.Global?.Admin?.thuong_ds_nang_cao
                          ? Auth?.ID !== 1
                          : !(
                              adminTools_byStock?.hasRight ||
                              moment(item.CreateDate).format("DD-MM-YYYY") ===
                                moment().format("DD-MM-YYYY")
                            )
                      }
                      isClearable={true}
                      placeholder="Chọn loại"
                      value={field.value}
                      options={Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (x) => ({
                          label: "Loại " + x,
                          value: x,
                        })
                      )}
                      label="Chọn loại"
                      onChange={(val) => field.onChange(val)}
                      errorMessage={fieldState?.error?.message}
                      errorMessageForce={fieldState?.invalid}
                    />
                  )}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default BonusSalesAuto;

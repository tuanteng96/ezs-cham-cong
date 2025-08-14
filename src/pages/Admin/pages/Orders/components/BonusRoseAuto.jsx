import React from "react";
import { f7, useStore } from "framework7-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { MinusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import moment from "moment";
import ConditionsHelpers from "@/helpers/ConditionsHelpers";

function BonusRoseAuto({ name, adminTools_byStock }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");

  const { control } = useFormContext();

  const { fields, remove } = useFieldArray({
    control,
    name: name,
  });

  let isHiddenPrice = false;
  if (Brand?.Global?.Admin?.hoa_hong_an_gia) {
    if (!adminTools_byStock?.hasRight) isHiddenPrice = true;
  }

  if (!fields || fields.length === 0)
    return (
      <div className="p-4 leading-6 text-gray-500">
        Chưa có thưởng hoa hồng.
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
            {item.SubSourceID &&
              !ConditionsHelpers.isDisabledSalesSommission(
                { ...item, ID: item.SubSourceID },
                Brand?.Global?.Admin?.thuong_ds_nang_cao,
                adminTools_byStock.hasRight
              ) && (
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
                      type={isHiddenPrice ? "password" : "text"}
                      autoComplete="off"
                      thousandSeparator={true}
                      placeholder="Nhập số tiền"
                      value={field.value}
                      onValueChange={(val) =>
                        field.onChange(val.floatValue || "")
                      }
                      disabled={
                        ConditionsHelpers.isDisabledSalesSommission(
                          { ...item, ID: item.SubSourceID || null },
                          Brand?.Global?.Admin?.thuong_ds_nang_cao,
                          adminTools_byStock.hasRight
                        ) || isHiddenPrice
                      }
                    />
                    {field.value &&
                    !ConditionsHelpers.isDisabledSalesSommission(
                      { ...item, ID: item.SubSourceID },
                      Brand?.Global?.Admin?.thuong_ds_nang_cao,
                      adminTools_byStock.hasRight
                    ) &&
                    !isHiddenPrice ? (
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
        </div>
      ))}
    </div>
  );
}

export default BonusRoseAuto;

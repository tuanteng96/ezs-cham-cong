import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { SelectMembers } from "@/partials/forms/select";
import moment from "moment";

function PickerSalaryOs({ children, data, Os, onUpdate, BookDate }) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      SalaryItems: [],
    },
  });

  const { fields, update } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: "SalaryItems", // unique name for your Field Array
  });

  useEffect(() => {
    if (data) {
      if (data?.ContextJSON?.da_tinh_luong) {
        reset({
          SalaryItems: data?.ContextJSON?.da_tinh_luong.map((x) => ({
            ...x,
            User: x?.UserID ? { label: x.UserFullName, value: x.UserID } : null,
          })),
        });
      } else {
        reset({
          SalaryItems: data?.SalaryItems
            ? data?.SalaryItems.map((x) => ({
                ...x,
                User: x?.UserID
                  ? { label: x.UserFullName, value: x.UserID }
                  : null,
              }))
            : [],
        });
      }
    }
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let svh = pos27 && pos27.member(Os?.MemberID).service();
      let rs = null;
      
      if (svh) {
        rs = await svh.saveContextSalaryItem(
          { ...body.Os, BookDate: moment(BookDate).format("YYYY-MM-DD HH:mm") },
          body.SalaryItems
        );
      }
      return rs;
    },
  });

  const onSubmit = (values) => {
    changeMutation.mutate(
      {
        Os,
        SalaryItems: values.SalaryItems,
      },
      {
        onSuccess: () => {
          close();
          onUpdate && onUpdate();
        },
      }
    );
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-center">
                  Lương nhân viên
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <form
                  className="flex flex-col h-full pb-safe-b max-h-[85vh]"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="px-4 overflow-auto grow">
                    {fields &&
                      fields.map((item, index) => (
                        <div
                          className="mb-3 pb-3.5 border-b border-dashed last:mb-0 last:pb-0 last:border-0"
                          key={item.id}
                        >
                          <div className="mb-1.5 flex justify-between items-center">
                            {data?.ContextJSON?.da_tinh_luong ? (
                              <div className="font-medium text-gray-500">
                                {item.UserFullName} ({item.MethodTitle})
                              </div>
                            ) : (
                              <div className="w-full">
                                <div className="mb-1 font-medium text-gray-500">
                                  {item.MethodTitle}
                                </div>
                                <div>
                                  <Controller
                                    name={`SalaryItems[${index}].User`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectMembers
                                        placeholderInput="Nhân viên"
                                        placeholder="Chọn nhân viên"
                                        value={field.value}
                                        label="Chọn nhân viên"
                                        onChange={(val) => {
                                          f7.preloader.show();
                                          let svh =
                                            pos27 &&
                                            pos27
                                              .member(Os?.MemberID)
                                              .service();
                                          if (svh) {
                                            svh
                                              .getContextSalaryItem(Os, {
                                                ...item,
                                                UserID: val?.value || "",
                                                UserFullName: val?.label || "",
                                              })
                                              .then((arr) => {
                                                update(
                                                  index,
                                                  arr && arr.length > 0
                                                    ? {
                                                        ...arr[0],
                                                        User: arr[0].UserID
                                                          ? {
                                                              label:
                                                                arr[0]
                                                                  .UserFullName,
                                                              value:
                                                                arr[0].UserID,
                                                            }
                                                          : null,
                                                      }
                                                    : null
                                                );
                                                f7.preloader.hide();
                                              })
                                              .catch(() => f7.preloader.hide());
                                          }
                                        }}
                                        isFilter
                                        //isMulti
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="mb-1.5">
                            <Controller
                              name={`SalaryItems[${index}].Value`}
                              control={control}
                              render={({ field, fieldState }) => (
                                <div className="flex">
                                  <div className="bg-gray-100 px-4 rounded-s w-[100px] flex items-center border-l border-t border-b border-[#d5d7da] text-[13px]">
                                    Lương ca
                                  </div>
                                  <div className="relative flex-1">
                                    <NumericFormat
                                      className={clsx(
                                        "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded-s-none rounded-e py-3 px-4 focus:border-primary",
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
                        </div>
                      ))}
                  </div>
                  {Os?.Status !== "done" && (
                    <div className="p-4">
                      <Button
                        type="submit"
                        className="rounded-full bg-app"
                        fill
                        large
                        preloader
                        loading={changeMutation.isLoading}
                        disabled={changeMutation.isLoading}
                      >
                        Tính lương
                      </Button>
                    </div>
                  )}
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerSalaryOs;

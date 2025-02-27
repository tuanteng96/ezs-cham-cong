import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Button, f7, Input, useStore } from "framework7-react";
import clsx from "clsx";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import { DatePicker } from "@/partials/forms";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import moment from "moment";
import { NumericFormat } from "react-number-format";
import ConfigsAPI from "@/api/Configs.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

let getInitial = () => {
  let data = [];
  for (let index = 0; index < 7; index++) {
    let obj = {};
    obj.Title = moment().clone().weekday(index).format("dddd");
    obj.index = index;
    obj.TimeFrom = "06:00";
    obj.TimeTo = "18:00";
    obj.Value = 1;
    obj.isOff = true;
    data.push(obj);
  }
  return data;
};

function PickerShift({ children, initialValues, data }) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);
  const [visibleSetup, setVisibleSetup] = useState(false);

  const { control, handleSubmit, reset, watch, setError } = useForm({
    defaultValues: {
      Title: "",
      flexible: false,
      Options: [],
      Days: [],
    },
  });

  const {
    fields: fieldsOptions,
    append: appendOptions,
    remove: removeOptions,
  } = useFieldArray({
    control,
    name: "Options",
  });

  const {
    fields: fieldsDays,
    append: appendDays,
    remove: removeDays,
  } = useFieldArray({
    control,
    name: "Days",
  });

  useEffect(() => {
    if (visible)
      reset({
        ...initialValues,
        Title: initialValues?.Name || "",
      });
  }, [initialValues, visible]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      await queryClient.invalidateQueries(["TimekeepingsShift"]);
      return data;
    },
  });

  const close = () => {
    setVisible(false);
  };

  const closeSetup = () => {
    setVisibleSetup(false);
  };

  const onSubmit = (values) => {
    if (
      values.flexible &&
      values.Options.filter((x) => !x.Title || x.Value === "").length > 0
    ) {
      for (const [i, value] of values.Options.entries()) {
        if (!value.Title) {
          setError(`Options[${i}].Title`, {
            type: "Client",
            message: "Vui lòng nhập tên ca",
          });
        }
        if (value.Value === "") {
          setError(`Options[${i}].Value`, {
            type: "Client",
            message: "Vui lòng nhập số công ca",
          });
        }
      }
      return;
    }
    let newValues = [...data];

    if (!initialValues) {
      newValues.push(values);
    } else {
      let index = newValues.findIndex(x => x.ID === initialValues.ID)
      if(index > -1) {
        newValues[index] = values
      }
    }

    updateMutation.mutate(
      { data: newValues, name: "calamviecconfig" },
      {
        onSuccess: () => {
          toast.success("Thêm mới thành công");
          setVisible(false);
          setVisibleSetup(false);
        },
      }
    );
  };

  const onCreate = () => {
    let { Title, flexible } = watch();
    if (!Title) {
      setError("Title", {
        type: "Client",
        message: "Vui lòng nhập tên ca làm việc",
      });
    } else {
      if (flexible) {
        reset({
          ID: initialValues
            ? initialValues.ID
            : f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
          Name: Title,
          Title: Title,
          flexible: flexible,
          Options: initialValues
            ? initialValues.Options
            : [
                {
                  Title: "",
                  TimeFrom: "06:00",
                  TimeTo: "18:00",
                  Value: 1,
                },
              ],
        });
      } else {
        reset({
          ID: initialValues
            ? initialValues.ID
            : f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
          Title: Title,
          Name: Title,
          flexible: flexible,
          Days: initialValues ? initialValues.Days : getInitial(),
        });
      }

      setVisibleSetup(true);
    }
  };

  const getTotalTime = (day) => {
    if (day.isOff) return "Ngày nghỉ";
    var a = moment(day.TimeFrom, "HH:mm");
    var b = moment(day.TimeTo, "HH:mm");
    var duration = moment.duration(b.diff(a));
    var hours = duration.asHours();
    return Math.round(hours) + "h";
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
                    {initialValues ? "Chỉnh sửa ca làm việc" : "Tạo mới ca làm việc"}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-1">Tên ca làm việc</div>
                      <Controller
                        name="Title"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <Input
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px]"
                            type="text"
                            placeholder="Nhập tên ca"
                            value={field.value}
                            clearButton={true}
                            onInput={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "body",
                                Event: e,
                              })
                            }
                          />
                        )}
                      />
                    </div>
                    <div className="flex items-end justify-between mb-3.5 last:mb-0">
                      <div>Ca linh hoạt</div>
                      <Controller
                        name="flexible"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              {...field}
                              checked={field.value}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                          </label>
                        )}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      type="button"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      onClick={() => onCreate()}
                    >
                      Tiếp tục
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
        {visibleSetup &&
          createPortal(
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visibleSetup}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSetup}
              ></motion.div>
              <motion.div
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[90vh]"
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
                    {watch().Name}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={closeSetup}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    {watch().flexible && (
                      <>
                        {fieldsOptions &&
                          fieldsOptions.map((item, index) => (
                            <div
                              className="border rounded shadow mb-3.5 last:mb-0 p-4"
                              key={item.id}
                            >
                              <div className="mb-3.5 last:mb-0">
                                <div className="mb-1">Tên ca</div>
                                <Controller
                                  name={`Options[${index}].Title`}
                                  control={control}
                                  render={({
                                    field: { ref, ...field },
                                    fieldState,
                                  }) => (
                                    <Input
                                      errorMessage={fieldState?.error?.message}
                                      errorMessageForce={fieldState?.invalid}
                                      className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px]"
                                      type="text"
                                      placeholder="Nhập tên ca"
                                      value={field.value}
                                      clearButton={true}
                                      onInput={field.onChange}
                                      onFocus={(e) =>
                                        KeyboardsHelper.setAndroid({
                                          Type: "body",
                                          Event: e,
                                        })
                                      }
                                    />
                                  )}
                                />
                              </div>
                              <div className="mb-3.5 last:mb-0">
                                <div className="flex">
                                  <div className="flex-1">
                                    <div className="mb-px font-light">
                                      Bắt đầu lúc
                                    </div>
                                    <Controller
                                      name={`Options[${index}].TimeFrom`}
                                      control={control}
                                      render={({ field, fieldState }) => (
                                        <DatePicker
                                          format="HH:mm"
                                          errorMessage={
                                            fieldState?.error?.message
                                          }
                                          errorMessageForce={
                                            fieldState?.invalid
                                          }
                                          value={
                                            field.value
                                              ? moment().set({
                                                  hour: moment(
                                                    field.value,
                                                    "HH:mm"
                                                  ).get("hour"),
                                                  minute: moment(
                                                    field.value,
                                                    "HH:mm"
                                                  ).get("minute"),
                                                  second: moment(
                                                    field.value,
                                                    "HH:mm"
                                                  ).get("second"),
                                                })
                                              : ""
                                          }
                                          onChange={(val) =>
                                            field.onChange(
                                              val
                                                ? moment(val).format("HH:mm")
                                                : ""
                                            )
                                          }
                                          placeholder="Chọn thời gian"
                                          showHeader
                                        />
                                      )}
                                    />
                                  </div>
                                  <div className="flex items-center justify-center w-12 pt-5 text-gray-500">
                                    <ArrowRightIcon className="w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="mb-px font-light">
                                      Kết thúc lúc
                                    </div>
                                    <Controller
                                      name={`Options[${index}].TimeTo`}
                                      control={control}
                                      render={({ field, fieldState }) => (
                                        <DatePicker
                                          format="HH:mm"
                                          errorMessage={
                                            fieldState?.error?.message
                                          }
                                          errorMessageForce={
                                            fieldState?.invalid
                                          }
                                          value={
                                            field.value
                                              ? moment().set({
                                                  hour: moment(
                                                    field.value,
                                                    "HH:mm"
                                                  ).get("hour"),
                                                  minute: moment(
                                                    field.value,
                                                    "HH:mm"
                                                  ).get("minute"),
                                                  second: moment(
                                                    field.value,
                                                    "HH:mm"
                                                  ).get("second"),
                                                })
                                              : ""
                                          }
                                          onChange={(val) =>
                                            field.onChange(
                                              val
                                                ? moment(val).format("HH:mm")
                                                : ""
                                            )
                                          }
                                          placeholder="Chọn thời gian"
                                          showHeader
                                        />
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="mb-3.5 last:mb-0">
                                <div className="mb-px">Số công</div>
                                <div>
                                  <Controller
                                    name={`Options[${index}].Value`}
                                    control={control}
                                    render={({
                                      field: { ref, ...field },
                                      fieldState,
                                    }) => (
                                      <NumericFormat
                                        className={clsx(
                                          "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                          fieldState?.invalid
                                            ? "border-danger"
                                            : "border-[#d5d7da]"
                                        )}
                                        type="text"
                                        autoComplete="off"
                                        thousandSeparator={false}
                                        placeholder="Nhập số lượng"
                                        value={field.value}
                                        onValueChange={(val) =>
                                          field.onChange(val.floatValue || "")
                                        }
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="mb-3.5 last:mb-0 flex justify-center gap-2">
                                <button
                                  className="flex items-center justify-center text-white rounded w-9 h-9 bg-success"
                                  type="button"
                                  onClick={() => {
                                    appendOptions({
                                      Title: "",
                                      TimeFrom: "06:00",
                                      TimeTo: "18:00",
                                      Value: 1,
                                    });
                                  }}
                                >
                                  <PlusIcon className="w-5" />
                                </button>
                                <button
                                  className="flex items-center justify-center text-white rounded w-9 h-9 bg-danger disabled:opacity-40"
                                  type="button"
                                  onClick={() => removeOptions(index)}
                                  disabled={
                                    !fieldsOptions || fieldsOptions.length === 1
                                  }
                                >
                                  <TrashIcon className="w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                    {!watch().flexible && (
                      <>
                        {fieldsDays &&
                          fieldsDays.map((item, index) => (
                            <div
                              className="border rounded shadow mb-3.5 last:mb-0"
                              key={item.id}
                            >
                              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                                <div>
                                  <span className="font-semibold capitalize">
                                    {item.Title}
                                  </span>
                                  <span className="pl-2 text-gray-600">
                                    ({getTotalTime(watch().Days[index])})
                                  </span>
                                </div>
                                <Controller
                                  name={`Days[${index}].isOff`}
                                  control={control}
                                  render={({
                                    field: { ref, ...field },
                                    fieldState,
                                  }) => (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        {...field}
                                        checked={!field.value}
                                        onChange={() =>
                                          field.onChange(!field.value)
                                        }
                                      />
                                      <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                                    </label>
                                  )}
                                />
                              </div>
                              {!watch().Days[index].isOff && (
                                <div className="p-4 border-t">
                                  <div className="mb-3.5 last:mb-0">
                                    <div className="flex">
                                      <div className="flex-1">
                                        <div className="mb-px font-light">
                                          Bắt đầu lúc
                                        </div>
                                        <Controller
                                          name={`Days[${index}].TimeFrom`}
                                          control={control}
                                          render={({ field, fieldState }) => (
                                            <DatePicker
                                              format="HH:mm"
                                              errorMessage={
                                                fieldState?.error?.message
                                              }
                                              errorMessageForce={
                                                fieldState?.invalid
                                              }
                                              value={
                                                field.value
                                                  ? moment().set({
                                                      hour: moment(
                                                        field.value,
                                                        "HH:mm"
                                                      ).get("hour"),
                                                      minute: moment(
                                                        field.value,
                                                        "HH:mm"
                                                      ).get("minute"),
                                                      second: moment(
                                                        field.value,
                                                        "HH:mm"
                                                      ).get("second"),
                                                    })
                                                  : ""
                                              }
                                              onChange={(val) =>
                                                field.onChange(
                                                  val
                                                    ? moment(val).format(
                                                        "HH:mm"
                                                      )
                                                    : ""
                                                )
                                              }
                                              placeholder="Chọn thời gian"
                                              showHeader
                                            />
                                          )}
                                        />
                                      </div>
                                      <div className="flex items-center justify-center w-12 pt-5 text-gray-500">
                                        <ArrowRightIcon className="w-5" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="mb-px font-light">
                                          Kết thúc lúc
                                        </div>
                                        <Controller
                                          name={`Days[${index}].TimeTo`}
                                          control={control}
                                          render={({ field, fieldState }) => (
                                            <DatePicker
                                              format="HH:mm"
                                              errorMessage={
                                                fieldState?.error?.message
                                              }
                                              errorMessageForce={
                                                fieldState?.invalid
                                              }
                                              value={
                                                field.value
                                                  ? moment().set({
                                                      hour: moment(
                                                        field.value,
                                                        "HH:mm"
                                                      ).get("hour"),
                                                      minute: moment(
                                                        field.value,
                                                        "HH:mm"
                                                      ).get("minute"),
                                                      second: moment(
                                                        field.value,
                                                        "HH:mm"
                                                      ).get("second"),
                                                    })
                                                  : ""
                                              }
                                              onChange={(val) =>
                                                field.onChange(
                                                  val
                                                    ? moment(val).format(
                                                        "HH:mm"
                                                      )
                                                    : ""
                                                )
                                              }
                                              placeholder="Chọn thời gian"
                                              showHeader
                                            />
                                          )}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mb-3.5 last:mb-0">
                                    <div className="mb-px">Số công</div>
                                    <div>
                                      <Controller
                                        name={`Days[${index}].Value`}
                                        control={control}
                                        render={({
                                          field: { ref, ...field },
                                          fieldState,
                                        }) => (
                                          <NumericFormat
                                            className={clsx(
                                              "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                              fieldState?.invalid
                                                ? "border-danger"
                                                : "border-[#d5d7da]"
                                            )}
                                            type="text"
                                            autoComplete="off"
                                            thousandSeparator={false}
                                            placeholder="Nhập số lượng"
                                            value={field.value}
                                            onValueChange={(val) =>
                                              field.onChange(
                                                val.floatValue || ""
                                              )
                                            }
                                          />
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </>
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
                      {initialValues ? "Cập nhập" : "Thêm mới"}
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

export default PickerShift;

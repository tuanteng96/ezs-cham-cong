import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Button, f7, Input, useStore } from "framework7-react";
import { DatePicker, SelectPicker } from "@/partials/forms";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { SelectMembers } from "@/partials/forms/select";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import AdminAPI from "@/api/Admin.api";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";

const schemaAddEdit = yup
  .object({
    UserID: yup.object().required("Vui lòng chọn nhân viên."),
  })
  .required();

let optionsReason = [
  {
    value: "CA_NHAN",
    label: "Việc cá nhân",
  },
  {
    value: "CONG_TY",
    label: "Việc công ty",
  },
];

let optionsTypeIn = [
  {
    value: "DI_SOM",
    label: "Đi sớm",
  },
  {
    value: "DI_MUON",
    label: "Đi muộn",
  },
];

let optionsTypeOut = [
  {
    value: "VE_SOM",
    label: "Về sớm",
  },
  {
    value: "VE_MUON",
    label: "Về muộn",
  },
];

function PickerTimekeeping({ children, user, filters }) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ...user,
    },
    //resolver: yupResolver(schemaAddEdit),
  });

  const { fields } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: "Dates", // unique name for your Field Array
  });

  useEffect(() => {
    if (visible) {
      reset(user);
    }
  }, [user, visible]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.actionInOutTimeKeeping(body);
      await queryClient.invalidateQueries(["TimekeepingsSheet"]);
      return data;
    },
  });

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    let { UserID, Dates } = values;
    let { WorkTrack, Date } = Dates[0];

    let obj = {
      UserID: UserID,
      CreateDate: moment(Date).format("YYYY-MM-DD"),
      Info: {
        CheckOut: {},
      },
      StockID: filters.StockID?.value,
    };

    obj.CheckIn = WorkTrack.CheckIn
      ? moment(Date)
          .set({
            hour: moment(WorkTrack.CheckIn, "HH:mm").get("hour"),
            minute: moment(WorkTrack.CheckIn, "HH:mm").get("minute"),
            second: 0,
          })
          .format("YYYY-MM-DD HH:mm:ss")
      : WorkTrack.CheckIn;
    obj.CheckOut = WorkTrack.CheckOut
      ? moment(Date)
          .set({
            hour: moment(WorkTrack.CheckOut, "HH:mm").get("hour"),
            minute: moment(WorkTrack.CheckOut, "HH:mm").get("minute"),
            second: 0,
          })
          .format("YYYY-MM-DD HH:mm:ss")
      : WorkTrack.CheckOut;
    obj.Info.Desc = WorkTrack.Info.Desc || "";
    obj.Info.CheckOut.Desc = WorkTrack.Info.CheckOut.Desc || "";
    obj.Info.Note = WorkTrack.Info.Note || "";
    if (WorkTrack.ID) {
      obj.ID = WorkTrack.ID;
    }
    if (WorkTrack.StockID) {
      obj.StockID = WorkTrack.StockID;
    }
    if (WorkTrack.Info.TimekeepingType) {
      if (
        WorkTrack.Info[WorkTrack.Info.TimekeepingType.value] &&
        WorkTrack.Info[WorkTrack.Info.TimekeepingType.value].Value ===
          Math.abs(WorkTrack.Info.TimekeepingTypeValue)
      ) {
        obj.Info[WorkTrack.Info.TimekeepingType.value] = {
          ...WorkTrack.Info[WorkTrack.Info.TimekeepingType.value],
        };
      } else {
        obj.Info[WorkTrack.Info.TimekeepingType.value] = {
          Value: Math.abs(WorkTrack.Info.TimekeepingTypeValue),
        };
      }
    }
    if (WorkTrack.Info.CheckOut.TimekeepingType) {
      if (
        WorkTrack.Info.CheckOut[
          WorkTrack.Info.CheckOut.TimekeepingType.value
        ] &&
        WorkTrack.Info.CheckOut[
          WorkTrack.Info.CheckOut.TimekeepingType.value
        ] === Math.abs(WorkTrack.Info.CheckOut.TimekeepingTypeValue)
      ) {
        obj.Info.CheckOut[WorkTrack.Info.CheckOut.TimekeepingType.value] = {
          ...WorkTrack.Info[WorkTrack.Info.CheckOut.TimekeepingType.value],
        };
      } else {
        obj.Info.CheckOut[WorkTrack.Info.CheckOut.TimekeepingType.value] = {
          Value: Math.abs(WorkTrack.Info.CheckOut.TimekeepingTypeValue),
        };
      }
    }
    if (WorkTrack.Info.Type) {
      obj.Info.Type = WorkTrack.Info.Type.value;
    }
    if (WorkTrack.Info.CheckOut.Type) {
      obj.Info.CheckOut.Type = WorkTrack.Info.CheckOut.Type.value;
    }
    if (
      WorkTrack?.Info?.CheckOut &&
      WorkTrack?.Info?.CheckOut?.WorkToday?.Value === WorkTrack.Info.CountWork
    ) {
      obj.Info.CheckOut.WorkToday = {
        Value: WorkTrack.Info.CountWork,
      };
    } else if (
      WorkTrack.Info.WorkToday &&
      WorkTrack.Info.WorkToday.Value === WorkTrack.Info.CountWork
    ) {
      obj.Info.WorkToday = WorkTrack.Info.WorkToday;
    } else {
      obj.Info.WorkToday = {
        Value: WorkTrack.Info.CountWork,
      };
    }
    updateMutation.mutate(
      {
        data: {
          edit: [obj],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công");
          setVisible(false);
        },
      }
    );
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
                    {user?.FullName}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="p-4 overflow-auto">
                    {fields &&
                      fields.map((item, index) => (
                        <div key={item.id}>
                          <div className="grid grid-cols-2 gap-4 mb-3.5">
                            <div>
                              <div className="mb-px font-light">Vào</div>
                              <Controller
                                name={`Dates[${index}].WorkTrack.CheckIn`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <DatePicker
                                    format="HH:mm"
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Thời gian"
                                    showHeader
                                    icon={() => (
                                      <div className="absolute flex items-center justify-center w-10 h-full text-success">
                                        <ArrowLeftOnRectangleIcon className="w-6" />
                                      </div>
                                    )}
                                  />
                                )}
                              />
                            </div>
                            <div>
                              <div className="mb-px font-light">Ra</div>
                              <Controller
                                name={`Dates[${index}].WorkTrack.CheckOut`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <DatePicker
                                    format="HH:mm"
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Thời gian"
                                    showHeader
                                    icon={() => (
                                      <div className="absolute flex items-center justify-center w-10 h-full text-danger">
                                        <ArrowRightOnRectangleIcon className="w-6" />
                                      </div>
                                    )}
                                  />
                                )}
                              />
                            </div>
                          </div>
                          <div className="mb-7">
                            <div className="mb-px font-light">Số công</div>
                            <Controller
                              name={`Dates[${index}].WorkTrack.Info.CountWork`}
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
                                      placeholder="Số công"
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
                                    ) : <></>}
                                  </div>
                                </div>
                              )}
                            />
                          </div>
                          <div className="relative px-4 pt-5 pb-4 border rounded-lg">
                            <div className="absolute z-10 px-3 font-bold uppercase bg-white -top-3 text-success">
                              Thông tin vào
                            </div>
                            <div className="mb-3.5 last:mb-0">
                              {/* <div className="mb-px font-light">Loại</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.TimekeepingType`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable
                                    placeholder="Chọn loại"
                                    value={field.value}
                                    options={optionsTypeIn}
                                    label="Loại"
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
                              {/* <div className="mb-px font-light">Tiền thưởng / phạt</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.TimekeepingTypeValue`}
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
                                        placeholder="Tiền thưởng / phạt"
                                        value={field.value}
                                        onValueChange={(val) =>
                                          field.onChange(val.floatValue || "")
                                        }
                                      />
                                      {field.value && (
                                        <div
                                          className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                          onClick={() => field.onChange("")}
                                        >
                                          <XMarkIcon className="w-5" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              />
                            </div>
                            <div className="mb-3.5 last:mb-0">
                              {/* <div className="mb-px font-light">Lý do</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.Type`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable
                                    placeholder="Lý do"
                                    value={field.value}
                                    options={optionsReason}
                                    label="Lý do"
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
                              {/* <div className="mb-px font-light">Mô tả</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.Desc`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <Input
                                    className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[70px]"
                                    type="textarea"
                                    placeholder="Mô tả lý do"
                                    rows="3"
                                    value={field.value}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                    onChange={field.onChange}
                                  />
                                )}
                              />
                            </div>
                          </div>
                          <div className="relative px-4 pt-5 pb-4 mt-6 border rounded-lg">
                            <div className="absolute z-10 px-3 font-bold uppercase bg-white -top-3 text-danger">
                              Thông tin Ra
                            </div>
                            <div className="mb-3.5 last:mb-0">
                              {/* <div className="mb-px font-light">Loại</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.CheckOut.TimekeepingType`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable
                                    placeholder="Chọn loại"
                                    value={field.value}
                                    options={optionsTypeOut}
                                    label="Loại"
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
                              {/* <div className="mb-px font-light">Tiền thưởng / phạt</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.CheckOut.TimekeepingTypeValue`}
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
                                        placeholder="Tiền thưởng / phạt"
                                        value={field.value}
                                        onValueChange={(val) =>
                                          field.onChange(val.floatValue || "")
                                        }
                                      />
                                      {field.value && (
                                        <div
                                          className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                          onClick={() => field.onChange("")}
                                        >
                                          <XMarkIcon className="w-5" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              />
                            </div>
                            <div className="mb-3.5 last:mb-0">
                              {/* <div className="mb-px font-light">Lý do</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.CheckOut.Type`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectPicker
                                    isClearable
                                    placeholder="Lý do"
                                    value={field.value}
                                    options={optionsReason}
                                    label="Lý do"
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
                              {/* <div className="mb-px font-light">Mô tả</div> */}
                              <Controller
                                name={`Dates[${index}].WorkTrack.Info.CheckOut.Desc`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <Input
                                    className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[70px]"
                                    type="textarea"
                                    placeholder="Mô tả lý do"
                                    rows="3"
                                    value={field.value}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                    onChange={field.onChange}
                                  />
                                )}
                              />
                            </div>
                          </div>
                          <div className="mt-3.5">
                            {/* <div className="mb-px">Ghi chú</div> */}
                            <Controller
                              name={`Dates[${index}].WorkTrack.Info.Note`}
                              control={control}
                              render={({ field, fieldState }) => (
                                <Input
                                  className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[100px]"
                                  type="textarea"
                                  placeholder="Ghi chú"
                                  rows="3"
                                  value={field.value}
                                  errorMessage={fieldState?.error?.message}
                                  errorMessageForce={fieldState?.invalid}
                                  onChange={field.onChange}
                                />
                              )}
                            />
                          </div>
                        </div>
                      ))}
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
                      Lưu thay đổi
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

export default PickerTimekeeping;

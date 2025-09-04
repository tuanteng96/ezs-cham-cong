import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, useStore } from "framework7-react";
import { DatePicker, SelectPicker } from "@/partials/forms";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { SelectMembers } from "@/partials/forms/select";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";

function PickerChangeStock({ children, user, item }) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");

  const { cong_ca } = RolesHelpers.useRoles({
    nameRoles: ["cong_ca"],
    auth: Auth,
    CrStocks,
  });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      StockID: "",
    },
  });

  useEffect(() => {
    reset({
      StockID:
        item?.WorkTrack?.StockID
          ? {
              label: item?.WorkTrack?.StockTitle,
              value: item?.WorkTrack?.WorkTrack?.StockID,
            }
          : null,
    });
  }, [user, visible]);

  const close = (e) => {
    e.stopPropagation()
    setVisible(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.actionInOutTimeKeeping(body);
      await queryClient.invalidateQueries({ queryKey: ["TimekeepingsSheet"] });
      return data;
    },
  });

  const onSubmit = (values) => {
    const newValues = {
      edit: [],
    };

    let { UserID, Dates } = user;
    let { WorkTrack, Date } = Dates[0];

    let obj = {
      UserID: UserID,
      CreateDate: moment(Date).format("YYYY-MM-DD"),
      Info: {
        CheckOut: {},
      },
      StockID: values?.StockID?.value,
    };

    obj.CheckIn = WorkTrack.CheckIn
      ? moment(WorkTrack.CheckIn).format("YYYY-MM-DD HH:mm:ss")
      : WorkTrack.CheckIn;
    obj.CheckOut = WorkTrack.CheckOut
      ? moment(WorkTrack.CheckOut).format("YYYY-MM-DD HH:mm:ss")
      : WorkTrack.CheckOut;
    obj.Info.Desc = WorkTrack.Info.Desc || "";
    obj.Info.CheckOut.Desc = WorkTrack.Info.CheckOut.Desc || "";
    obj.Info.Note = WorkTrack.Info.Note || "";
    if (WorkTrack.ID) {
      obj.ID = WorkTrack.ID;
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
    newValues.edit.push(obj);

    saveMutation.mutate(
      {
        data: newValues,
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công.");
          close();
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
                  className="flex flex-col h-full pb-safe-b"
                  autoComplete="off"
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Thay đổi cơ sở
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
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
                            options={
                              cong_ca?.StockRolesAll
                                ? cong_ca?.StockRolesAll.map((x) => ({
                                    ...x,
                                    value: x.value || 778,
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
                  </div>
                  <div className="grid grid-cols-1 p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={saveMutation.isLoading}
                      disabled={saveMutation.isLoading}
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

export default PickerChangeStock;

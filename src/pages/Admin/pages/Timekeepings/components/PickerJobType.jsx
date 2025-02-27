import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button, Input, useStore } from "framework7-react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import { toast } from "react-toastify";
import { SelectPicker } from "@/partials/forms";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import ConfigsAPI from "@/api/Configs.api";

function PickerJobType({ children, user }) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ConfigJobType"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("calamviecconfig");
      let result = [];
      if (data.data && data.data.length > 0) {
        result = JSON.parse(data.data[0].Value).map((x) => ({
          ...x,
          label: x.Name,
          value: x.ID,
        }));
      }
      return result;
    },
    enabled: visible,
  });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      UserID: "",
      Shift: "",
      SalaryHours: "",
    },
  });

  useEffect(() => {
    if (user?.WorkTimeSetting) {
      let WorkTimeSetting = JSON.parse(user?.WorkTimeSetting);
      reset({
        UserID: user?.UserID,
        Shift:
          WorkTimeSetting.ShiftName && WorkTimeSetting.ShiftID
            ? {
                label: WorkTimeSetting.ShiftName,
                value: WorkTimeSetting.ShiftID,
              }
            : null,
        SalaryHours: WorkTimeSetting?.SalaryHours || "",
      });
    } else {
      reset({
        UserID: "",
        Shift: "",
        SalaryHours: "",
      });
    }
  }, [user]);

  const close = () => {
    setVisible(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.saveTypeShift(body);
      await queryClient.invalidateQueries({ queryKey: ["TimekeepingsSheet"] });
      return data;
    },
  });

  const onSubmit = (values) => {
    saveMutation.mutate(
      {
        Token: Auth?.ID,
        data: {
          updateList: [
            {
              UserID: user?.UserID,
              ShiftName: values?.Shift?.label || "",
              ShiftID: values?.Shift?.value || "",
              SalaryHours: values.SalaryHours,
            },
          ],
        },
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
                    {user?.FullName}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Loại công ca</div>
                      <Controller
                        name="Shift"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            isClearable
                            placeholder="Chọn loại công ca"
                            value={field.value}
                            options={data || []}
                            label="Loại công ca"
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
                      <div className="mb-px font-light">Lương theo giờ</div>
                      <Controller
                        name="SalaryHours"
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
                                placeholder="Nhập lương"
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
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-4">
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

export default PickerJobType;

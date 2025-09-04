import { Button, Input, Sheet, f7 } from "framework7-react";
import React, { useEffect, useState } from "react";
import { SelectPicker } from "../partials/forms";
import KeyboardsHelper from "../helpers/KeyboardsHelper";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "react-query";
import WorkTrackAPI from "../api/WorkTrack.api";
import store from "@/js/store";
import AlertHelpers from "@/helpers/AlertHelpers";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const schemaConfirm = yup
  .object({
    Info: yup.object({
      Type: yup.object().required("Vui lòng chọn loại."),
      Desc: yup
        .string()
        //.required("Vui lòng nhập mô tả.")
        .when(["Type"], {
          is: (Type) => {
            return Type?.value === "CONG_TY";
          },
          then: (schema) => schema.required("Vui lòng nhập mô tả."),
        }),
    }),
  })
  .required();

let options = [
  {
    label: "Việc cá nhân",
    value: "CA_NHAN",
  },
  {
    label: "Việc công ty",
    value: "CONG_TY",
  },
];

function PickerConfirm({ children }) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: {},
    resolver: yupResolver(schemaConfirm),
  });
  const [visible, setVisible] = useState(false);

  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    const el = document.getElementById("framework7-root");
    setPortalRoot(el);
  }, []);

  const confirmMutation = useMutation({
    mutationFn: async (body) => {
      try {
        let { data } = await WorkTrackAPI.CheckInOut(body);
        if (!data?.list || data?.list?.length === 0) {
          await store.dispatch("setCrsInOut", body.list[0]);
        }

        await Promise.all([
          queryClient.invalidateQueries(["Auth"]),
          queryClient.invalidateQueries(["TimekeepingHome"]),
          queryClient.invalidateQueries(["TimekeepingList"]),
        ]);
        return data ? { ...data, body: body.list[0] } : { body: body.list[0] };
      } catch (error) {
        await store.dispatch("setCrsInOut", body.list[0]);
        throw { body: body.list[0] };
      }
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang chấm công...");
    let newValues = { ...values };

    delete newValues.Info.Title;
    if (
      newValues.Info["DI_MUON"] &&
      newValues?.Info?.Type?.value === "CONG_TY"
    ) {
      newValues.Info["DI_MUON"] = {
        ...newValues.Info["DI_MUON"],
        Value: 0,
      };
    }
    if (
      newValues.Info["VE_SOM"] &&
      newValues?.Info?.Type?.value === "CONG_TY"
    ) {
      newValues.Info["VE_SOM"] = {
        ...newValues.Info["VE_SOM"],
        Value: 0,
      };
    }
    if (
      newValues.Info["DI_SOM"] &&
      newValues?.Info?.Type?.value === "CA_NHAN"
    ) {
      newValues.Info["DI_SOM"] = {
        ...newValues.Info["DI_SOM"],
        Value: 0,
      };
    }
    if (
      newValues.Info["VE_MUON"] &&
      newValues?.Info?.Type?.value === "CA_NHAN"
    ) {
      newValues.Info["VE_MUON"] = {
        ...newValues.Info["VE_MUON"],
        Value: 0,
      };
    }

    if (
      newValues.Info["DI_MUON"] &&
      newValues?.Info?.Type?.value === "CA_NHAN" &&
      typeof newValues.Info["DI_MUON"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["DI_MUON"].WorkDays;
    }

    if (
      newValues.Info["VE_SOM"] &&
      newValues?.Info?.Type?.value === "CA_NHAN" &&
      typeof newValues.Info["VE_SOM"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["VE_SOM"].WorkDays;
    }

    if (
      newValues.Info["DI_SOM"] &&
      newValues?.Info?.Type?.value === "CONG_TY" &&
      typeof newValues.Info["DI_SOM"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["DI_SOM"].WorkDays;
    }

    if (
      newValues.Info["VE_MUON"] &&
      newValues?.Info?.Type?.value === "CONG_TY" &&
      typeof newValues.Info["VE_MUON"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["VE_MUON"].WorkDays;
    }

    let dataConfirm = {
      list: [
        {
          ...newValues,
          Info: {
            ...newValues?.Info,
            Type: newValues?.Info?.Type?.value || "",
          },
        },
      ],
    };

    confirmMutation.mutate(dataConfirm, {
      onSuccess: (data) => {
        setVisible(false);
        AlertHelpers.CheckInOut({
          data,
          dataCheckInOut: dataConfirm,
        });
      },
      onError: (error) => {
        setVisible(false);
        AlertHelpers.CheckInOut({
          data: error,
          dataCheckInOut: dataConfirm,
        });
      },
    });
  };

  const close = () => {
    reset();
    setVisible(false);
  };

  if (!portalRoot) return null;

  return (
    <>
      {children({
        open: (initialValues) => {
          setVisible(true);
          if (initialValues) {
            reset({
              ...initialValues,
              Info: {
                ...initialValues?.Info,
                Type: options[0],
                Desc: "",
              },
            });
          }
        },
        close,
      })}

      {createPortal(
        <AnimatePresence>
          {visible && (
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />

              {/* Sheet content */}
              <motion.div
                key="sheet"
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="p-4 my-2">
                  <div className="text-xl font-medium">
                    {watch()?.Info?.Title}
                  </div>
                  <div className="mt-1 font-light">
                    Hãy thông báo cho chúng tôi biết lý do để đảm bảo quyền lợi
                    của bạn.
                  </div>
                </div>

                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Lý do</div>
                      <Controller
                        name="Info.Type"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            placeholder="Chọn loại"
                            value={field.value}
                            options={options}
                            label="Chọn loại"
                            onChange={(val) => field.onChange(val)}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            autoHeight
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Mô tả</div>
                      <Controller
                        name="Info.Desc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[150px]"
                            type="textarea"
                            placeholder="Nhập mô tả lý do"
                            rows="5"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onChange={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "modal",
                                Event: e,
                              })
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={confirmMutation.isLoading}
                      disabled={confirmMutation.isLoading}
                    >
                      Cập nhật
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

export default PickerConfirm;

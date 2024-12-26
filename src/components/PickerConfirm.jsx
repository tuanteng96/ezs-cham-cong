import { Button, Input, Sheet, f7 } from "framework7-react";
import React, { useState } from "react";
import { SelectPicker } from "../partials/forms";
import KeyboardsHelper from "../helpers/KeyboardsHelper";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "react-query";
import WorkTrackAPI from "../api/WorkTrack.api";
import { toast } from "react-toastify";

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

  const confirmMutation = useMutation({
    mutationFn: async (body) => {
      let data = await WorkTrackAPI.CheckInOut(body);
      await Promise.all([
        queryClient.invalidateQueries(["Auth"]),
        queryClient.invalidateQueries(["TimekeepingHome"]),
        queryClient.invalidateQueries(["TimekeepingList"]),
      ]);
      return data;
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
      newValues.Info.WorkToday.Value = newValues.Info["DI_MUON"].WorkDays
    }

    if (
      newValues.Info["VE_SOM"] &&
      newValues?.Info?.Type?.value === "CA_NHAN" &&
      typeof newValues.Info["VE_SOM"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["VE_SOM"].WorkDays
    }

    if (
      newValues.Info["DI_SOM"] &&
      newValues?.Info?.Type?.value === "CONG_TY" &&
      typeof newValues.Info["DI_SOM"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["DI_SOM"].WorkDays
    }

    if (
      newValues.Info["VE_MUON"] &&
      newValues?.Info?.Type?.value === "CONG_TY" &&
      typeof newValues.Info["VE_MUON"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["VE_MUON"].WorkDays
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
      onSettled: () => {
        f7.dialog.close();
        setVisible(false);
        toast.success("Chấm công thành công.", {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 2000,
        });
      },
    });
  };

  const close = () => {
    reset();
    setVisible(false);
  };

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
        close: close,
      })}
      <Sheet
        style={{ height: "auto" }}
        // closeByBackdropClick={false}
        // closeByOutsideClick={false}
        //push
        swipeToClose
        backdrop
        opened={visible}
        onSheetClose={close}
      >
        <form className="page-scrollbar" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-center h-6">
            <span className="inline-block w-12 h-[6px] rounded-[3px] bg-[#e9ebed] m-[calc(calc(24px-6px)/2)]"></span>
          </div>
          <div className="pb-safe-b">
            <div className="px-4 mt-3">
              <div className="text-xl font-medium">{watch()?.Info?.Title}</div>
              <div className="mt-1 font-light">
                Hãy thông báo cho chúng tôi biết lý do để đảm bảo quyền lợi của
                bạn.
              </div>
            </div>
            <div className="p-4">
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
                        KeyboardsHelper.setAndroid({ Type: "modal", Event: e })
                      }
                    />
                  )}
                />
              </div>
              <div className="mb-3.5 last:mb-0">
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
            </div>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export default PickerConfirm;

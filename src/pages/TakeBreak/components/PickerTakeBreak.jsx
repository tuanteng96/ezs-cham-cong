import { Button, Input, Sheet, useStore } from "framework7-react";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import KeyboardsHelper from "../../../helpers/KeyboardsHelper";
import { DatePicker, SelectPicker } from "../../../partials/forms";
import WorkTrackAPI from "../../../api/WorkTrack.api";
import moment from "moment";

const schemaConfirm = yup
  .object({
    From: yup.string().required("Chọn ngày nghỉ."),
    To: yup.string().when("Type", {
      is: (Type) => Type && Type.value !== "NGHI_NGAY",
      then: (schema) => schema.required("Chọn ngày nghỉ."),
      otherwise: (schema) => schema,
    }),
    Desc: yup.string().required("Vui lòng nhập mô tả."),
    Type: yup.object().notRequired(),
  })
  .required();

let options = [
  { label: "Nghỉ ngày", value: "NGHI_NGAY" },
  { label: "Nghỉ trong khoảng", value: "NGHI_KHOANG" },
];

function PickerTakeBreak({ children }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let { TimeClose, TimeOpen } = {
    TimeOpen: Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00",
    TimeClose: Brand?.Global?.APP?.Working?.TimeClose || "23:59:00",
  };
  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      UserID: Auth?.ID,
      From: "",
      To: "",
      Desc: "",
      Type: options[0],
    },
    resolver: yupResolver(schemaConfirm),
  });
  const [visible, setVisible] = useState(false);

  let { Type } = watch();
  const queryClient = useQueryClient();

  const takeBreakMutation = useMutation({
    mutationFn: (body) => WorkTrackAPI.addTakeBreak(body),
  });

  const onSubmit = (values) => {
    takeBreakMutation.mutate(
      {
        UserID: values.UserID,
        Desc: values.Desc,
        From:
          values?.Type?.value === "NGHI_NGAY"
            ? moment(values.From)
                .set({
                  h: TimeOpen.split(":")[0],
                  m: TimeOpen.split(":")[1],
                  s: TimeOpen.split(":")[2],
                })
                .format("DD-MM-YYYY HH:mm")
            : moment(values.From).format("DD-MM-YYYY HH:mm"),
        To:
          values?.Type?.value === "NGHI_NGAY"
            ? moment(values.From)
                .set({
                  h: TimeClose.split(":")[0],
                  m: TimeClose.split(":")[1],
                  s: TimeClose.split(":")[2],
                })
                .format("DD-MM-YYYY HH:mm")
            : moment(values.To).format("DD-MM-YYYY HH:mm"),
      },
      {
        onSettled: () => {
          queryClient
            .invalidateQueries({ queryKey: ["TakeBreakList"] })
            .then(() => {
              toast.success("Đã gửi xin nghỉ.", {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 2000,
              });
              setVisible(false);
            });
        },
      }
    );
  };

  const close = () => {
    reset();
    setVisible(false);
  };

  return (
    <>
      {children({
        open: () => setVisible(true),
        close: close,
      })}
      <Sheet
        style={{ height: "auto" }}
        swipeToClose
        //push
        backdrop
        opened={visible}
        onSheetClose={close}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center justify-center h-6">
            <span className="inline-block w-12 h-[6px] rounded-[3px] bg-[#e9ebed] m-[calc(calc(24px-6px)/2)]"></span>
          </div>
          <div className="pb-safe-b">
            <div className="px-4 mt-3">
              <div className="text-xl font-semibold">Tạo xin nghỉ</div>
              <div className="mt-1 font-light">
                Hãy nhập đầy đủ thông tin để đảm bảo quyền lợi của bạn.
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3.5 last:mb-0">
                <div className="mb-px">Loại</div>
                <Controller
                  name="Type"
                  control={control}
                  render={({ field, fieldState }) => (
                    <SelectPicker
                      placeholder="Chọn loại"
                      value={field.value}
                      options={options}
                      label="Chọn loại"
                      onChange={(val) => {
                        field.onChange(val);
                        setValue("isType", val?.value !== "NGHI_NGAY");
                        setValue("From", "", {
                          shouldValidate: false,
                          shouldDirty: false,
                        });
                        setValue("To", "", {
                          shouldValidate: false,
                          shouldDirty: false,
                        });
                      }}
                      errorMessage={fieldState?.error?.message}
                      errorMessageForce={fieldState?.invalid}
                    />
                  )}
                />
              </div>
              {Type?.value === "NGHI_NGAY" ? (
                <div className="mb-3.5 last:mb-0">
                  <div className="mb-px">Ngày nghỉ</div>
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
                        placeholder="Chọn ngày"
                        showHeader
                      />
                    )}
                  />
                </div>
              ) : (
                <>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px">Nghỉ từ</div>
                    <Controller
                      name="From"
                      control={control}
                      render={({ field, fieldState }) => (
                        <DatePicker
                          format="HH:mm, [Ngày] DD-MM-YYYY"
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          value={field.value}
                          onChange={field.onChange}
                          showHeader
                          defaultValue={moment()
                            .set({
                              h: TimeOpen.split(":")[0],
                              m: TimeOpen.split(":")[1],
                              s: TimeOpen.split(":")[2],
                            })
                            .toDate()}
                        />
                      )}
                    />
                  </div>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px">Nghỉ đến</div>
                    <Controller
                      name="To"
                      control={control}
                      render={({ field, fieldState }) => (
                        <DatePicker
                          format="HH:mm, [Ngày] DD-MM-YYYY"
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          value={field.value}
                          onChange={field.onChange}
                          showHeader
                          defaultValue={moment()
                            .set({
                              h: TimeClose.split(":")[0],
                              m: TimeClose.split(":")[1],
                              s: TimeClose.split(":")[2],
                            })
                            .toDate()}
                        />
                      )}
                    />
                  </div>
                </>
              )}

              <div className="mb-3.5 last:mb-0">
                <div className="mb-px">Lý do</div>
                <Controller
                  name="Desc"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[100px]"
                      type="textarea"
                      placeholder="Nhập lý do của bạn"
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
                  loading={takeBreakMutation.isLoading}
                  disabled={takeBreakMutation.isLoading}
                >
                  Xin nghỉ
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export default PickerTakeBreak;

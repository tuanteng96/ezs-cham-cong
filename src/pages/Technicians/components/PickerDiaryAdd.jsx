import React, { useState } from "react";
import { Button, Input, Sheet, Toggle, useStore } from "framework7-react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import KeyboardsHelper from "../../../helpers/KeyboardsHelper";
import * as yup from "yup";
import { DatePicker } from "../../../partials/forms";
import { useMutation, useQueryClient } from "react-query";
import StaffsAPI from "../../../api/Staffs.api";
import { toast } from "react-toastify";

const schemaAdd = yup
  .object({
    note: yup.string().required("Vui lòng nhập nhật ký."),
  })
  .required();

function PickerDiaryAdd({ memberid, children }) {
  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      cmd: "service_note",
      mid: memberid,
      note: "",
      public: 0,
      IsNoti: 1,
      notiDate: "",
    },
    resolver: yupResolver(schemaAdd),
  });
  const [visible, setVisible] = useState(false);
  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: (body) => StaffsAPI.addDiarys(body),
  });

  const onSubmit = (values) => {
    const data = {
      ...values,
      cmd: "service_note",
      IsNoti: values.notiDate ? 1 : 0,
    };
    addMutation.mutate(
      {
        Token: Auth.token,
        StockID: CrStocks?.ID || "",
        data,
      },
      {
        onSuccess: (data) => {
          queryClient
            .invalidateQueries({ queryKey: ["Technicians-Diary"] })
            .then(() => {
              toast.success("Thêm mới thành công.", {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 2000,
              });
              close()
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
              <div className="text-xl font-semibold text-center">
                Tạo nhật ký
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3.5 last:mb-0">
                <div className="mb-px">Ghi chú</div>
                <Controller
                  name="note"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[100px]"
                      type="textarea"
                      placeholder="Nhập ghi chú"
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
                <div className="mb-px">Ngày nhắc lịch</div>
                <Controller
                  name="notiDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      clear
                      format="HH:mm DD-MM-YYYY"
                      errorMessage={fieldState?.error?.message}
                      errorMessageForce={fieldState?.invalid}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn thời gian"
                      showHeader
                    />
                  )}
                />
                <div className="mt-2 text-xs text-muted">
                  Bỏ qua nếu không muốn nhắc lịch.
                </div>
              </div>
              <div className="flex items-center justify-between mb-5 last:mb-0">
                <span>Khách hàng xem</span>
                <Controller
                  name="public"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Toggle
                      color="blue"
                      checked={Number(field.value) === 1}
                      onChange={(e) => field.onChange(e.target.checked ? 0 : 1)}
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
                  loading={addMutation.isLoading}
                  disabled={addMutation.isLoading}
                >
                  Tạo nhật ký
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export default PickerDiaryAdd;

import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import moment from "moment";
import { Controller, useForm } from "react-hook-form";
import CourseAPI from "../../../api/Course.api";
import { useMutation } from "react-query";
import { Button, f7, Input } from "framework7-react";
import { toast } from "react-toastify";
import KeyboardsHelper from "../../../helpers/KeyboardsHelper";
import { SelectPicker } from "../../../partials/forms";
import StringHelpers from "../../../helpers/StringHelpers";

let options = [
  {
    value: 2,
    label: "Chưa tốt nghiệp",
  },
  {
    value: 1,
    label: "Đã tốt nghiệp",
  },
  {
    value: 3,
    label: "Đang tạm dừng",
  },
];

function PickerEditStudent({ children, data, refetch, params }) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      ID: 0,
      MemberID: "",
      CourseID: params.id,
      Desc: "",
      Status: "",
      OrderID: "",
      OrderItemID: "",
      Places: "",
      TotalBefore: 0,
    },
  });

  useEffect(() => {
    if (visible && data) {
      reset({
        ID: data?.ID,
        MemberID: data?.MemberID,
        CourseID: data?.CourseID,
        Desc: data?.Desc || "",
        Status: data?.Status
          ? options.filter((x) => Number(x.value) === Number(data?.Status))[0]
          : "",
        OrderID: data?.OrderID,
        OrderItemID: data?.OrderItemID,
        Places: data?.Places || "",
        TotalBefore: data?.TotalBefore,
      });
    }
  }, [data, visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const editMutation = useMutation({
    mutationFn: async (data) => {
      let rs = await CourseAPI.addEditStudentCourse(data);
      await refetch();
      return rs;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let newValues = {
      ...values,
      Status: values?.Status?.value || "",
    };
    editMutation.mutate(
      { edit: [newValues] },
      {
        onSuccess: (data) => {
          toast.success("Cập nhập thành công.", { autoClose: 300 });
          close();
          f7.dialog.close();
        },
      }
    );
  };

  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: open,
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
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[90%]"
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
                    {data?.Member?.FullName}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 overflow-auto grow">
                    <div className="text-[15px] mb-3.5">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="w-[45%] px-4 py-2.5 border text-[#6c7293] font-medium">
                              Số điện thoại
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-right border">
                              {data?.Member?.MobilePhone}
                            </td>
                          </tr>
                          <tr>
                            <td className="w-[45%] px-4 py-2.5 border text-[#6c7293] font-medium">
                              Ngày sinh
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-right border">
                              {data?.Member?.BirthDate
                                ? moment(data?.Member?.BirthDate).format(
                                    "DD-MM-YYYY"
                                  )
                                : "Không"}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border text-[#6c7293] font-medium">
                              Ký túc xá
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-right border">
                              {data?.Member?.MobilePhone}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border text-[#6c7293] font-medium">
                              Địa chỉ
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-right border">
                              {data?.Member?.HomeAddress || "Không"}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border text-[#6c7293] font-medium">
                              Buổi / Tổng
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-right border">
                              {data?.TotalCheck +
                                Number(data?.TotalBefore || 0)}
                              /{data?.Course?.Total}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border text-[#6c7293] font-medium">
                              Giá trị khoá học
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-right border">
                              {StringHelpers.formatVNDPositive(
                                data?.OrderItem?.ToPay
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 border text-[#6c7293] font-medium">
                              Nợ
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-right border">
                              {StringHelpers.formatVNDPositive(data?.RemainPay)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Trạng thái</div>
                      <Controller
                        name="Status"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            placeholder="Chọn trạng thái"
                            value={field.value}
                            options={options}
                            label="Chọn trạng thái"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <div className="font-light">Ghi chú</div>
                      <div className="mt-1">
                        <Controller
                          name="Desc"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <Controller
                              name="Desc"
                              control={control}
                              render={({ field, fieldState }) => (
                                <Input
                                  className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case text-input [&_textarea]:min-h-[100px]"
                                  type="textarea"
                                  placeholder="Nhập lý do của bạn"
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
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-0 p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={editMutation.isLoading}
                      disabled={editMutation.isLoading}
                    >
                      Cập nhập
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

export default PickerEditStudent;

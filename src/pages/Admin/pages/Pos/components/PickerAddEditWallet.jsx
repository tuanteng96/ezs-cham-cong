import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { DatePicker, SelectPicker } from "@/partials/forms";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import moment from "moment";

const schemaAdd = yup.object().shape({
  value: yup.string().required("Vui lòng nhập số tiền."),
});

const Types = [
  {
    label: "Tiền mặt",
    value: "1",
  },
  {
    label: "Chuyển khoản",
    value: "2",
  },
  {
    label: "Quẹt thẻ",
    value: "3",
  },
  {
    label: "Nạp ví không thu tiền",
    value: "-1",
  },
];

function PickerAddEditWallet({ children, data, MemberID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const { control, handleSubmit, reset, setError, watch } = useForm({
    defaultValues: {
      value: "",
      desc: "",
      MemberID: MemberID,
      MethodPayID: Types[0],
      RelPromo: "DV",
      CreateDate: "",
      ID: 0,
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (data) {
      reset({
        value: data?.Value,
        desc: data?.Desc,
        MemberID: data?.MemberID,
        MethodPayID: data?.MethodPayID
          ? Types.filter(
              (x) => Number(x.value) === Number(data?.MethodPayID)
            )[0]
          : "",
        RelPromo: "DV",
        CreateDate: data?.CreateDate,
        ID: data?.ID,
      });
    } else {
      reset();
    }
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientAddEditWalletId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: data?.MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientWalletID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientAddEditWalletId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: data?.MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientWalletID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    var bodyFormData = new FormData();
    bodyFormData.append("cmd", "add_money");
    bodyFormData.append("ID", values?.ID);
    bodyFormData.append("value", values?.value);
    bodyFormData.append("desc", values?.desc);
    bodyFormData.append("MemberID", values?.MemberID);
    bodyFormData.append("MethodPayID", values?.MethodPayID?.value);
    bodyFormData.append("RelPromo", "DV");

    if (values.CreateDate) {
      bodyFormData.append(
        "CreateDate",
        moment(values.CreateDate).format("YYYY-MM-DD HH:mm")
      );
    }

    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: ({ data }) => {
          toast.success(
            values?.ID ? "Cập nhật thành công." : "Nạp ví thành công."
          );
          close();

          window?.noti27?.TIN_NHAN &&
            window?.noti27.TIN_NHAN({
              type: values?.ID ? "EDIT_WALLET_POS" : "ADD_WALLET_POS",
              data: values,
            });
        },
      }
    );
  };

  const onDelete = () => {
    f7.dialog.confirm("Xác nhận xoá ?", () => {
      var bodyFormData = new FormData();
      bodyFormData.append("DeleteID", data?.ID);
      deleteMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
        },
        {
          onSuccess: ({ data }) => {
            toast.success("Xoá thành công.");
            close();
          },
        }
      );
    });
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
                className="absolute inset-0 bg-black/[.5] z-10"
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
                <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                  {data?.ID ? "Chỉnh sửa nạp ví" : "Nạp ví"}
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="px-4 overflow-auto grow scrollbar-modal">
                    {(!data?.ID ||
                      (data?.ID && adminTools_byStock?.hasRight)) && (
                      <>
                        {data?.ID && (
                          <div className="mb-3.5 last:mb-0">
                            <div className="mb-px">Thời gian</div>
                            <Controller
                              name="CreateDate"
                              control={control}
                              render={({
                                field: { ref, ...field },
                                fieldState,
                              }) => (
                                <DatePicker
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
                          </div>
                        )}

                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px font-light">Số tiền</div>
                          <Controller
                            name="value"
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
                                    placeholder="Nhập số tiền"
                                    value={field.value}
                                    onValueChange={(val) =>
                                      field.onChange(val.floatValue || "")
                                    }
                                    onFocus={(e) =>
                                      KeyboardsHelper.setAndroid({
                                        Type: "modal-scrollbar",
                                        Event: e,
                                      })
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
                                {fieldState?.invalid &&
                                  fieldState?.error?.message && (
                                    <div className="mt-1.5 text-xs font-light text-danger">
                                      {fieldState?.error?.message}
                                    </div>
                                  )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="mb-3.5 last:mb-0">
                          <div className="mb-px">Phương thức thanh toán</div>
                          <Controller
                            name="MethodPayID"
                            control={control}
                            render={({ field, fieldState }) => (
                              <SelectPicker
                                isClearable={false}
                                autoHeight
                                placeholder="Chọn phương thức thanh toán"
                                value={field.value}
                                options={Types.filter((x) =>
                                  !Brand?.Global?.Admin?.Pos_quan_ly?.napvi
                                    ?.napvi_khong_thu_tien
                                    ? x.value !== "-1"
                                    : x
                                )}
                                label="Phương thức thanh toán"
                                onChange={(val) => {
                                  field.onChange(val);
                                }}
                                errorMessage={fieldState?.error?.message}
                                errorMessageForce={fieldState?.invalid}
                              />
                            )}
                          />
                        </div>
                      </>
                    )}
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Ghi chú</div>
                      <Controller
                        name="desc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case"
                            type="textarea"
                            placeholder="Nhập ghi chú"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "modal-scrollbar",
                                Event: e,
                              })
                            }
                            resizable
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 p-4">
                    {data?.ID && (
                      <Button
                        onClick={onDelete}
                        type="button"
                        className="rounded-full bg-danger w-[100px]"
                        fill
                        large
                        preloader
                        loading={deleteMutation.isLoading}
                        disabled={deleteMutation.isLoading}
                      >
                        Xoá
                      </Button>
                    )}

                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={addMutation.isLoading}
                      disabled={addMutation.isLoading}
                    >
                      {data?.ID ? "Cập nhật" : "Nạp ví ngay"}
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

export default PickerAddEditWallet;

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { SelectServiceProtocol } from "@/partials/forms/select";
import { toast } from "react-toastify";
import moment from "moment";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

const schema = yup.object().shape({
  // ToMember: yup.object().required("Vui lòng chọn khách hàng chuyển nhượng."),
});

function PickerServiceRegimen({ children, data }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      services: [],
    },
    resolver: yupResolver(schema),
  });

  const { fields } = useFieldArray({
    control,
    name: "services",
  });

  useEffect(() => {
    if (data) {
      reset({
        services: data?.Services
          ? data?.Services.map((x) => ({
              ID: x.ID,
              ProdServiceID2: x.ProdServiceID2
                ? {
                    label: x.Root2Title,
                    value: x.ProdServiceID2,
                  }
                : "",
              BookDate: x.BookDate,
              ProdService2: "",
              Status: "",
              Desc: x?.Desc || "",
              Root2Title: "",
              isDisabled: x.Status === "done",
            }))
          : [],
      });
    }
  }, [visible, data]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsChangeServicesRegimen(body);
      await queryClient.invalidateQueries(["ClientServicesID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    var bodyFormData = new FormData();
    bodyFormData.append(
      "services",
      JSON.stringify(
        values.services.map((x) => ({
          ...x,
          ProdServiceID2: x?.ProdServiceID2?.value || "",
        }))
      )
    );

    changeMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhập thành công.");
        },
      }
    );
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
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[calc(100%-var(--f7-navbar-height))]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative px-4 py-5 text-xl font-semibold text-left">
                    Cài đặt phác đồ
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>

                  <div className="px-4 overflow-auto grow">
                    {fields &&
                      fields.map((item, index) => (
                        <div
                          className="mb-3.5 border shadow last:mb-0 rounded"
                          key={item.id}
                        >
                          <div className="px-4 py-4 font-medium bg-gray-100 border-b">
                            Buổi {index + 1}
                            <span className="pl-1.5">
                              (
                              {item?.BookDate
                                ? `Ngày ${moment(item.BookDate).format(
                                    "HH:mm DD/MM/YYYY"
                                  )}`
                                : "Chưa có ngày đặt lịch"}
                              )
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="mb-2 last:mb-0">
                              <Controller
                                name={`services[${index}].ProdServiceID2`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectServiceProtocol
                                    placeholderInput="Dịch vụ gốc"
                                    placeholder="Chọn dịch vụ gốc"
                                    value={field.value}
                                    label="Chọn dịch vụ gốc"
                                    onChange={(val) => {
                                      field.onChange(val);
                                    }}
                                    isFilter
                                    isClearable={true}
                                    isDisabled={item.isDisabled}
                                  />
                                )}
                              />
                            </div>
                            <div className="mb-0">
                              <Controller
                                name={`services[${index}].Desc`}
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
                                        Type: "body",
                                        Event: e,
                                      })
                                    }
                                    resizable
                                    disabled={item.isDisabled}
                                  />
                                )}
                              />
                            </div>
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
                      loading={changeMutation.isLoading}
                      disabled={changeMutation.isLoading}
                    >
                      Thực hiện
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

export default PickerServiceRegimen;

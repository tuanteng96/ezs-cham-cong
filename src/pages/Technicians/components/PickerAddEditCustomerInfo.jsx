import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Button, Input, useStore } from "framework7-react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axios from "axios";
import StaffsAPI from "@/api/Staffs.api";
import { DatePicker, SelectPicker } from "@/partials/forms";
import { UploadImages } from "@/partials/forms/files";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import { toast } from "react-toastify";
import moment from "moment";
import { RolesHelpers } from "@/helpers/RolesHelpers";

const CustomerImages = ({ name, fieldId }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="grid grid-cols-3 gap-3">
      {fields.map((item, idx) => (
        <div
          className="relative flex items-center border aspect-square"
          key={item.id}
        >
          <img
            className="object-contain w-full h-full rounded"
            src={AssetsHelpers.toAbsoluteUrl(item?.url, "")}
            alt=""
          />
          <div
            className="absolute flex items-center justify-center bg-white rounded-full shadow-lg w-7 h-7 -top-3 -right-3"
            onClick={(e) => {
              e.stopPropagation();
              remove(idx);
            }}
          >
            <XMarkIcon className="w-5 opacity-75" />
          </div>
        </div>
      ))}

      <UploadImages
        width="w-auto"
        height="h-auto"
        className="aspect-square"
        onChange={(images) => {
          if (images) {
            append({ url: `/upload/image/${images}` }); // 👈 Append object đồng nhất
          }
        }}
        size="xs"
        popoverOpen={"popover-upload-images-" + fieldId}
      />
    </div>
  );
};

function PickerAddEditCustomerInfo({
  children,
  onClose,
  onOpen,
  data,
  MemberID,
  invalidateQueries = "Technicians-Customer"
}) {
  const queryClient = useQueryClient();

  const [visible, setVisible] = useState(false);

  const Auth = useStore("Auth");
  const Brand = useStore("Brand");
  const CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const methods = useForm({
    defaultValues: {
      key: "",
      configs: [],
      CreateDate: new Date(),
    },
  });

  const { control, handleSubmit, reset, watch, setValue } = methods;

  const { fields } = useFieldArray({
    control,
    name: "configs",
  });

  let { isLoading } = useQuery({
    queryKey: [
      "Brand",
      {
        data,
        Domain: Brand?.Domain,
      },
    ],
    queryFn: async () => {
      let key = "";
      let configs = [];
      let CreateDate = new Date();

      let { data: rsConfigs } = await axios.get(
        Brand?.Domain +
          "/brand/global/json-information.json?" +
          new Date().getTime()
      );

      if (rsConfigs) {
        key = rsConfigs.key;
        configs = Array.isArray(rsConfigs.configs) ? rsConfigs.configs : [];
      }

      if (data?.ID) {
        const { data: rs } = await StaffsAPI.getCustomerInfo({
          data: { MemberID, Pi: 1, Ps: 1, ID: data.ID },
          Token: Auth.token,
        });

        if (rs.lst && rs.lst.length > 0) {
          let data = rs.lst[0].Items[0];

          if (data[key]) {
            let newConfigs = [];
            let parsedData = JSON.parse(data[key]);

            for (let config of configs) {
              let index = parsedData.findIndex((p) => p.title === config.title);
              if (index > -1) {
                newConfigs.push(parsedData[index]);
              } else {
                newConfigs.push(config);
              }
            }
            configs = newConfigs;
          }

          CreateDate = data?.CreateDate;
        }
      }

      return {
        configs,
        key,
        CreateDate,
      };
    },
    onSuccess: (rs) => {
      const fixedConfigs = (rs?.configs || []).map((c) => {
        if (c.type === "images") {
          return {
            ...c,
            value: Array.isArray(c.value)
              ? c.value.map((v) => (typeof v === "string" ? { url: v } : v))
              : [],
          };
        }
        return c;
      });
      reset({
        key: rs?.key || "",
        configs: fixedConfigs,
        CreateDate: rs?.CreateDate,
      });
    },
    enabled: visible,
  });

  const open = () => {
    setVisible(true);
    onOpen && onOpen();
  };

  let close = () => {
    setVisible(false);
    onClose && onClose();
  };

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await StaffsAPI.addEditCustomerInfo(body);
      await queryClient.invalidateQueries([invalidateQueries]);
      return data;
    },
  });

  const onSubmit = ({ configs, key, CreateDate }) => {
    let newConfigs = configs
      ? configs.map((x) => {
          let obj = { ...x };
          if (obj.type === "images") {
            obj.value = obj.value ? obj.value.map((x) => x.url) : [];
          }
          return obj;
        })
      : [];
    let dataPost = {
      ID: data?.ID || 0,
      MemberID,
      CreateDate: moment(CreateDate).format("YYYY-MM-DD HH:mm"),
    };

    dataPost[key] = JSON.stringify(newConfigs);

    updateMutation.mutate(
      {
        data: {
          arr: [dataPost],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          toast.success(
            data?.ID ? "Cập nhật thành công." : "Thêm mới thành công."
          );
          close();
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
    <FormProvider {...methods}>
      {children({
        open,
        close,
      })}
      {createPortal(
        <AnimatePresence>
          {visible && (
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
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[calc(100%-var(--f7-safe-area-top)-var(--f7-navbar-height))] w-full"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    {data?.CreateDate
                      ? moment(data?.CreateDate).format("DD-MM-YYYY")
                      : "Tạo mới thông tin"}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 overflow-auto grow">
                    {isLoading && (
                      <div className="flex items-center justify-center h-full">
                        <div role="status">
                          <svg
                            aria-hidden="true"
                            className="w-8 h-8 text-gray-200 animate-spin fill-primary"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="currentColor"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentFill"
                            />
                          </svg>
                          <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                    )}
                    {!isLoading && (
                      <>
                        {adminTools_byStock?.hasRight && (
                          <div className="mb-3.5 last:mb-0">
                            <div className="mb-px font-light">Thời gian</div>
                            <Controller
                              name="CreateDate"
                              control={control}
                              render={({ field, fieldState }) => (
                                <DatePicker
                                  format="DD-MM-YYYY"
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

                        {fields.map((item, index) => (
                          <div className="mb-3.5 last:mb-0" key={item.id}>
                            <div className="mb-1">
                              <div>
                                {item.title}
                                {item.unit && (
                                  <span className="pl-1.5">({item.unit})</span>
                                )}
                              </div>
                              {item.desc && (
                                <span className="font-light text-gray-500">
                                  {item.desc}
                                </span>
                              )}
                            </div>
                            {item.type === "input" && (
                              <Controller
                                rules={{
                                  validate: (val) => {
                                    if (item.required) {
                                      if (
                                        !val ||
                                        (Array.isArray(val) && val.length === 0)
                                      ) {
                                        return "Trường này là bắt buộc";
                                      }
                                    }
                                    return true; // hợp lệ
                                  },
                                }}
                                name={`configs[${index}].value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <Input
                                      clearButton
                                      className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                                      type="input"
                                      placeholder={item?.placeholder || ""}
                                      value={field.value}
                                      errorMessage={fieldState?.error?.message}
                                      errorMessageForce={fieldState?.invalid}
                                      onInput={field.onChange}
                                    />
                                  </div>
                                )}
                              />
                            )}

                            {item.type === "textarea" && (
                              <Controller
                                rules={{
                                  validate: (val) => {
                                    if (item.required) {
                                      if (
                                        !val ||
                                        (Array.isArray(val) && val.length === 0)
                                      ) {
                                        return "Trường này là bắt buộc";
                                      }
                                    }
                                    return true; // hợp lệ
                                  },
                                }}
                                name={`configs[${index}].value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <Input
                                    className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case"
                                    type="textarea"
                                    placeholder={item?.placeholder || ""}
                                    value={field.value}
                                    errorMessage={fieldState?.error?.message}
                                    errorMessageForce={fieldState?.invalid}
                                    onInput={field.onChange}
                                    resizable
                                  />
                                )}
                              />
                            )}

                            {item.type === "image" && (
                              <Controller
                                rules={{
                                  validate: (val) => {
                                    if (item.required) {
                                      if (
                                        !val ||
                                        (Array.isArray(val) && val.length === 0)
                                      ) {
                                        return "Trường này là bắt buộc";
                                      }
                                    }
                                    return true; // hợp lệ
                                  },
                                }}
                                name={`configs[${index}].value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <div className="grid grid-cols-3 gap-3">
                                    <UploadImages
                                      popoverOpen={
                                        "popover-upload-images-" + item.id
                                      }
                                      value={
                                        field.value
                                          ? field.value?.replace(
                                              /^\/upload\/image\//,
                                              ""
                                            )
                                          : field.value
                                      }
                                      width="w-auto"
                                      height="h-auto"
                                      className="aspect-square"
                                      onChange={(images) => {
                                        field.onChange(images);
                                      }}
                                      size="xs"
                                    />
                                  </div>
                                )}
                              />
                            )}

                            {item.type === "images" && (
                              <CustomerImages
                                name={`configs[${index}].value`}
                                data={item}
                                fieldId={item.id}
                              />
                            )}
                            {item.type === "select" && (
                              <Controller
                                rules={{
                                  validate: (val) => {
                                    if (item.required) {
                                      if (
                                        !val ||
                                        (Array.isArray(val) && val.length === 0)
                                      ) {
                                        return "Trường này là bắt buộc";
                                      }
                                    }
                                    return true; // hợp lệ
                                  },
                                }}
                                name={`configs[${index}].value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <>
                                    <SelectPicker
                                      isMulti={item.multiple}
                                      placeholder={item.placeholder}
                                      value={
                                        field.value
                                          ? field.value.split(",").map((x) => ({
                                              label: x,
                                              value: x,
                                            }))
                                          : ""
                                      }
                                      options={
                                        item.options
                                          ? item.options.map((x) => ({
                                              label: x,
                                              value: x,
                                            }))
                                          : []
                                      }
                                      label={item.placeholder}
                                      onChange={(val) => {
                                        if (item.multiple) {
                                          field.onChange(
                                            val ? val.map((x) => x.value) : []
                                          );
                                        } else {
                                          field.onChange(val?.value || "");
                                        }
                                      }}
                                      errorMessage={fieldState?.error?.message}
                                      errorMessageForce={fieldState?.invalid}
                                    />
                                  </>
                                )}
                              />
                            )}
                            {item.type === "checkbox" && (
                              <Controller
                                rules={{
                                  validate: (val) => {
                                    if (item.required) {
                                      if (
                                        !val ||
                                        (Array.isArray(val) && val.length === 0)
                                      ) {
                                        return "Trường này là bắt buộc";
                                      }
                                    }
                                    return true; // hợp lệ
                                  },
                                }}
                                name={`configs[${index}].value`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <div>
                                      {item.options.map((x, i) => (
                                        <div
                                          className="flex gap-2.5 mb-2.5 last:mb-0"
                                          key={i}
                                          onClick={() => {
                                            if (item?.multiple) {
                                              let newValues = field.value
                                                ? (Array.isArray(field.value)
                                                    ? field.value
                                                    : field.value.split(",")
                                                  ).split(",")
                                                : [];
                                              let index = newValues.findIndex(
                                                (c) => x === c
                                              );
                                              if (index > -1) {
                                                newValues.filter(
                                                  (c) => x !== c
                                                );
                                              } else {
                                                newValues.push(x);
                                              }
                                              field.onChange(newValues);
                                            } else {
                                              field.onChange([x]);
                                            }
                                          }}
                                        >
                                          <div
                                            className={clsx(
                                              "flex items-center justify-center w-5 h-5 rounded",
                                              field.value &&
                                                (Array.isArray(field.value)
                                                  ? field.value
                                                  : field.value.split(",")
                                                ).includes(x)
                                                ? "bg-primary"
                                                : "bg-gray-200"
                                            )}
                                          >
                                            <CheckIcon
                                              className={clsx(
                                                "w-4 text-white",
                                                field.value &&
                                                  (Array.isArray(field.value)
                                                    ? field.value
                                                    : field.value.split(",")
                                                  ).includes(x)
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                          </div>
                                          <div>{x}</div>
                                        </div>
                                      ))}
                                    </div>
                                    {fieldState?.invalid &&
                                      fieldState?.error?.message && (
                                        <div className="text-danger text-[0.75rem] mt-[0.375rem]">
                                          {fieldState?.error?.message}
                                        </div>
                                      )}
                                  </div>
                                )}
                              />
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {(!data?.ID ||
                    (data?.ID &&
                      (adminTools_byStock?.hasRight ||
                        moment(data.CreateDate).format("DD-MM-YYYY") ===
                          moment().format("DD-MM-YYYY")))) && (
                    <div className="p-4">
                      <Button
                        type="submit"
                        className="rounded-full bg-app"
                        fill
                        large
                        preloader
                        loading={updateMutation.isLoading || isLoading}
                        disabled={updateMutation.isLoading || isLoading}
                      >
                        {data?.ID ? "Lưu thay đổi" : "Thêm mới"}
                      </Button>
                    </div>
                  )}
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </FormProvider>
  );
}

export default PickerAddEditCustomerInfo;

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import { Button } from "framework7-react";
import {
  SelectClients,
  SelectMembersServices,
  SelectPicker,
} from "@/partials/forms/select";
import clsx from "clsx";
import { Disclosure } from "@/partials/components";

const StatusMembers = [
  {
    value: "KHACH_CU",
    label: "Khách cũ",
  },
  {
    value: "KHACH_VANG_LAI_CO_TK",
    label: "Khách vãng lai ( Có tài khoản )",
  },
  {
    value: "KHACH_MOI",
    label: "Khách vãng lai ( Khách mới )",
  },
];

const StatusBooks = [
  {
    value: "DA_CHON",
    label: "Đã chọn nhân viên",
  },
  {
    value: "CHUA_CHON",
    label: "Chưa chọn nhân viên",
  },
];

const StatusAtHome = [
  {
    value: "TAI_NHA",
    label: "Tại nhà",
  },
  {
    value: "TAI_SPA",
    label: "Tại Spa",
  },
];

const StatusArr = [
  {
    value: "XAC_NHAN",
    label: "Đã xác nhận",
    color: "#3699FF",
    bg: "#E1F0FF",
  },
  {
    value: "XAC_NHAN_TU_DONG",
    label: "Đặt lịch dự kiến",
    color: "#17C653",
    bg: "#E4FFED",
  },
  {
    value: "CHUA_XAC_NHAN",
    label: "Chưa xác nhận",
    color: "#FFA800",
    bg: "#FFF4DE",
  },
  {
    value: "KHACH_KHONG_DEN",
    label: "Khách không đến",
    color: "#F64E60",
    bg: "#FFE2E5",
  },
  {
    value: "TU_CHOI",
    label: "Khách hủy lịch",
    color: "#F64E60",
    bg: "#FFE2E5",
  },
  {
    value: "KHACH_DEN",
    label: "Khách có đến",
    color: "#8950FC",
    bg: "#EEE5FF",
  },
  {
    value: "KHACH_DEN",
    label: "Khách có đến",
    color: "#8950FC",
    bg: "#EEE5FF",
  },
  {
    value: "DANG_THUC_HIEN",
    label: "Đang thực hiện",
    color: "#1bc5bd",
    bg: "#C9F7F5",
  },
  {
    value: "THUC_HIEN_XONG",
    label: "Thực hiện xong",
    color: "#92929e",
    bg: "#EBEDF3",
  },
];

function PickerFilter({ children, initialValues, TagsList, onChange }) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      MemberIDs: "",
      UserIDs: "",
      status:
        "XAC_NHAN,XAC_NHAN_TU_DONG,CHUA_XAC_NHAN,DANG_THUC_HIEN,THUC_HIEN_XONG",
      StatusAtHome: "",
      StatusBook: "",
      StatusMember: "",
      Tags: "",
    },
  });

  useEffect(() => {
    visible && reset(initialValues);
  }, [initialValues, visible]);

  const close = () => {
    setVisible(false);
  };

  const onSubmit = (values) => {
    onChange(values);
    close();
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
                className="relative z-20 bg-[var(--f7-page-bg-color)] rounded-t-[var(--f7-sheet-border-radius)] h-[90%]"
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
                    Bộ lọc
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 overflow-auto grow">
                    <Disclosure initialState={false}>
                      {({ isOpen, toggle }) => (
                        <div className="mb-4 bg-white rounded-lg last:mb-0">
                          <div
                            className="flex items-center justify-between px-4 py-4"
                            onClick={toggle}
                          >
                            <div className="font-medium text-[15px]">
                              Theo khách hàng
                            </div>
                            <div>
                              <ChevronDownIcon
                                className={clsx(
                                  "w-5 text-gray-500 transition-all",
                                  isOpen && "rotate-180"
                                )}
                              />
                            </div>
                          </div>

                          <div className="px-4 pt-1 pb-5">
                            <div className="mb-3.5 last:mb-0">
                              <div className="mb-px">Khách hàng</div>
                              <Controller
                                name="MemberIDs"
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectClients
                                    placeholderInput="Tên khách hàng"
                                    placeholder="Chọn khách hàng"
                                    value={field.value}
                                    label="Chọn khách hàng"
                                    onChange={(val) => {
                                      field.onChange(val);
                                    }}
                                    isFilter
                                    isMulti
                                  />
                                )}
                              />
                            </div>
                            <div className="mb-3.5 last:mb-0">
                              <div className="mb-px">Nhân viên</div>
                              <Controller
                                name="UserIDs"
                                control={control}
                                render={({ field, fieldState }) => (
                                  <SelectMembersServices
                                    placeholderInput="Tên nhân viên"
                                    placeholder="Chọn nhân viên"
                                    value={field.value}
                                    label="Chọn nhân viên"
                                    onChange={(val) => {
                                      field.onChange(val);
                                    }}
                                    isFilter
                                    isMulti
                                  />
                                )}
                              />
                            </div>
                            {isOpen && (
                              <>
                                <div className="mb-3.5 last:mb-0">
                                  <div className="mb-px">Loại khách hàng</div>
                                  <Controller
                                    name="StatusMember"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPicker
                                        placeholder="Chọn loại khách hàng"
                                        value={field.value}
                                        options={StatusMembers}
                                        label="Chọn loại khách hàng"
                                        onChange={(val) => {
                                          field.onChange(val);
                                        }}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                      />
                                    )}
                                  />
                                </div>
                                <div className="mb-3.5 last:mb-0">
                                  <div className="mb-px">Loại nhân viên</div>
                                  <Controller
                                    name="StatusBook"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPicker
                                        placeholder="Chọn loại nhân viên"
                                        value={field.value}
                                        options={StatusBooks}
                                        label="Chọn loại nhân viên"
                                        onChange={(val) => {
                                          field.onChange(val);
                                        }}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                      />
                                    )}
                                  />
                                </div>
                                <div className="mb-3.5 last:mb-0">
                                  <div className="mb-px">Loại thực hiện</div>
                                  <Controller
                                    name="StatusAtHome"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPicker
                                        placeholder="Chọn loại thực hiện"
                                        value={field.value}
                                        options={StatusAtHome}
                                        label="Chọn loại thực hiện"
                                        onChange={(val) => {
                                          field.onChange(val);
                                        }}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                      />
                                    )}
                                  />
                                </div>
                                <div className="mb-3.5 last:mb-0">
                                  <div className="mb-px">Tags</div>
                                  <Controller
                                    name="Tags"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPicker
                                        placeholder="Chọn tags"
                                        value={field.value}
                                        options={TagsList}
                                        label="Chọn tags"
                                        onChange={(val) => {
                                          field.onChange(val);
                                        }}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                      />
                                    )}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </Disclosure>
                    <Disclosure initialState={true}>
                      {({ isOpen, toggle }) => (
                        <div className="mb-4 bg-white rounded-lg last:mb-0">
                          <div
                            className="flex items-center justify-between px-4 py-4 mb-2"
                            onClick={toggle}
                          >
                            <div className="font-medium text-[15px]">
                              Theo trạng thái
                            </div>
                            <div>
                              <ChevronDownIcon
                                className={clsx(
                                  "w-5 text-gray-500 transition-all",
                                  isOpen && "rotate-180"
                                )}
                              />
                            </div>
                          </div>
                          {isOpen && (
                            <div>
                              <Controller
                                name="status"
                                control={control}
                                render={({ field, fieldState }) => (
                                  <div className="mb-3.5 last:mb-0">
                                    <div className="flex flex-col gap-2">
                                      {StatusArr &&
                                        StatusArr.slice(0, 6).map(
                                          (status, index) => (
                                            <div
                                              className="relative flex items-center gap-4 px-4 pb-3 mb-1 last:after:hidden after:content-[''] after:w-[calc(100%-30px)] after:h-[1px] after:bg-[var(--f7-page-bg-color)] after:absolute after:right-0 after:bottom-0"
                                              key={index}
                                              onClick={() => {
                                                let newValues = field.value
                                                  ? field.value.split(",")
                                                  : [];

                                                if (
                                                  newValues.includes(
                                                    status.value
                                                  )
                                                ) {
                                                  newValues = newValues.filter(
                                                    (x) => x !== status.value
                                                  );
                                                } else {
                                                  newValues.push(status.value);
                                                }

                                                field.onChange(
                                                  newValues.toString()
                                                );
                                              }}
                                            >
                                              <div
                                                className="w-[8px] h-[8px] rounded-full"
                                                style={{
                                                  backgroundColor: status.color,
                                                }}
                                              ></div>
                                              <div className={clsx("flex-1")}>
                                                {status.label}
                                              </div>
                                              <div
                                                className={clsx(
                                                  "flex items-center justify-center w-5 h-5 rounded",
                                                  field.value &&
                                                    field.value
                                                      .split(",")
                                                      .includes(status.value)
                                                    ? "bg-primary"
                                                    : "bg-gray-200"
                                                )}
                                              >
                                                <CheckIcon
                                                  className={clsx(
                                                    "w-4 text-white",
                                                    field.value &&
                                                      field.value
                                                        .split(",")
                                                        .includes(status.value)
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  )}
                                                />
                                              </div>
                                            </div>
                                          )
                                        )}
                                    </div>
                                  </div>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Disclosure>
                    <Disclosure initialState={true}>
                      {({ isOpen, toggle }) => (
                        <div className="mb-4 bg-white rounded-lg last:mb-0">
                          <div
                            className="flex items-center justify-between px-4 py-4"
                            onClick={toggle}
                          >
                            <div className="font-medium text-[15px">
                              Lịch thực hiện
                            </div>
                            <div>
                              <ChevronDownIcon
                                className={clsx(
                                  "w-5 text-gray-500 transition-all",
                                  isOpen && "rotate-180"
                                )}
                              />
                            </div>
                          </div>
                          {isOpen && (
                            <div className="mt-2">
                              <Controller
                                name="status"
                                control={control}
                                render={({ field, fieldState }) => (
                                  <div className="mb-3.5 last:mb-0">
                                    <div className="flex flex-col gap-2">
                                      {StatusArr &&
                                        StatusArr.slice(
                                          7,
                                          StatusArr.length
                                        ).map((status, index) => (
                                          <div
                                            className="relative flex items-center gap-4 px-4 pb-3 mb-1 last:after:hidden after:content-[''] after:w-[calc(100%-30px)] after:h-[1px] after:bg-[var(--f7-page-bg-color)] after:absolute after:right-0 after:bottom-0"
                                            key={index}
                                            onClick={() => {
                                              let newValues = field.value
                                                ? field.value.split(",")
                                                : [];

                                              if (
                                                newValues.includes(status.value)
                                              ) {
                                                newValues = newValues.filter(
                                                  (x) => x !== status.value
                                                );
                                              } else {
                                                newValues.push(status.value);
                                              }

                                              field.onChange(
                                                newValues.toString()
                                              );
                                            }}
                                          >
                                            <div
                                              className="w-[8px] h-[8px] rounded-full"
                                              style={{
                                                backgroundColor: status.color,
                                              }}
                                            ></div>
                                            <div className={clsx("flex-1")}>
                                              {status.label}
                                            </div>
                                            <div
                                              className={clsx(
                                                "flex items-center justify-center w-5 h-5 rounded",
                                                field.value &&
                                                  field.value
                                                    .split(",")
                                                    .includes(status.value)
                                                  ? "bg-primary"
                                                  : "bg-gray-200"
                                              )}
                                            >
                                              <CheckIcon
                                                className={clsx(
                                                  "w-4 text-white",
                                                  field.value &&
                                                    field.value
                                                      .split(",")
                                                      .includes(status.value)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Disclosure>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4">
                    <Button
                      type="button"
                      className="text-black bg-white rounded-full"
                      fill
                      large
                      preloader
                      onClick={() =>
                        reset({
                          MemberIDs: "",
                          UserIDs: "",
                          status:
                            "XAC_NHAN,XAC_NHAN_TU_DONG,CHUA_XAC_NHAN,DANG_THUC_HIEN,THUC_HIEN_XONG",
                          StatusAtHome: "",
                          StatusBook: "",
                          StatusMember: "",
                          Tags: "",
                        })
                      }
                    >
                      Cài lại
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                    >
                      Áp dụng
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

export default PickerFilter;

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { SelectMembersServices } from "@/partials/forms/select";
import { toast } from "react-toastify";
import { DatePicker, SelectPicker } from "@/partials/forms";
import moment from "moment";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

const schema = yup.object().shape({
  // ToMember: yup.object().required("Vui lòng chọn khách hàng chuyển nhượng."),
});

function PickerServiceShiftAss({ children, data, MemberID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [visiblePreview, setVisiblePreview] = useState(false);
  const [schedules, setSchedules] = useState([]);

  let { Services } = data;
  let Unused = Services?.filter(
    (x) => x.Status !== "done" && !x?.BookDate
  ).length;

  let Auth = useStore("Auth");
  let Stocks = useStore("Stocks");
  let CrStocks = useStore("CrStocks");

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      type: 1,
      n: "", // số buổi còn
      num: "",
      skip: "",
      nday: 2, // số ngày
      sday: "", // Ngày bắt đầu
      Frees: [],
      staff: "",
      StockID: CrStocks
        ? { ...CrStocks, label: CrStocks?.Title, value: CrStocks?.ID }
        : "",
      OrderItemID: data?.OrderItem?.ID,
      ProdServiceID: data?.Product?.ID,
      MemberID: MemberID,
    },
    resolver: yupResolver(schema),
  });

  const { fields } = useFieldArray({
    control,
    name: "Frees",
  });

  useEffect(() => {
    if (data) {
      reset({
        type: 1,
        n: "",
        num: "",
        skip: "",
        nday: 2,
        sday: "",
        Frees: [],
        staff: "",
        StockID: CrStocks
          ? { ...CrStocks, label: CrStocks?.Title, value: CrStocks?.ID }
          : "",
        OrderItemID: data?.OrderItem?.ID,
        ProdServiceID: data?.Product?.ID,
        MemberID: MemberID,
      });
    }
  }, [visible]);

  useQuery({
    queryKey: ["ClientServicesShiftFree", { MemberID }],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "service_fee");
      bodyFormData.append("MemberID", MemberID);

      let rs = await AdminAPI.clientsChangeServicesItem({
        data: bodyFormData,
        Token: Auth?.token,
        cmd: "service_fee",
      });

      return rs?.data?.length > 0 ? rs?.data[0] : { Fee: null };
    },
    onSuccess: ({ Fee }) => {
      if (Fee) {
        let newFee = Fee.filter((x) => x.Remain > 0);
        if (newFee.length > 0) {
          newFee = newFee.map((x) => ({
            ...x,
            Use: {
              label: "Không sử dụng",
              value: "-1",
            },
            Remains: Array.from({ length: x.Remain + 1 }, (_, i) => ({
              label: i === 0 ? "Không sử dụng" : i,
              value: i === 0 ? "-1" : i,
            })),
          }));
          setValue("Frees", newFee);
        }
      }
    },
    enabled: visible,
  });

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const onClosePreview = () => {
    setSchedules([]);
    setVisiblePreview(false);
  };

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsChangeServicesItem(body);
      await queryClient.invalidateQueries(["ClientServicesID"]);
      return data;
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsChangeServicesItem(body);
      return data;
    },
  });

  const onPerformShift = () => {
    let { staff, StockID, Frees } = watch();
    let dataShift = [];
    for (let [index, schedule] of schedules.entries()) {
      if (schedule?.Date) {
        dataShift.push([Services[index].ID, schedule.Date]);
      }
    }

    var bodyFormData = new FormData();
    bodyFormData.append("cmd", "book_nd_service");
    bodyFormData.append("data", JSON.stringify(dataShift));

    if (staff && staff.length > 0) {
      for (let s of staff) {
        bodyFormData.append("staff[]", s?.value);
      }
    }
    if (Frees && Frees.length > 0) {
      bodyFormData.append(
        "fee",
        JSON.stringify(
          Frees.map((x) => ({
            Count: x.Use?.value,
            Title: x.Title,
          }))
        )
      );
    }
    bodyFormData.append("StockID", StockID?.value);
    bodyFormData.append("status", "doing");

    changeMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        cmd: "book_nd_service",
      },
      {
        onSuccess: ({ data }) => {
          if (data?.error) {
            toast.error(data?.error);
          } else {
            toast.success("Giao ca cả liệu trình thành công.");
            onClosePreview();
            close();
            reset();
          }
        },
      }
    );
  };

  const onSubmit = (values) => {
    var bodyFormData = new FormData();
    bodyFormData.append("cmd", "pre_book");
    bodyFormData.append("n", Unused);
    bodyFormData.append("type", values?.type);
    bodyFormData.append("skip", values?.skip);
    bodyFormData.append("nday", values?.nday);
    bodyFormData.append(
      "sday",
      values?.sday ? moment(values?.sday).format("DD/MM/YYYY HH:mm") : ""
    );

    previewMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        cmd: "pre_book",
      },
      {
        onSuccess: ({ data }) => {
          setSchedules([
            ...Services.slice(0, Services.length - Unused),
            ...data,
          ]);
          setVisiblePreview(true);
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
                className="absolute inset-0 bg-black/[.5] z-10"
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
                    Giao ca liệu trình
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>

                  <div className="px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="grid grid-cols-3 gap-3">
                        <Controller
                          name="type"
                          control={control}
                          render={({ field, fieldState }) => (
                            <>
                              {[
                                "Giao ca 2,4,6 hàng tuần",
                                "Giao ca 3,5,7 hàng tuần",
                                "Giao ca tuần tự sau (n) ngày",
                              ].map((x, i) => (
                                <div
                                  className={clsx(
                                    "p-2 border rounded transition-all",
                                    i + 1 === field.value &&
                                      "border-primary text-primary"
                                  )}
                                  onClick={() => {
                                    i + 1 !== field.value &&
                                      field.onChange(i + 1);
                                  }}
                                  key={i}
                                >
                                  <div className="text-center">{x}</div>
                                </div>
                              ))}
                            </>
                          )}
                        />
                      </div>
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Số ngày</div>
                      <Controller
                        name="nday"
                        control={control}
                        render={({ field, fieldState }) => (
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
                              thousandSeparator={false}
                              placeholder="Số buổi"
                              value={field.value}
                              onValueChange={(val) =>
                                field.onChange(val.floatValue || "")
                              }
                            />
                            {field.value ? (
                              <div
                                className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                onClick={() => field.onChange("")}
                              >
                                <XMarkIcon className="w-5" />
                              </div>
                            ) : (
                              <></>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Ngày bắt đầu</div>
                      <Controller
                        name="sday"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DatePicker
                            format="HH:mm DD-MM-YYYY"
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Chọn thời gian"
                            showHeader
                            clear
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Loại trừ các ngày</div>
                      <Controller
                        name="desc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case"
                            type="textarea"
                            placeholder="Nhập các ngày loại trừ"
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
                          />
                        )}
                      />
                      <div className="mt-1.5 text-gray-400 text-sm font-light">
                        Nhập T7:thứ 7, CN:Chủ nhật, 23:Ngày 23
                      </div>
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Nhân viên</div>
                      <Controller
                        name="staff"
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
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Cơ sở</div>
                      <Controller
                        name="StockID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            placeholder="Chọn cơ sở"
                            value={field.value}
                            options={Stocks}
                            label="Cơ sở"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            isClearable={false}
                          />
                        )}
                      />
                    </div>
                    {fields && fields.length > 0 && (
                      <div className="mb-3.5 last:mb-0">
                        <div className="mb-px">Phụ phí</div>
                        <div>
                          {fields.map((item, index) => (
                            <div className="mb-2 last:mb-0" key={item.id}>
                              <div className="mb-px text-gray-500">
                                {item.Title}
                              </div>
                              <div>
                                <Controller
                                  name={`Frees[${index}].Use`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <SelectPicker
                                      isClearable={false}
                                      placeholder="Số lượng"
                                      value={field.value}
                                      options={item?.Remains || []}
                                      label="Số lượng"
                                      onChange={(val) => {
                                        field.onChange(val || null);
                                      }}
                                      errorMessage={fieldState?.error?.message}
                                      errorMessageForce={fieldState?.invalid}
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={previewMutation.isLoading}
                      disabled={previewMutation.isLoading || Unused === 0}
                    >
                      Tiếp tục
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
        {visiblePreview &&
          createPortal(
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClosePreview}
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
                    Dự kiến lịch trình
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={onClosePreview}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>

                  <div className="px-4 overflow-auto grow">
                    <div className="grid grid-cols-4 gap-3">
                      {schedules.map((item, idx) => (
                        <div
                          className={clsx(
                            "relative flex items-center justify-center text-white rounded aspect-square shadow",
                            item?.BookDate &&
                              item?.Status === "done" &&
                              "bg-[#808080]",
                            !item?.BookDate && "bg-primary",
                            item?.BookDate &&
                              item?.Status !== "done" &&
                              "bg-success"
                          )}
                          key={idx}
                        >
                          {item?.Status === "done" && (
                            <div className="absolute bottom-1.5 right-1.5">
                              ✔
                            </div>
                          )}
                          {item?.Status === "done" && (
                            <div className="absolute text-xs top-1 left-1 font-lato">
                              {moment(item?.UseDate).format("DD-MM")}
                            </div>
                          )}
                          {item?.Status !== "done" && item?.BookDate && (
                            <div className="absolute text-xs top-1 left-1 font-lato">
                              {moment(item?.BookDate).format("DD-MM")}
                            </div>
                          )}
                          {item?.Date && (
                            <div className="absolute text-xs bottom-1 left-1 font-lato">
                              {moment(item?.Date, "DD/MM/YYYY HH:mm").format(
                                "HH:mm"
                              )}
                            </div>
                          )}
                          {item?.Date && (
                            <div className="absolute text-xs top-1 left-1 font-lato">
                              {moment(item?.Date, "DD/MM/YYYY HH:mm").format(
                                "DD-MM-YYYY"
                              )}
                            </div>
                          )}

                          <div className="text-lg font-semibold font-lato">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      onClick={onPerformShift}
                      type="button"
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

export default PickerServiceShiftAss;

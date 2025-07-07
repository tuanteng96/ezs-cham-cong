import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dom7 from "dom7";
import StringHelpers from "@/helpers/StringHelpers";
import clsx from "clsx";
import NoFound from "@/components/NoFound";
import moment from "moment";

const schemaAdd = yup
  .object({
    //vcode: yup.string().required("Vui lòng nhập mã giảm giá."),
  })
  .required();

function PickerDiscountCodeOrder({
  children,
  Order,
  CheckIn,
  invalidateQueries,
}) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  let inputRef = useRef(null);

  const { control, handleSubmit, reset, setError, watch, setValue } = useForm({
    defaultValues: {
      //vcode: "",
      VoucherCode: "",
      VoucherCheck: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (!visible) {
      reset({
        //vcode: "",
        VoucherCode: "",
        VoucherCheck: "",
      });
    } else {
      reset({ VoucherCheck: Order?.VoucherCode || "" });
    }
  }, [visible]);

  const { data, isFetching } = useQuery({
    queryKey: ["OrderListVoucherManageID"],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsOrderGetVouchers({
        MemberID: Order?.Member?.ID,
        Token: Auth.token,
      });

      let newData = data?.data ? { ...data?.data } : null;
      if (newData.danh_sach) {
        let index = newData.danh_sach.findIndex(
          (x) => x.ma === Order?.VoucherCode
        );
        if (index > -1) {
          let record = newData.danh_sach[index];
          newData.danh_sach.splice(index, 1);
          newData.danh_sach = [record, ...newData.danh_sach];
        }
      }
      return newData || null;
    },
    enabled: visible,
  });

  // useEffect(() => {
  //   if (visible && inputRef?.current?.el) {
  //     Dom7(inputRef?.current?.el).find("input").focus();
  //   }
  // }, [inputRef, visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsOrderUpdateId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: Order?.Member?.ID,
        Token: Auth.token,
      });
      if (!data?.data?.data?.error) {
        if (invalidateQueries) {
          await Promise.all(
            invalidateQueries.map((key) => queryClient.invalidateQueries([key]))
          );
        } else {
          await queryClient.invalidateQueries(["OrderManageID"]);
          await queryClient.invalidateQueries(["ClientManageID"]);
        }
      }

      return data;
    },
  });

  const useVoucherMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsOrderUseVoucherMinigame(body);
      if (!data?.data?.data?.error) {
        if (invalidateQueries) {
          await Promise.all(
            invalidateQueries.map((key) => queryClient.invalidateQueries([key]))
          );
        } else {
          await queryClient.invalidateQueries(["OrderManageID"]);
        }
      }

      await queryClient.invalidateQueries(["ClientManageID"]);

      return data;
    },
  });

  const onSubmit = ({ VoucherCheck, VoucherCode }) => {
    let vcode = VoucherCode || VoucherCheck;
    var bodyFormData = new FormData();
    bodyFormData.append("CheckInID", CheckIn?.ID);
    bodyFormData.append("setvcode", 1);
    bodyFormData.append("vcode", vcode);
    bodyFormData.append("THANH_TOAN_TUY_CHON_DUYET_THUONG", 0);

    addMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.data?.error) {
            setError("VoucherCode", {
              type: "Server",
              message:
                "Mã giảm giá không hợp lệ hoặc đã hết hạn." ||
                data?.data?.error,
            });
          } else {
            toast.success("Áp dụng mã giảm giá thành công.");
            close();

            if (data?.data?.prePayedValue) {
              f7.dialog
                .create({
                  title: "Đơn hàng đã thay đổi",
                  content: `Tất cả các khoản đã thanh toán có giá trị <span class="text-danger font-lato font-bold text-[15px]">${StringHelpers.formatVND(
                    data?.data?.prePayedValue
                  )}</span> đã bị xoá. Vui lòng thực hiện thanh toán lại !`,
                  buttons: [
                    {
                      text: "Đóng",
                      close: true,
                    },
                  ],
                })
                .open();
            }
          }
        },
      }
    );
  };

  const UseVoucherMiniGame = (item) => {
    f7.dialog.confirm(`Xác nhận sử dụng ${item.Content} ?`, () => {
      f7.dialog.preloader("Đang xử lý ...");
      useVoucherMutation.mutate(
        {
          data: {
            arr: [
              {
                ID: item.ID,
                Status: 3,
                OrderID: CheckIn?.OrderCheckInID,
                UsedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
              },
            ],
          },
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            toast.success("Voucher đã được sử dụng thành công.");
            close();
          },
        }
      );
    });
  };

  const checkDateDiff = (dateEnd) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date();
    const secondDate = new Date(dateEnd);
    const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    return diffDays;
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  let { VoucherCheck } = watch();

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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[calc(100%-var(--f7-navbar-height))]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Mã giảm giá
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 border-b">
                    <Controller
                      name="VoucherCode"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          ref={inputRef}
                          clearButton
                          className="[&_input]:rounded [&_input]:capitalize [&_input]:placeholder:normal-case"
                          type="input"
                          placeholder="Nhập mã giảm giá"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onInput={(e) => {
                            field.onChange(e);
                            setValue("VoucherCheck", "");
                          }}
                        />
                      )}
                    />
                  </div>
                  {isFetching && (
                    <div
                      role="status"
                      className={clsx(
                        "grow left-0 flex items-center justify-center w-full transition h-full top-0 z-10 bg-white/50"
                      )}
                    >
                      <svg
                        aria-hidden="true"
                        className="w-8 h-8 mr-2 text-gray-300 animate-spin dark:text-gray-600 fill-blue-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className="fill-muted"
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
                  )}
                  {!isFetching && (
                    <div className="px-4 pt-4 overflow-auto grow">
                      {(!data ||
                        (data?.contactMiniGame?.length === 0 &&
                          data?.danh_sach?.length === 0)) && (
                        <NoFound
                          Title="Không có kết quả nào."
                          Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                        />
                      )}

                      {data &&
                        (data?.contactMiniGame?.length > 0 ||
                          data?.danh_sach?.length > 0) && (
                          <>
                            {data?.contactMiniGame.map((item, index) => (
                              <div
                                className={clsx(
                                  "flex border rounded mb-3.5 last:mb-0 p-4"
                                )}
                                key={index}
                                onClick={() => UseVoucherMiniGame(item)}
                              >
                                <div className="flex-1">
                                  <div className="font-semibold uppercase">
                                    MiniGame {item?.Title}
                                  </div>
                                  <div className="leading-5 border inline-block border-primary text-primary px-2 py-1 rounded text-[13px] mt-2 mb-1.5">
                                    {item.Content}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <div>
                                      HSD:
                                      <span className="pl-1.5">
                                        {item.EndDate
                                          ? moment(item.EndDate).format(
                                              "HH:mm DD-MM-YYYY"
                                            )
                                          : "Không giới hạn"}
                                      </span>
                                    </div>
                                    <div className="px-3 py-1 text-white rounded bg-success">
                                      Sử dụng
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {data?.danh_sach.map((item, index) => (
                              <div
                                className={clsx(
                                  "flex border rounded mb-3.5 last:mb-0 p-4"
                                )}
                                onClick={() => {
                                  setValue("VoucherCode", "");
                                  setValue(
                                    "VoucherCheck",
                                    VoucherCheck === item.ma ? "" : item.ma
                                  );
                                }}
                                key={index}
                              >
                                <div className="flex-1 pr-4">
                                  <div className="font-semibold uppercase">
                                    Mã {item?.ma}
                                  </div>
                                  {console.log(item)}
                                  <div className="border inline-block border-primary text-primary px-2 py-px rounded text-[13px] leading-4 mt-2 mb-1.5">
                                    {item?.Voucher?.ValueType === 2
                                      ? "Đồng giá"
                                      : "Giảm tối đa"}
                                    {item?.gia_tri?.Phan_tram !== 0 ? (
                                      <span className="font-lato font-bold pl-1.5">
                                        {item.gia_tri.Phan_tram}%
                                      </span>
                                    ) : (
                                      <span className="pl-1.5">
                                        <span className="font-lato font-bold pl-1.5">
                                          {StringHelpers.formatVND(
                                            item.gia_tri.Tien
                                          )}
                                        </span>
                                        <span>đ</span>
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    HSD:
                                    <span className="pl-1.5">
                                      {item.ngay === null ? (
                                        "Không giới hạn"
                                      ) : (
                                        <>
                                          {moment(item.ngay.To).format(
                                            "HH:MM DD-MM-YYYY"
                                          )}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center w-6">
                                  <div
                                    className={clsx(
                                      "w-6 h-6 rounded-full border relative",
                                      VoucherCheck === item.ma
                                        ? "bg-primary border-primary"
                                        : "border-gray-300"
                                    )}
                                  >
                                    {VoucherCheck === item.ma && (
                                      <CheckIcon className="absolute w-4 text-white top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                    </div>
                  )}
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={addMutation.isLoading}
                      disabled={addMutation.isLoading}
                    >
                      Áp dụng ngay
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

export default PickerDiscountCodeOrder;

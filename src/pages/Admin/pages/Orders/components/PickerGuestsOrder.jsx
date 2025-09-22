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
import { NumericFormat } from "react-number-format";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

const schemaAdd = yup
  .object({
    //vcode: yup.string().required("Vui lòng nhập mã giảm giá."),
  })
  .required();

function PickerGuestsOrder({ children, CheckInID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  let inputRef = useRef(null);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      Guest: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  useEffect(() => {
    if (!visible) {
      reset({
        Guest: "",
      });
    } else {
      reset({ Guest: CheckInID?.GuestCount });
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
      let data = await AdminAPI.clientsUpdateGuestOrderId(body);
      await queryClient.invalidateQueries(["OrderManageID"]);
      return data;
    },
  });

  const onSubmit = ({ Guest }) => {
    addMutation.mutate(
      {
        data: JSON.stringify({
          CheckInID: CheckInID?.ID,
          Count: Guest,
        }),
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhật thành công.");
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
    <>
      {children({ open, close })}
      {createPortal(
        <AnimatePresence initial={false}>
          {visible && (
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
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Số lượng khách
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 scrollbar-modal">
                    <Controller
                      getInputRef={inputRef}
                      name="Guest"
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
                            thousandSeparator={true}
                            placeholder="Nhập số khách"
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
                          <div className="absolute top-0 right-0 flex h-full">
                            {field.value ? (
                              <div
                                className="flex items-center justify-center w-12 h-full"
                                onClick={() => field.onChange("")}
                              >
                                <XMarkIcon className="w-5" />
                              </div>
                            ) : (
                              <></>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
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
                      Cập nhật
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
}

export default PickerGuestsOrder;

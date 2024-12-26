import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { toast } from "react-toastify";
import ConfigsAPI from "@/api/Configs.api";
import StringHelpers from "@/helpers/StringHelpers";

const schema = yup.object().shape({
  Point: yup.string().required("Vui lòng nhập số điểm"),
});

function PickerExchangePoint({ children, MemberID, Points }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const PointConfig = useQuery({
    queryKey: ["PointConfig"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`tichdiemconfig`);
      let rs = null;
      if (data.data && data.data.length > 0) {
        let { Value } = data.data[0];
        if (Value) {
          let arr = JSON.parse(Value);
          let index = arr ? arr.findIndex((x) => x.ID === "-2") : -1;
          if (index > -1) {
            rs = arr[index];
          }
        }
      }

      return rs;
    },
  });

  const { control, handleSubmit, reset, setError, watch, clearErrors } =
    useForm({
      defaultValues: {
        Desc: "",
        MemberID: "",
        Point: "",
      },
      resolver: yupResolver(schema),
    });

  useEffect(() => {
    reset({
      Desc: "",
      MemberID: MemberID,
      Point: "",
    });
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientExchangePointsId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientManageID"]);
      await queryClient.invalidateQueries(["ClientPointID"]);

      return data;
    },
  });

  const onSubmit = (values) => {
    if (values.Point > Points) {
      setError("Point", {
        type: "client",
        message: "Số điểm không được vượt quá " + Points + " điểm.",
      });
      return;
    }

    let { PointT, Value } = {
      PointT: PointConfig?.data?.Point || 0,
      Value: PointConfig?.data?.Value || 0,
    };

    let ratio = Math.floor(Point / PointT);
    let maximum = ratio * PointT;

    let newValues = {
      ...values,
      Point: maximum,
    };

    changeMutation.mutate(
      {
        data: {
          convert: [newValues],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.error) {
            toast.error(data?.error);
          } else {
            toast.success("Quy đổi điểm thành công.");
            close();
          }
        },
      }
    );
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  let { Point } = watch();

  const getResultTranf = () => {
    let { PointT, Value } = {
      PointT: PointConfig?.data?.Point || 0,
      Value: PointConfig?.data?.Value || 0,
    };

    let ratio = Math.floor(Point / PointT);
    let maximum = ratio * PointT;

    if (maximum < 1 || Point > Points) return <></>;

    return (
      <div className="mt-1.5 text-[13px]">
        Đổi
        <span className="px-1 font-bold font-lato text-success">{maximum}</span>
        điểm tương đương
        <span className="px-1 font-bold font-lato text-success">
          {StringHelpers.formatVND(ratio * Value)}
        </span>
        vào ví điện tử. Còn lại
        <span className="px-1 font-bold font-lato text-success">
          {Points - maximum}
        </span>
        điểm
      </div>
    );
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-left">
                  Đổi điểm tích luỹ
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
                  <div className="px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">
                        Số điểm (Còn
                        <span className="px-1 font-bold font-lato text-success">
                          {Points}
                        </span>
                        điểm)
                      </div>
                      <Controller
                        name="Point"
                        control={control}
                        rules={{
                          required: Point > Points,
                        }}
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
                                thousandSeparator={false}
                                placeholder="Số điểm"
                                value={field.value}
                                onValueChange={(val) => {
                                  clearErrors("Point");
                                  field.onChange(val.floatValue || "");
                                  if (val.floatValue > Points) {
                                    setError("Point", {
                                      type: "client",
                                      message:
                                        "Số điểm không được vượt quá " +
                                        Points +
                                        " điểm.",
                                    });
                                  }
                                }}
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
                            {fieldState?.invalid &&
                              fieldState?.error?.message && (
                                <div className="text-danger mt-1 text-[12px] leading-4 font-light">
                                  {fieldState?.error?.message}
                                </div>
                              )}
                          </div>
                        )}
                      />
                      {Point && getResultTranf()}
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Ghi chú</div>
                      <Controller
                        name="Desc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[80px]"
                            type="textarea"
                            placeholder="Nhập ghi chú"
                            rows="3"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={
                        PointConfig.isLoading || changeMutation.isLoading
                      }
                      disabled={
                        PointConfig.isLoading || changeMutation.isLoading
                      }
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

export default PickerExchangePoint;

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { SelectServicesTransfer } from "@/partials/forms/select";

const schema = yup.object().shape({
  prodid: yup.object().required("Vui lòng chọn dịch vụ chuyển đổi."),
});

function PickerServiceChange({ children, data }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      osid: data?.ID,
      prodid: "",
      rootid: "",
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (data) {
      reset({
        osid: data?.ID,
        prodid: {
          label: data?.ProdService2
            ? data?.ProdService2
            : data?.ProdService || data?.Title,
          value: data?.ConvertProdID || data?.ProdID,
          source: {
            Combo: JSON.stringify([
              {
                Id: data?.ProdServiceID2
                  ? data?.ProdServiceID2
                  : data?.ProdServiceID,
              },
            ]),
          },
        },
        rootid: "",
      });
    }
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.clientsTransfServicesItem(body);

      var bodyFormData = new FormData();
      bodyFormData.append("orderarr", 1);
      bodyFormData.append(
        "prods",
        JSON.stringify([[data?.ConvertAddFeeID, 1, rs?.data?.addPrice]])
      );
      bodyFormData.append("after", "set_fee");
      bodyFormData.append("orderserviceid", data?.ID);
      bodyFormData.append("MemberID", data?.MemberID);
      bodyFormData.append("StockID", CrStocks?.ID || data?.StockID);
      bodyFormData.append("convert_fee", 1);
      bodyFormData.append("convert_osid", data?.ID);
      bodyFormData.append("OrderServiceAddFee", 1);
      await AdminAPI.clientsTransfFeeServicesItem({
        data: bodyFormData,
        Token: body.Token,
      });

      await queryClient.invalidateQueries(["ClientServicesID"]);
      await queryClient.invalidateQueries(["ServiceUseManageID"]);
      await queryClient.invalidateQueries(["CalendarBookings"]);
      return rs;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let newValues = {
      osid: values.osid,
      prodid: values?.prodid?.value || "",
    };
    if (values.prodid.source.Combo) {
      let Combo = JSON.parse(values.prodid.source.Combo);
      if (Combo && Combo.length > 0) {
        newValues.rootid = Combo[0].Id;
      }
    }

    changeMutation.mutate(
      {
        data: newValues,
        Token: Auth?.token,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(["OsDetailID"]);
          f7.dialog.close();
          toast.success("Chuyển đổi thành công.");
          setVisible(false);
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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-center">
                  Chuyển đổi dịch vụ
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
                      <div className="mb-px">Chọn dịch vụ</div>
                      <Controller
                        name="prodid"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectServicesTransfer
                            isMulti={false}
                            isRequired={true}
                            placeholderInput="Tên dịch vụ"
                            placeholder="Chọn dịch vụ"
                            value={field.value}
                            label="Chọn dịch vụ"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            isFilter
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

export default PickerServiceChange;

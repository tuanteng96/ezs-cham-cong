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
import { SelectClients, SelectServicesOsClass } from "@/partials/forms/select";

const schema = yup.object().shape({
  Member: yup.object().required("Vui lòng chọn học viên."),
  Service: yup.object().required("Vui lòng chọn thẻ liệu trình."),
});

function PickerClassOsMemberAddEdit({
  children,
  initialValue,
  ProdIDs,
  DateFrom,
}) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      Member: null,
      Service: null,
      IsAllService: false,
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    reset({
      Member: null,
      Service: null,
    });
  }, [visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async ({ data, update, Token }) => {
      let rs = await AdminAPI.addEditClassSchedule({
        data: data,
        Token,
      });
      await AdminAPI.updateOsClassSchedule({
        data: update,
        Token,
      });

      await queryClient.invalidateQueries({ queryKey: ["PosClassOsSchedule"] });
      await queryClient.invalidateQueries({ queryKey: ["PosClassSchedule"] });
      return rs;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");

    let newValues = {
      ID: initialValue?.ID,
      CreateDate: moment(initialValue.CreateDate, "YYYY-MM-DD HH:mm").format(
        "YYYY-MM-DD HH:mm"
      ),
      StockID: initialValue?.StockID,
      TimeBegin: initialValue?.TimeBegin
        ? moment(initialValue?.TimeBegin).format("YYYY-MM-DD HH:mm:ss")
        : null,
      OrderServiceClassID: initialValue?.OrderServiceClassID,
      TeacherID: initialValue?.TeacherID,
      Member: {
        ...initialValue?.Member,
        Lists: [
          ...(initialValue?.Member?.Lists || []),
          {
            Member: {
              MemberID: values?.Member?.value,
              FullName: values?.Member?.label,
              ID: values?.Member?.value,
              Phone: values?.Member?.phone,
            },
            Os: {
              OsID: values?.Service?.value,
              ID: values?.Service?.value,
              Title: values?.Service?.label,
            },
            Status: "",
          },
        ],
      },
      MemberID: "",
      Desc: "",
    };

    addMutation.mutate(
      {
        data: {
          arr: [newValues],
        },
        update: {
          arr: [
            {
              ID: values?.Service?.value,
              Desc: "(Đã xếp lớp)",
              UserID: 0,
            },
          ],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: () => {
          f7.dialog.close();
          toast.success("Thêm học viên vào lớp thành công.");
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

  let { Member, IsAllService } = watch();
 
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
                <div className="relative px-4 py-5 text-xl font-semibold text-center">
                  Thêm học viên vào lớp
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
                      <div className="mb-px">Học viên</div>
                      <Controller
                        name="Member"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectClients
                            isMulti={false}
                            isRequired={true}
                            placeholderInput="Tên học viên"
                            placeholder="Chọn học viên"
                            value={field.value}
                            label="Chọn học viên"
                            onChange={(val) => {
                              field.onChange(val);
                              setValue("Service", null);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            isFilter
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="flex justify-between mb-2">
                        <div>Thẻ liệu trình</div>
                        <Controller
                          name="IsAllService"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                {...field}
                                checked={field.value}
                              />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                            </label>
                          )}
                        />
                      </div>
                      <Controller
                        name="Service"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectServicesOsClass
                            IsAllService={IsAllService}
                            callback={(val) => setValue("Service", val)}
                            isDisabled={!Member}
                            Member={Member || null}
                            ProdIDs={ProdIDs}
                            DateFrom={DateFrom}
                            isMulti={false}
                            isRequired={true}
                            placeholderInput="Tên thẻ liệu trình"
                            placeholder="Chọn thẻ liệu trình"
                            value={field.value}
                            label="Chọn thẻ liệu trình"
                            onChange={(val) => {
                              field.onChange(val);
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
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
                      loading={addMutation.isLoading}
                      disabled={addMutation.isLoading}
                    >
                      Thêm vào lớp
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

export default PickerClassOsMemberAddEdit;

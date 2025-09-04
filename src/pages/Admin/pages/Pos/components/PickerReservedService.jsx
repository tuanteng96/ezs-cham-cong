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
import { DatePicker } from "@/partials/forms";
import moment from "moment";

const schema = yup.object().shape({
  date: yup.string().required("Vui lòng chọn ngày."),
});

function PickerReservedService({ children, Services, isCancel }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      date: "",
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    reset({
      date: isCancel ? new Date() : "",
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
      let data = await AdminAPI.updateOsClassSchedule(body);
      await queryClient.invalidateQueries(["ClientServicesID"]);
      return data;
    },
  });

  const onSubmit = ({ date }) => {
    if (isCancel) {
      let newValues = Services.map((x) => {
        let obj = {
          ID: x.ID,
          Desc: "",
          UserID: 0,
          EndDate: "",
        };
        if (x.Desc && x.Desc.toUpperCase().indexOf("ĐANG BẢO LƯU") > -1) {
          var found = [],
            rxp = /{([^}]+)}/g,
            curMatch;
          while ((curMatch = rxp.exec(x.Desc))) {
            found.push(curMatch[1]);
          }
          if (found && found.length > 1) {
            obj.EndDate = moment(date)
              .add(Number(found[1]), "day")
              .set({
                hour: "23",
                minute: "59",
                second: "59",
              })
              .format("YYYY-MM-DD HH:mm");
          }
        }
        return obj;
      }).filter((x) => x.EndDate);
      changeMutation.mutate(
        {
          data: {
            arr: newValues,
          },
          Token: Auth?.token,
        },
        {
          onSuccess: ({ data }) => {
            if (data?.error && data?.error.length > 0) {
              toast.error("Xảy ra lỗi.");
            } else {
              toast.success("Huỷ bảo lưu thành công.");
              close();
            }
          },
        }
      );
    } else {
      let newValues = Services.map((x) => {
        let obj = {
          ID: x.ID,
          Desc: "",
          UserID: 0,
        };
        if (x.EndDate) {
          let day = moment(x.EndDate).diff(x.CreateDate, "days");
          obj.Desc = `Đang bảo lưu / {${moment(date).format(
            "DD/MM/YYYY"
          )}} / {${day}}`;
        }
        return obj;
      });

      changeMutation.mutate(
        {
          data: {
            arr: newValues,
          },
          Token: Auth?.token,
        },
        {
          onSuccess: ({ data }) => {
            if (data?.error && data?.error.length > 0) {
              toast.error("Xảy ra lỗi.");
            } else {
              toast.success("Bảo lưu thành công.");
              close();
            }
          },
        }
      );
    }
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
                <div className="relative px-4 py-5 text-xl font-semibold text-left">
                  {isCancel ? "Huỷ bảo lưu dịch vụ" : "Bảo lưu dịch vụ"}
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
                      <div className="mb-1">
                        {isCancel ? "Ngày kích hoạt" : "Hạn bảo lưu"}
                      </div>
                      <Controller
                        name="date"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <DatePicker
                            format="DD-MM-YYYY"
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Chọn thời gian"
                            showHeader
                            clear={true}
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

export default PickerReservedService;

import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import moment from "moment";
import { Controller, useForm } from "react-hook-form";
import CourseAPI from "../../../api/Course.api";
import { useMutation } from "react-query";
import { Button, f7, Input } from "framework7-react";
import { toast } from "react-toastify";
import KeyboardsHelper from "../../../helpers/KeyboardsHelper";

function PickerEditCheck({ children, data, refetch }) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ID: "",
      MemberID: "",
      CourseID: "",
      CourseMemberID: "",
      Desc: "",
      CreateDate: "",
    },
  });

  useEffect(() => {
    if (visible && data) {
      let { ID, MemberID, CourseID, CourseMemberID, Desc, CreateDate } = data;
      reset({
        ID,
        MemberID,
        CourseID,
        CourseMemberID,
        Desc,
        CreateDate,
      });
    }
  }, [data, visible]);

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const editMutation = useMutation({
    mutationFn: async (data) => {
      let rs = await CourseAPI.studentEditCheck(data);
      await refetch();
      return rs;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data) => {
      let rs = await CourseAPI.studentDeleteCheck(data);
      await refetch();
      return rs;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let newValues = {
      ...values,
      CreateDate: moment(values.CreateDate).format("YYYY-MM-DD HH:mm:ss"),
    };
    editMutation.mutate(
      { edit: [newValues] },
      {
        onSuccess: (data) => {
          toast.success("Cập nhập thành công.", { autoClose: 300 });
          close();
          f7.dialog.close();
        },
      }
    );
  };

  const onDelete = () => {
    f7.dialog.confirm(
      "Bạn đang muốn hủy điểm danh này. Thực hiện sẽ không thể hoàn tác ?",
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        deleteMutation.mutate(
          { delete: [data?.ID] },
          {
            onSuccess: (data) => {
              toast.success("Đã hủy điểm danh.", { autoClose: 300 });
              f7.dialog.close();
              close();
            },
          }
        );
      }
    );
  };
  return (
    <AnimatePresence initial={false}>
      <>
        {children({
          open: open,
        })}
        {visible &&
          createPortal(
            <div className="fixed z-[13501] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.2] dark:bg-black/[.4] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="h-full pb-safe-b"
                  autoComplete="off"
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    {moment(data?.CreateDate).format("HH:mm DD-MM-YYYY")}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4">
                    <div>
                      <div className="font-light">Ghi chú</div>
                      <div className="mt-1">
                        <Controller
                          name="Desc"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <Controller
                              name="Desc"
                              control={control}
                              render={({ field, fieldState }) => (
                                <Input
                                  className="[&_textarea]:rounded [&_textarea]:lowercase [&_textarea]:placeholder:normal-case text-input [&_textarea]:min-h-[100px]"
                                  type="textarea"
                                  placeholder="Nhập lý do của bạn"
                                  value={field.value}
                                  errorMessage={fieldState?.error?.message}
                                  errorMessageForce={fieldState?.invalid}
                                  onChange={field.onChange}
                                  onFocus={(e) =>
                                    KeyboardsHelper.setAndroid({
                                      Type: "modal",
                                      Event: e,
                                    })
                                  }
                                />
                              )}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 grid-cols-2 grid gap-3">
                    <Button
                      type="button"
                      className="rounded-full bg-danger"
                      fill
                      large
                      preloader
                      loading={deleteMutation.isLoading}
                      disabled={deleteMutation.isLoading}
                      onClick={onDelete}
                    >
                      Hủy điểm danh
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={editMutation.isLoading}
                      disabled={editMutation.isLoading}
                    >
                      Cập nhập
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

PickerEditCheck.propTypes = {};

export default PickerEditCheck;

import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { SelectClients } from "@/partials/forms/select";

function PickerAddDebt({ children, data, onClose, onOpen }) {
  const [visible, setVisible] = useState(false);

  let MemberRef = useRef(null);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      MemberID: null,
    },
  });

  useEffect(() => {
    if (visible) {
      reset({
        MemberID: null,
      });

      MemberRef?.current?.click();
    }
  }, [visible]);

  let open = () => {
    setVisible(true);
    onOpen?.();
  };

  let close = () => {
    setVisible(false);
    onClose?.();
  };

  const onSubmit = ({ MemberID }) => {
    close();
    f7.views.main.router.navigate(`/admin/pos/manage/${MemberID?.value}/debt/`);
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  let { MemberID } = watch();

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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-center">
                  Tạo thanh toán nợ
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
                      <div className="mb-px">Khách hàng</div>
                      <Controller
                        name="MemberID"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectClients
                            ref={MemberRef}
                            isMulti={false}
                            isRequired={true}
                            placeholderInput="Tên khách hàng"
                            placeholder="Chọn khách hàng"
                            value={field.value}
                            label="Chọn khách hàng"
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
                      //   loading={changeMutation.isLoading}
                      disabled={!MemberID}
                    >
                      Tiếp tục
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

export default PickerAddDebt;

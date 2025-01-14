import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, Link, Tab, Tabs, f7, useStore } from "framework7-react";
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
import StringHelpers from "@/helpers/StringHelpers";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

const schema = yup.object().shape({
  // ToMember: yup.object().required("Vui lòng chọn khách hàng chuyển nhượng."),
});

function PickerServiceEnd({ children, data, MemberID }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      OrderItemID: data?.OrderItem?.ID,
      ProdServiceID: data?.Product?.ID,
      MemberID: MemberID,
      GiveMembers: null,
      save: 1,
      GiveMember: 0,
      GiveToMM: true,
      Fee: 0,
      TakeMember: 0,
      TakeOff: 0,
      Remain: 0,
      absPayed: 0,
    },
    resolver: yupResolver(schema),
  });

  const { fields } = useFieldArray({
    control,
    name: "GiveMembers",
  });

  useEffect(() => {
    if (data) {
      reset({
        OrderItemID: data?.OrderItem?.ID,
        ProdServiceID: data?.Product?.ID,
        MemberID: MemberID,
        GiveMembers: null,
        save: 1,
        GiveMember: 0,
        GiveToMM: true,
        Fee: 0,
        TakeMember: 0,
        TakeOff: 0,
        Remain: 0,
        absPayed: 0,
      });
    }
  }, [visible]);

  const Info = useQuery({
    queryKey: ["ClientServicesEnded", { MemberID }],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("OrderItemID", data?.OrderItem?.ID);
      bodyFormData.append("ProdServiceID", data?.Product?.ID);
      bodyFormData.append("MemberID", MemberID);

      let rs = await AdminAPI.clientsGetServicesItemEnd({
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      });

      let newRs = getRemainPayed(rs?.data?.data);

      let refun = await AdminAPI.clientsGetRefunItemEnd({
        data: {
          OrderItemID: data?.OrderItem?.ID,
          Value: newRs?.GiveMember,
          MemberID: MemberID,
        },
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      });

      return rs?.data?.data
        ? {
            ...rs?.data?.data,
            card: refun?.data?.data?.card || [],
            Sum: getRemainPayed({
              ...rs?.data?.data,
              card: refun?.data?.data?.card || [],
            }),
          }
        : null;
    },
    onSuccess: (rs) => {
      setValue("GiveMembers", rs?.Sum?.GiveMembers || null);
      setValue("GiveMember", rs?.Sum?.GiveMember || 0);
      setValue("TakeOff", rs?.Sum?.TakeOff || 0);
      setValue("TakeMember", rs?.Sum?.TakeMember || 0);
      setValue("Remain", rs?.Sum?.Remain || 0);
      setValue("absPayed", rs?.Sum?.absPayed || 0);
    },
    enabled: visible,
    cacheTime: 0,
    staleTime: 0,
  });

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const changeMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsGetServicesItemEnd(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: MemberID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientServicesID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = {
      ...values,
      _GiveMembers: JSON.stringify(values.GiveMembers),
    };

    delete newValues.GiveMembers;

    var bodyFormData = new FormData();

    for (const property in newValues) {
      bodyFormData.append(property, newValues[property]);
    }

    changeMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: ({ data }) => {
          close();
          toast.success("Kết thúc thẻ thành công.");
        },
      }
    );
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  const getRemainPayed = (rs) => {
    let obj = {
      Payed: 0,
      RemainPayed: 0,
      UsedValue: 0,
      ToPay: 0,
      GiveMembers: [
        { Title: "Tiền mặt", Value: 0 },
        { Title: "Nạp ví", Value: 0 },
      ].concat(
        (Array.isArray(rs?.card) ? rs?.card : []).map((x) => ({
          Title: x.Title,
          Value: 0,
          ID: x.ID,
          ProdOrService: x.ProdOrService,
        }))
      ),
    };

    if (!rs) return obj;
    var comboRation = 1;
    var comboRationAll = 1;
    var totalAll = 0;

    let ProdValues = 0;
    let ToPay = rs?.oi.ToPay || 0;
    let CashPayed = 0;
    let MMPayed = 0;
    let Payed = 0;
    let Remain = 0;
    let RemainPayed = 0;
    let absPayed = 0;
    let UsedValue = 0;
    let GiveMember = 0;
    let TakeMember = 0;
    let TakeOff = 0;

    var r = rs.oi.Price == 0 ? 0 : rs.oi.PriceOrder / rs.oi.Price;

    if (rs.prodCombos) {
      var total = 0;
      var item = 0;
      rs.prodCombos.forEach((cb) => {
        totalAll += cb.price * cb.qty;
        if (cb.Product.IsRawProduct) {
          ProdValues += r * cb.qty * cb.price;
        } else {
          if (cb.Id === data?.Product?.ID) item = cb.price * cb.qty;
          total += cb.price * cb.qty;
        }
      });
      comboRation = total == 0 ? 0 : item / total;
      comboRationAll = totalAll == 0 ? 0 : item / totalAll;

      if (rs.prodCombos.length == 1 && totalAll == 0) {
        comboRation = 1;
        comboRationAll = 1;
      }
    }

    rs?._return &&
      rs._return.forEach(function (x) {
        ToPay -= x.ToPay;
        CashPayed -= x.ToPay;
      });

    rs?.mm.forEach(function (m) {
      MMPayed += m.Value;
    });

    rs?._mm &&
      rs?._mm.forEach(function (_m) {
        MMPayed -= _m.Value;
      });

    rs?.cash.forEach(function (c) {
      if (c.IsAbstract == 1 && c.AbstractSource == "KET_THUC_DICH_VU") return;
      CashPayed += c.Value;
    });

    rs?._cash &&
      rs._cash.forEach(function (_c) {
        if (c.IsAbstract == 1 && c.AbstractSource == "KET_THUC_DICH_VU") return;
        CashPayed -= _c.Value;
      });

    Payed = (CashPayed + Math.abs(MMPayed) - ProdValues) * comboRation;

    var KHOA_NO_KET_THUC_NO = 0;
    rs?.KHOA_NO_KET_THUC_NO &&
      rs?.KHOA_NO_KET_THUC_NO.forEach((c) => {
        KHOA_NO_KET_THUC_NO += c.Value;
      });
    var ratio = (1.0 * rs?.oi.ToPay) / rs?.Order.ToPay;
    KHOA_NO_KET_THUC_NO = ratio * KHOA_NO_KET_THUC_NO;

    RemainPayed = ToPay - Payed - KHOA_NO_KET_THUC_NO;

    if (Math.abs(RemainPayed) <= 1) RemainPayed = 0;

    absPayed = ToPay - Payed;

    ToPay *= comboRationAll;

    Remain = ToPay - Payed;

    UsedValue = Math.round(rs?.osSum.used * 1000) / 1000 + rs?.deletedValues;

    GiveMember = Math.max(0, Payed - UsedValue);
    GiveMember = Math.round(GiveMember * 1000) / 1000;
    GiveMember = Math.round(GiveMember);

    TakeMember = Math.max(0, UsedValue - Payed);

    TakeMember = Math.max(Math.round(TakeMember * 1000) / 1000, 0);
    TakeMember = Math.round(TakeMember);

    TakeOff = rs?.loss;
    TakeOff = Math.max(0, Math.round(TakeOff * 1000) / 1000);

    obj.Payed = Payed;
    obj.RemainPayed = RemainPayed;
    obj.UsedValue = UsedValue;
    obj.ToPay = ToPay;
    obj.GiveMember = GiveMember;
    obj.TakeOff = TakeOff;
    obj.TakeMember = TakeMember;
    obj.absPayed = absPayed;
    obj.Remain = Remain;
    return obj;
  };
  let Remaining =
    (Info?.data?.Sum?.GiveMember || 0) -
    ArrayHelpers.sumTotal(watch().GiveMembers || [], "Value");

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
                  <div className="relative px-4 border-b border-gray-200">
                    <ul
                      className="flex flex-wrap gap-4 pt-1 -mb-px text-sm font-medium text-center"
                      role="tablist"
                    >
                      <li role="presentation">
                        <Link
                          noLinkClass
                          className="inline-block py-4 rounded-t-lg text-[15px] group"
                          tabLink="#tab-1"
                          tabLinkActive
                        >
                          <span className="group-[.tab-link-active]:text-primary">
                            Kết thúc thẻ
                          </span>
                        </Link>
                      </li>
                      <li role="presentation">
                        <Link
                          noLinkClass
                          className={clsx(
                            "inline-block py-4 rounded-t-lg text-[15px] group",
                            Info?.isFetching && "pointer-events-none"
                          )}
                          tabLink="#tab-2"
                        >
                          <span className="group-[.tab-link-active]:text-primary">
                            Thông tin thẻ
                          </span>
                        </Link>
                      </li>
                    </ul>
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <Tabs className="grow" animated>
                    <Tab id="tab-1" tabActive>
                      <div className="flex flex-col h-full">
                        {Info?.isFetching && (
                          <div
                            role="status"
                            className={clsx(
                              "left-0 flex items-center justify-center w-full transition h-full top-0 z-10 bg-white/50"
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
                        {!Info?.isFetching && (
                          <>
                            <div className="p-4 overflow-auto grow scrollbar-modal">
                              <div>
                                <div className="mb-3.5 last:mb-0">
                                  <div className="mb-px">
                                    Số tiền trả khách hàng
                                  </div>
                                  <div>
                                    <NumericFormat
                                      className={clsx(
                                        "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary border-[#d5d7da]"
                                      )}
                                      type="text"
                                      autoComplete="off"
                                      thousandSeparator={true}
                                      placeholder="Số tiền"
                                      value={Info?.data?.Sum?.GiveMember}
                                      disabled
                                      onFocus={(e) =>
                                        KeyboardsHelper.setAndroid({
                                          Type: "modal-scrollbar",
                                          Event: e,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                {fields &&
                                  fields.map((item, index) => (
                                    <div
                                      className="mb-3.5 last:mb-0"
                                      key={item.id}
                                    >
                                      <div className="mb-px">{item.Title}</div>
                                      <Controller
                                        name={`GiveMembers[${index}].Value`}
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
                                              placeholder="Số tiền"
                                              value={field.value}
                                              onValueChange={(val) =>
                                                field.onChange(
                                                  val.floatValue || ""
                                                )
                                              }
                                              // onFocus={(e) =>
                                              //   KeyboardsHelper.setAndroid({
                                              //     Type: "modal-scrollbar",
                                              //     Event: e,
                                              //   })
                                              // }
                                            />
                                            {field.value ? (
                                              <div
                                                className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                                onClick={() =>
                                                  field.onChange("")
                                                }
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
                                  ))}
                                <div className="mb-3.5 last:mb-0">
                                  <div className="mb-px">
                                    Số tiền khách phải trả thêm
                                  </div>
                                  <Controller
                                    name="TakeMember"
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
                                          placeholder="Số tiền"
                                          value={field.value}
                                          onValueChange={(val) =>
                                            field.onChange(val.floatValue || "")
                                          }
                                          // onFocus={(e) =>
                                          //   KeyboardsHelper.setAndroid({
                                          //     Type: "modal-scrollbar",
                                          //     Event: e,
                                          //   })
                                          // }
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
                                  <div className="mb-px">Doanh số giảm</div>
                                  <Controller
                                    name={`TakeOff`}
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
                                          placeholder="Số tiền"
                                          value={field.value}
                                          onValueChange={(val) =>
                                            field.onChange(val.floatValue || "")
                                          }
                                          // onFocus={(e) =>
                                          //   KeyboardsHelper.setAndroid({
                                          //     Type: "modal-scrollbar",
                                          //     Event: e,
                                          //   })
                                          // }
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
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-end justify-between mb-2.5">
                                <div className="font-medium leading-3">
                                  Còn lại
                                </div>
                                <div className="text-base font-bold leading-3 font-lato">
                                  ₫
                                  {StringHelpers.formatVND(
                                    Remaining >= 0 ? Remaining : 0
                                  )}
                                </div>
                              </div>
                              <Button
                                type="submit"
                                className="rounded-full bg-app"
                                fill
                                large
                                preloader
                                loading={changeMutation.isLoading}
                                disabled={changeMutation.isLoading}
                              >
                                Kết thúc thẻ
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </Tab>
                    <Tab id="tab-2" className="p-4 overflow-auto">
                      {!Info?.isFetching && (
                        <>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">Dịch vụ</div>
                            <div className="font-medium">
                              {Info?.data?.oi?.ProdTitle}
                            </div>
                          </div>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">Giá trị</div>
                            <div className="font-medium">
                              {StringHelpers.formatVND(Info?.data?.Sum?.ToPay)}
                            </div>
                          </div>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">
                              Đã thanh toán
                            </div>
                            <div className="font-medium">
                              {StringHelpers.formatVND(Info?.data?.Sum?.Payed)}
                            </div>
                          </div>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">Còn nợ</div>
                            <div className="font-medium">
                              {StringHelpers.formatVND(
                                Info?.data?.Sum?.RemainPayed
                              )}
                            </div>
                          </div>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">
                              Giá trị đã sử dụng
                            </div>
                            <div className="font-medium">
                              {StringHelpers.formatVND(
                                Info?.data?.Sum?.UsedValue
                              )}
                            </div>
                          </div>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">
                              Tổng số buổi
                            </div>
                            <div className="font-medium">
                              {Info?.data?.osSum?.total}
                            </div>
                          </div>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">
                              Số buổi đã dùng
                            </div>
                            <div className="font-medium">
                              {Info?.data?.osSum?.done}
                            </div>
                          </div>
                          <div className="mb-2.5 border-b border-dashed pb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="mb-1 text-gray-500">
                              Số buổi còn
                            </div>
                            <div className="font-medium">
                              {Info?.data?.osSum?.total -
                                Info?.data?.osSum?.done}
                            </div>
                          </div>
                        </>
                      )}
                    </Tab>
                  </Tabs>
                </form>
              </motion.div>
            </div>,
            document.getElementById("framework7-root")
          )}
      </>
    </AnimatePresence>
  );
}

export default PickerServiceEnd;

import AdminAPI from "@/api/Admin.api";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import PromHelpers from "@/helpers/PromHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Button,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";

const OrderReturnItem = ({ oi, index }) => {
  const [visible, setVisible] = useState(false);
  const { control, watch, setValue } = useFormContext();
  const { Items, cols } = watch();
  return (
    <div className="mb-4 border rounded shadow last:mb-0" key={oi.id}>
      <div className="flex gap-3 px-4 py-2.5 border-b bg-gray-50 rounded-t">
        <div className="flex-1">
          <div className="font-bold text-[15px] leading-6">{oi.Title}</div>
          <div className="font-medium font-lato">
            [#{oi.ProdID}]
            <span className="pl-1">
              {oi.Qty} x {StringHelpers.formatVND(oi.PriceOrder)}
            </span>
          </div>
        </div>
        <div
          className="flex justify-end w-8 pt-2"
          onClick={() => setVisible(!visible)}
        >
          <div>
            <EllipsisVerticalIcon className="w-6" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div>
          <Controller
            name={`Items[${index}].PendingQty`}
            // rules={{
            //   required: true,
            // }}
            control={control}
            render={({ field, fieldState }) => (
              <div>
                {oi.Qty - (oi.Qty_Returned || 0) &&
                oi.NOS === 0 &&
                oi.NMM === 0 ? (
                  <>
                    <div className="flex justify-between mb-px">
                      Số lượng trả
                      <span className="text-gray-600">
                        Tối đa
                        <span className="pl-1.5 font-bold font-lato text-success">
                          ({oi.Qty - (oi.Qty_Returned || 0)})
                        </span>
                      </span>
                    </div>
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
                        placeholder="Nhập số lượng trả"
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val.floatValue || "");
                          var q = val.floatValue;
                          var _q = Math.min(q, oi.Qty - (oi.Qty_Returned || 0));
                          var _qty = oi.Qty - (oi.Qty_Returned || 0);

                          let PendingValue =
                            _qty == 0 ? 0 : (_q * oi.ToPay) / _qty; //oi.Qty

                          setValue(
                            `Items[${index}].MM_Items`,
                            oi.MM_Items
                              ? oi.MM_Items.map((x) => ({
                                  ...x,
                                  Pending: (Math.max(0, _q) / oi.Qty) * x.Value,
                                }))
                              : []
                          );

                          setValue(
                            `Items[${index}].AFF_Items`,
                            oi.AFF_Items
                              ? oi.AFF_Items.map((x) => ({
                                  ...x,
                                  Pending: (Math.max(0, _q) / oi.Qty) * x.Value,
                                }))
                              : []
                          );

                          setValue(
                            `Items[${index}].UserReturn_Items`,
                            oi.UserReturn_Items
                              ? oi.UserReturn_Items.map((x) => ({
                                  ...x,
                                  Pending: (Math.max(0, _q) / oi.Qty) * x.Value,
                                }))
                              : []
                          );

                          var sLgCon = Math.max(
                            0,
                            oi.Qty - oi.PendingQty - (oi.Qty_Returned || 0)
                          );
                          setValue(
                            `Items[${index}].PendingValue`,
                            PendingValue
                          );
                          setValue(
                            `Items[${index}].AddPay`,
                            Math.max(0, (oi.ToPay / _qty) * sLgCon - oi.Payed)
                          );
                          setValue(
                            `Items[${index}].AstractPay`,
                            oi.ToPay - oi.Payed - oi.AddPay
                          );

                          var slTra = q || 0;

                          setValue(
                            `Items[${index}].MoneyReturn`,
                            (_qty = 0
                              ? 0
                              : Math.max(
                                  0,
                                  slTra * (oi.ToPay / _qty) -
                                    Math.max(0, oi.ToPay - oi.Payed)
                                ))
                          );
                        }}
                        isAllowed={(values) => {
                          const { floatValue, formattedValue } = values;
                          return (
                            formattedValue === "" ||
                            floatValue <= oi.Qty - (oi.Qty_Returned || 0)
                          );
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
                  </>
                ) : (
                  <></>
                )}

                {oi.Qty_Returned && (
                  <div
                    className={clsx(
                      oi.Qty - (oi.Qty_Returned || 0) &&
                        oi.NOS === 0 &&
                        oi.NMM === 0 &&
                        "mt-1.5"
                    )}
                  >
                    <span className="text-gray-500">Đã hoàn trả</span>
                    <span className="text-[15px] font-lato font-bold pl-1.5 text-warning">
                      ({oi.Qty_Returned || 0})
                    </span>
                  </div>
                )}
                {oi?.NOS > 0 && (
                  <div className="mt-2 text-danger">
                    Đã sử dụng
                    <span className="px-1 font-semibold">{oi?.NOS}</span>
                    buổi & không thể hoàn trả.
                  </div>
                )}
                {oi?.NMM > 0 && (
                  <div className="text-danger">
                    Đã sử dụng. Không thể trả mặt hàng này.
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>
      <div className="p-4 border-t">
        <div className="relative mb-2.5">
          <div className="text-gray-500">Số tiền hoàn trả</div>
          <div className="font-lato text-[15px] font-bold">
            {Items[index]?.MoneyReturn
              ? StringHelpers.formatVND(Items[index]?.MoneyReturn)
              : 0}
          </div>
        </div>
        {Items[index]?.Qty - (Items[index]?.Qty_Returned || 0) &&
        Items[index]?.NOS === 0 &&
        Items[index]?.NMM === 0 &&
        Items[index]?.MoneyReturn > 0 ? (
          <div className="mb-3">
            {Items[index].SubMoneys.map((sub, i) => (
              <div className="mb-2 last:mb-0" key={i}>
                <div className="mb-1 text-gray-500">{sub.Title}</div>
                <div>
                  <Controller
                    name={`Items[${index}].SubMoneys[${i}].Value`}
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
                          placeholder="Nhập số tiền"
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
              </div>
            ))}
          </div>
        ) : (
          <></>
        )}
        <div className="relative">
          <div className="text-gray-500">Còn lại</div>
          <div className="font-lato text-[15px] font-bold">
            {StringHelpers.formatVND(
              Items[index]?.MoneyReturn -
                ArrayHelpers.sumTotal(Items[index]?.SubMoneys, "Value")
            )}
          </div>
        </div>
      </div>
      {visible && (
        <>
          {cols.TINH_LUY_TV && (
            <div className="p-4 border-t">
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">Đã tích luỹ</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.MM)}
                </div>
              </div>
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">Đã khấu trừ</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.MM_Returned)}
                </div>
              </div>
              {Items[index]?.MM_Items &&
                Items[index]?.MM_Items.length > 0 &&
                Items[index]?.MM_Items.map((x, i) => (
                  <div className="relative mb-2.5 last:mb-0" key={i}>
                    <div className="text-gray-500">{x.FullName}</div>
                    <div>
                      <span className="font-lato text-[15px] font-bold">
                        {StringHelpers.formatVND(x.Value)}
                      </span>

                      {x.Value_Returned && x.Value_Returned != 0 && (
                        <span className="pl-2 text-xs text-warning">
                          ( {StringHelpers.formatVND(x.Value_Returned)} )
                        </span>
                      )}
                    </div>
                    {x.Pending > 0 && (
                      <div className="mt-2">
                        <Controller
                          name={`Items[${index}].Pending`}
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
                                placeholder="Nhập số tiền"
                                value={x.Pending}
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
                    )}
                  </div>
                ))}
            </div>
          )}
          {cols.AFF && (
            <div className="p-4 border-t">
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">AFF</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.AFF)}
                </div>
              </div>
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">Đã khấu trừ</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.AFF_Returned)}
                </div>
              </div>

              {Items[index]?.AFF_Items &&
                Items[index]?.AFF_Items.length > 0 &&
                Items[index]?.AFF_Items.map((x, i) => (
                  <div className="relative mb-2.5 last:mb-0" key={i}>
                    <div className="text-gray-500">{x.FullName}</div>
                    <div>
                      <span className="font-lato text-[15px] font-bold">
                        {StringHelpers.formatVND(x.Value)}
                      </span>

                      {x.Value_Returned != 0 && (
                        <span className="pl-2 text-xs text-warning">
                          ( {StringHelpers.formatVND(x.Value_Returned)} )
                        </span>
                      )}
                    </div>
                    {x.Pending && (
                      <div className="mt-2">
                        <Controller
                          name={`Items[${index}].Pending`}
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
                                placeholder="Nhập số tiền"
                                value={x.Pending}
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
                    )}
                  </div>
                ))}
            </div>
          )}
          {cols.HOA_HONG && (
            <div className="p-4 border-t">
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">Hoa hồng</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.Bonus)}
                </div>
              </div>
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">Đã khấu trừ</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.Bonus_Returned)}
                </div>
              </div>
              {Items[index]?.Bonus_Items &&
                Items[index]?.Bonus_Items.length > 0 &&
                Items[index]?.Bonus_Items.map((x, i) => (
                  <div className="relative mb-2.5 last:mb-0" key={i}>
                    <div className="text-gray-500">{x.FullName}</div>
                    <div>
                      <span className="font-lato text-[15px] font-bold">
                        {StringHelpers.formatVND(x.Value)}
                      </span>

                      {x.Value_Returned != 0 && (
                        <span className="pl-2 text-xs text-warning">
                          ( {StringHelpers.formatVND(x.Value_Returned)} )
                        </span>
                      )}
                    </div>
                    {x.Pending && (
                      <div className="mt-2">
                        <Controller
                          name={`Items[${index}].Pending`}
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
                                placeholder="Nhập số tiền"
                                value={x.Pending}
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
                    )}
                  </div>
                ))}
            </div>
          )}
          {cols.DOANH_SO_NV && (
            <div className="p-4 border-t">
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">Doanh số nhân viên</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.UserReturn)}
                </div>
              </div>
              <div className="relative mb-2.5 last:mb-0">
                <div className="text-gray-500">Đã khấu trừ</div>
                <div className="font-lato text-[15px] font-bold">
                  {StringHelpers.formatVND(oi.UserReturn_Returned)}
                </div>
              </div>
              {Items[index]?.UserReturn_Items &&
                Items[index]?.UserReturn_Items.length > 0 &&
                Items[index]?.UserReturn_Items.map((x, i) => (
                  <div className="relative mb-2.5 last:mb-0" key={i}>
                    <div className="text-gray-500">{x.FullName}</div>
                    <div>
                      <span className="font-lato text-[15px] font-bold">
                        {StringHelpers.formatVND(x.Value)}
                      </span>

                      {x.Value_Returned != 0 && (
                        <span className="pl-2 text-xs text-warning">
                          ( {StringHelpers.formatVND(x.Value_Returned)} )
                        </span>
                      )}
                    </div>
                    {x.Pending && (
                      <div className="mt-2">
                        <Controller
                          name={`Items[${index}].Pending`}
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
                                placeholder="Nhập số tiền"
                                value={x.Pending}
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
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

function OrderReturn({ f7router, f7route }) {
  const queryClient = useQueryClient();
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const methods = useForm({
    defaultValues: {
      Items: [],
      cols: {
        TINH_LUY_TV: true,
        AFF: true,
        HOA_HONG: true,
        DOANH_SO_NV: true,
      },
      //
      OIMethods: [],
      TUDONG_TINH_HOAHONG: false,
      TINH_HOAHONG_LOAITRU_THETIEN: false,
      AbsPayed: [],
    },
    //resolver: yupResolver(schemaAdd),
  });

  const { control, handleSubmit, reset, setValue, watch, setError, getValues } =
    methods;

  const { fields } = useFieldArray({
    control,
    name: "Items",
    shouldUnregister: true,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ClientOrderReturnID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsViewOrderReturnId({
        OrderID: f7route?.params?.id,
        Token: Auth?.token,
      });

      return data?.data || null;
    },
    onSuccess: (rs) => {
      if (!rs?.checkin || rs?.checkin?.CheckOutTime) {
        var data = {
          Items: [],
          max: function (a, b) {
            return a > b ? a : b;
          },
          min: function (a, b) {
            return a > b ? b : a;
          },
          cols: {
            TINH_LUY_TV: true,
            AFF: true,
            HOA_HONG: true,
            DOANH_SO_NV: true,
          },
          //
          OIMethods: [],
          TUDONG_TINH_HOAHONG: false,
          TINH_HOAHONG_LOAITRU_THETIEN: false,
          AbsPayed: [],
        };

        const GIOI_THIEU = "GIOI_THIEU";
        const GIOI_THIEU_DANHMUC = "GIOI_THIEU_DANHMUC";
        const GIOI_THIEU_SANPHAM = "GIOI_THIEU_SANPHAM";

        const CHIA_SE_MAGIAMGIA = "CHIA_SE_MAGIAMGIA";

        const MUA_HANG = "MUA_HANG";
        const MUA_HANG_DANHMUC = "MUA_HANG_DANHMUC";
        const MUA_HANG_SANPHAM = "MUA_HANG_SANPHAM";

        function setData() {
          data.Order.MM = 0;
          data.Order.MM_Returned = 0;
          data.Order.MM_Items = [];

          data.Order.AFF = 0;
          data.Order.AFF_Returned = 0;
          data.Order.AFF_Items = [];

          data.Order.Bonus = 0;
          data.Order.Bonus_Returned = 0;
          data.Order.Bonus_Items = [];

          data.Order.UserReturn = 0;
          data.Order.UserReturn_Returned = 0;
          data.Order.UserReturn_Items = [];

          data.Order.ReturnCost = 0;

          data.Order.Total_Returned = 0;

          data.Items.forEach(function (oi) {
            oi.AFF = 0;
            oi.AFF_Items = [];
            oi.AFF_Returned = 0;

            oi.Bonus = 0;
            oi.Bonus_Items = [];
            oi.Bonus_Returned = 0;

            oi.MM = 0;
            oi.MM_Items = [];
            oi.MM_Returned = 0;

            oi.UserReturn = 0;
            oi.UserReturn_Items = [];
            oi.UserReturn_Returned = 0;

            oi.PendingValue = 0;
            oi.AddPay = 0;
            oi.AstractPay = 0;
            oi.RemainPay = 0;
            oi.Payed = 0;
            oi.HOAN_TIEN = 0;

            Object.defineProperty(oi, "PendingQty", {
              _value: 0,
              get() {
                return this._value;
              },
              set(v) {
                this._value = v;
                Calc(oi.ID);
              },
            });

            oi.FeeReturn = 0;
            oi.MoneyReturn = 0;
            oi.ToMemberMoney = true;

            oi.ReturnCost = 0;

            oi.SubMoneys = [
              { Title: "Tiền mặt", Value: 0, ID: 0 },
              { Title: "Nạp ví", Value: 0, ID: 0 },
            ].concat(
              data.OIMethods.filter((x) => x.SubSourceID === oi.ID).map((x) => {
                return {
                  Title: x.ProdTitle,
                  Value: 0,
                  OrderItemMoneyID: x.OrderItemMoneyID,
                  ID: x.OrderItemMoneyID,
                };
              })
            );
          });

          data.mm &&
            data.mm.forEach(function (x) {
              switch (x.Type) {
                case MUA_HANG:
                case MUA_HANG_DANHMUC:
                case MUA_HANG_SANPHAM:
                  switch (x.Source) {
                    case "vOrderItemEnt":
                    case "OrderItemEnt":
                      data.Order.MM += x.Value;
                      data.Items.every(function (oi) {
                        if (oi.ID === x.SourceID) {
                          oi.MM += x.Value;
                          oi.MM_Items.push(x);

                          return false;
                        }
                        return true;
                      });
                      break;
                  }
                  break;
              }
            });

          data.mm_fixed &&
            data.mm_fixed.forEach(function (x) {
              switch (x.Type) {
                case MUA_HANG:
                case MUA_HANG_DANHMUC:
                case MUA_HANG_SANPHAM:
                  switch (x.Source) {
                    case "vOrderEnt":
                    case "OrderEnt":
                      data.Order.MM += x.Value;
                      data.Order.MM_Items.push(x); // # with data.mm
                      break;
                  }
                  break;
              }
            });

          data.aff &&
            data.aff.forEach(function (x) {
              switch (x.Type) {
                case GIOI_THIEU:
                case GIOI_THIEU_DANHMUC:
                case GIOI_THIEU_SANPHAM:
                case CHIA_SE_MAGIAMGIA:
                  switch (x.Source) {
                    case "vOrderItemEnt":
                    case "OrderItemEnt":
                      data.Order.AFF += x.Value;
                      data.Items.every(function (oi) {
                        if (oi.ID === x.SourceID) {
                          oi.AFF += x.Value;
                          oi.AFF_Items.push(x);

                          return false;
                        }
                        return true;
                      });
                      break;
                  }
                  break;
              }
            });

          data.aff_fixed &&
            data.aff_fixed.forEach(function (x) {
              switch (x.Type) {
                case GIOI_THIEU:
                case GIOI_THIEU_DANHMUC:
                case GIOI_THIEU_SANPHAM:
                case CHIA_SE_MAGIAMGIA:
                  switch (x.Source) {
                    case "vOrderEnt":
                    case "OrderEnt":
                      data.Order.AFF += x.Value;
                      data.Order.AFF_Items.push(x); // # with data.mm
                      break;
                  }
                  break;
              }
            });

          data.Bonus &&
            data.Bonus.forEach(function (x) {
              data.Order.Bonus += x.Value;
              if (x.SubSourceID === 0) {
                data.Order.Bonus_Items.push(x);
              } else {
                data.Items.every(function (oi) {
                  if (oi.ID === x.SubSourceID) {
                    oi.Bonus += x.Value;
                    oi.Bonus_Items.push(x);

                    return false;
                  }
                  return true;
                });
              }
            });

          data.rt &&
            data.rt.forEach(function (x) {
              data.Order.UserReturn += x.Value;
              if (x.OrderItemID === 0) {
                data.Order.UserReturn_Items.push(x);
              } else {
                data.Items.every(function (oi) {
                  if (oi.ID === x.OrderItemID) {
                    oi.UserReturn += x.Value;
                    oi.UserReturn_Items.push(x);

                    return false;
                  }
                  return true;
                });
              }
            });

          data.Return &&
            data.Return.forEach(function (arr, i) {
              if (i === 0) {
                //oi
                arr.forEach(function (x) {
                  data.Order.Total_Returned += x.Qty;

                  data.Items.forEach(function (oi) {
                    if (oi.ProdCode === x.ProdCode) {
                      if (!oi.Qty_Returned) oi.Qty_Returned = 0;
                      if (!oi.Value_Returned) oi.Value_Returned = 0;
                      oi.Qty_Returned += x.Qty;
                      oi.Value_Returned += x.ToPay;
                    }
                  });
                });
              }
              if (i === 1) {
                //mm
                arr.forEach(function (x) {
                  data.Items.forEach(function (oi) {
                    oi.MM_Items.forEach(function (z) {
                      if (!z.Value_Returned) z.Value_Returned = 0;
                      //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;
                      if (x.ReturnOfID === z.ID) {
                        z.Value_Returned += x.Value;
                        oi.MM_Returned += x.Value;
                        data.Order.MM_Returned += x.Value;
                      }
                    });
                    oi.AFF_Items.forEach(function (z) {
                      if (!z.Value_Returned) z.Value_Returned = 0;
                      //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;

                      //console.log([z, x, x.Value, x.ReturnOfID === z.ID, x.ReturnOfID, z.ID]);

                      if (x.ReturnOfID === z.ID) {
                        z.Value_Returned += x.Value;
                        oi.AFF_Returned += x.Value;
                        data.Order.AFF_Returned += x.Value;
                      }
                    });
                  });
                });
              }
              if (i === 2) {
                //mm fixed
                arr.forEach(function (x) {
                  data.Order.MM_Items.forEach(function (z) {
                    if (!z.Value_Returned) z.Value_Returned = 0;
                    //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;
                    if (x.ReturnOfID === z.ID) {
                      z.Value_Returned += x.Value;
                      data.Order.MM_Returned += x.Value;
                    }
                  });
                  data.Order.AFF_Items.forEach(function (z) {
                    if (!z.Value_Returned) z.Value_Returned = 0;
                    //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;
                    if (x.ReturnOfID === z.ID) {
                      z.Value_Returned += x.Value;
                      data.Order.AFF_Returned += x.Value;
                    }
                  });
                });
              }
              if (i === 3) {
                //bonus
                arr.forEach(function (x) {
                  data.Items.forEach(function (oi) {
                    oi.Bonus_Items.forEach(function (z) {
                      if (!z.Value_Returned) z.Value_Returned = 0;
                      //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;
                      if (x.ReturnOfID === z.ID) {
                        z.Value_Returned += x.Value;
                        oi.Bonus_Returned += x.Value;
                        data.Order.Bonus_Returned += x.Value;
                      }
                    });
                  });
                  data.Order.Bonus_Items.forEach(function (z) {
                    if (!z.Value_Returned) z.Value_Returned = 0;
                    //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;
                    if (x.ReturnOfID === z.ID) {
                      z.Value_Returned += x.Value;
                      data.Order.Bonus_Returned += x.Value;
                    }
                  });
                });
              }
              if (i === 4) {
                //UserReturn
                arr.forEach(function (x) {
                  data.Items.forEach(function (oi) {
                    oi.UserReturn_Items.forEach(function (z) {
                      if (!z.Value_Returned) z.Value_Returned = 0;
                      //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;
                      if (x.ReturnOfID === z.ID) {
                        z.Value_Returned += x.Value;
                        oi.UserReturn_Returned += x.Value;
                        data.Order.UserReturn_Returned += x.Value;
                      }
                    });
                  });
                  data.Order.UserReturn_Items.forEach(function (z) {
                    if (!z.Value_Returned) z.Value_Returned = 0;
                    //if (z.MemberID === x.MemberID) z.Value_Returned += x.Value;
                    if (x.ReturnOfID === z.ID) {
                      z.Value_Returned += x.Value;
                      data.Order.UserReturn_Returned += x.Value;
                    }
                  });
                });
              }

              if (i === 5) {
                //CashOnReturn
                arr.forEach(function (x) {
                  //ReturnCost
                  data.Order.ReturnCost += x.Value;
                  data.Items.forEach(function (oi) {
                    if (oi.ProdID === x.ProdID) {
                      oi.ReturnCost += x.Value;
                    }
                  });
                });
              }
            });
        }

        for (var k in rs) {
          data[k] = rs[k];
        }
        setData();

        var remain = 0;
        var Qty_Returned = 0;

        data.Items.forEach(function (oi) {
          Qty_Returned += oi.Qty_Returned || 0;

          data.Return[0].forEach(function (subOI) {
            if (subOI.ProdID == oi.ProdID) {
              oi.ToPay -= subOI.ToPay;
            }
          });

          oi.Payed = 0;

          data.payed.forEach(function (pay) {
            if (pay.SubSourceID === oi.ID && pay.IsAbstract !== 1) {
              oi.Payed += pay.Value;
            }
          });

          oi.HOAN_TIEN = 0;
          data.HOAN_TIEN.forEach(function (x) {
            if (oi.ID === x.SourceID) oi.HOAN_TIEN += x.Value;
          });

          oi.Payed2 = oi.Payed;
          oi.Payed -= oi.HOAN_TIEN;

          oi.RemainPay = oi.ToPay - oi.Payed;
          remain += oi.Qty - (oi.Qty_Returned || 0);
        });

        data.remain = remain;
        data.Qty_Returned = Qty_Returned;

        reset(data);
      } else {
        f7.dialog.alert(
          "Đơn hàng đang checkin, checkout trước khi có thể trả hàng.",
          async () => {
            f7router.back();
          }
        );
      }
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const returnMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.clientsOrderReturnId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: data?.Order?.Member?.ID,
        Token: Auth.token,
      });
      await refetch();
      await queryClient.invalidateQueries(["ClientOrderViewID"]);
      await queryClient.invalidateQueries(["Processings"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      return rs;
    },
  });

  const onSubmit = ({ Items, Order }) => {
    var p = {};

    Items.forEach(function (oi) {
      if (oi.PendingQty) {
        p["qty_" + oi.ProdCode] = Math.min(
          oi.PendingQty,
          oi.Qty - (oi.Qty_Returned || 0)
        );
        p["add_money_" + oi.ProdCode] = oi.ToMemberMoney ? 1 : 0;
        p["cost_" + oi.ProdCode] = oi.FeeReturn;
        //p['money_' + oi.ProdCode] = oi.MoneyReturn;

        p["submoneys_" + oi.ProdCode] = JSON.stringify(oi.SubMoneys);

        p["AstractPay_" + oi.ProdCode] = oi.AstractPay;

        p["value_" + oi.ProdCode] = oi.PendingValue;
        oi.MM_Items.forEach(function (x) {
          if (x.Pending) p["MM_" + oi.ProdCode + ":" + x.ID] = x.Pending;
        });

        oi.AFF_Items.forEach(function (x) {
          if (x.Pending) p["AFF_" + oi.ProdCode + ":" + x.ID] = x.Pending;
        });
        oi.Bonus_Items.forEach(function (x) {
          if (x.Pending) p["Bonus_" + oi.ProdCode + ":" + x.ID] = x.Pending;
        });
        oi.UserReturn_Items.forEach(function (x) {
          if (x.Pending)
            p["userreturn_" + oi.ProdCode + ":" + x.ID] = x.Pending;
        });
      }
    });

    Order.MM_Items.forEach(function (x) {
      if (x.Pending) p["_MM:" + x.ID] = x.Pending;
    });
    Order.AFF_Items.forEach(function (x) {
      if (x.Pending) p["_AFF:" + x.ID] = x.Pending;
    });
    Order.Bonus_Items.forEach(function (x) {
      if (x.Pending) p["_Bonus:" + x.ID] = x.Pending;
    });
    Order.UserReturn_Items.forEach(function (x) {
      if (x.Pending) p["_userreturn:" + x.ID] = x.Pending;
    });
    p.OrderID = Order.ID;

    var bodyFormData = new FormData();
    for (const property in p) {
      bodyFormData.append(
        property,
        Array.isArray(p[property]) ? JSON.stringify(p[property]) : p[property]
      );
    }

    returnMutation.mutate(
      {
        data: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.ID) {
            toast.success("Trả hàng thành công.");
            f7router.navigate("/admin/pos/orders/view/" + data?.ID);
          } else {
            toast.error(data?.error || "Trả hàng không thành công.");
          }
        },
      }
    );
  };

  let { remain, Qty_Returned, Items } = watch();

  return (
    <Page
      className="!bg-white"
      name="Order-return"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      //ptr
      //onPtrRefresh={(done) => refetch().then(() => done())}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Trả hàng #{f7route?.params?.id}</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full pb-safe-b"
        >
          <div className="p-4 overflow-auto grow">
            <>
              {isLoading && (
                <div className="mb-4 border rounded shadow last:mb-0">
                  <div className="px-4 py-2.5 border-b bg-gray-50 rounded-t">
                    <div className="w-11/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-8/12 h-2 mt-2 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="p-4">
                    <div className="w-11/12 h-2 mt-1.5 bg-gray-200 rounded-full first:mt-0 animate-pulse"></div>
                    <div className="w-8/12 h-2 mt-1.5 bg-gray-200 rounded-full first:mt-0 animate-pulse"></div>
                    <div className="w-12/12 h-2 mt-1.5 bg-gray-200 rounded-full first:mt-0 animate-pulse"></div>
                  </div>
                  <div className="p-4 border-t">
                    <div className="w-11/12 h-2 mt-1.5 bg-gray-200 rounded-full first:mt-0 animate-pulse"></div>
                    <div className="w-8/12 h-2 mt-1.5 bg-gray-200 rounded-full first:mt-0 animate-pulse"></div>
                    <div className="w-12/12 h-2 mt-1.5 bg-gray-200 rounded-full first:mt-0 animate-pulse"></div>
                  </div>
                </div>
              )}
              {!isLoading && (
                <>
                  {fields &&
                    fields.map((oi, index) => (
                      <OrderReturnItem key={oi.id} index={index} oi={oi} />
                    ))}
                </>
              )}
            </>
          </div>
          <div className="p-4 bg-white">
            <Button
              type="submit"
              className="rounded-full bg-app"
              fill
              large
              preloader
              loading={isLoading || returnMutation.isLoading}
              disabled={
                isLoading ||
                (remain === 0 && Qty_Returned) ||
                returnMutation.isLoading ||
                Items.filter((oi) => oi.PendingQty > 0).length === 0
              }
            >
              {remain === 0 && Qty_Returned
                ? "Đã trả hàng"
                : "Thực hiện trả hàng"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Page>
  );
}

export default OrderReturn;

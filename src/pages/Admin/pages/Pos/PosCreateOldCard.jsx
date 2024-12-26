import AdminAPI from "@/api/Admin.api";
import PromHelpers from "@/helpers/PromHelpers";
import { DatePicker, SelectPicker } from "@/partials/forms";
import {
  SelectMoneyCardClients,
  SelectProductCardClients,
  SelectServiceCardClients,
} from "@/partials/forms/select";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Button,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import React, { Fragment, useRef } from "react";
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
import { PickerPreviewOldCard } from "./components";

let initialValues = {
  TypeOs: "DV_CON_BUOI",
  Type: "DICHVU",
  DICHVU: [
    {
      DICH_VU_THE: "",
      BUOI_CON: "",
      BUOI_BH_DA_LAM: "",
      HAN_BAO_HANH: "",
      HAN_THE: "",
      SL: "1",
      TONG_TIEN: "",
      DA_THANH_TOAN: "",
      NGAY: "",
      CO_SO: "",
    },
  ],
  Thetien: [
    {
      THE_TIEN: "",
      DA_TIEU_SP: "",
      DA_TIEU_DV: "",
      SL: "1",
      TONG_TIEN: "",
      DA_THANH_TOAN: "",
      NGAY: "",
      CO_SO: "",
    },
  ],
  SANPHAM: [
    {
      SAN_PHAM: "",
      SL: "1",
      TONG_TIEN: "",
      DA_THANH_TOAN: "",
      NGAY: "",
      CO_SO: "",
    },
  ],
};

let Types = [
  {
    label: "Sản phẩm đã mua",
    value: "SANPHAM",
  },
  {
    label: "Dịch vụ đã mua",
    value: "DICHVU",
  },
  {
    label: "Thẻ tiền đã mua",
    value: "Thetien",
  },
];

let OptionsTypeService = [
  {
    label: "Dịch vụ đang bảo hành",
    value: "DV_DANG_BH",
  },
  {
    label: "Dịch vụ còn buổi",
    value: "DV_CON_BUOI",
  },
  {
    label: "Dịch vụ hết buổi",
    value: "DV_HET_BUOI",
  },
];

const MemberImportProducts = () => {
  let Stocks = useStore("Stocks");
  const { control } = useFormContext();

  const { fields } = useFieldArray({
    control,
    name: "SANPHAM",
  });

  return (
    fields &&
    fields.map((item, index) => (
      <Fragment key={item.id}>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Cơ sở</div>
          <div>
            <Controller
              name={`SANPHAM[${index}].CO_SO`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <>
                  <SelectPicker
                    placeholder="Chọn cơ sở"
                    value={field.value}
                    options={Stocks}
                    label="Cơ sở"
                    onChange={(val) => {
                      field.onChange(val);
                    }}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                  />
                </>
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Sản phẩm</div>
          <div>
            <Controller
              name={`SANPHAM[${index}].SAN_PHAM`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <SelectProductCardClients
                  placeholderInput="Tên sản phẩm"
                  placeholder="Chọn sản phẩm"
                  value={field.value}
                  label="Chọn sản phẩm"
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
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Số lượng</div>
          <div>
            <Controller
              name={`SANPHAM[${index}].SL`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={false}
                  placeholder="Nhập số lượng"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Tổng tiền</div>
          <div>
            <Controller
              name={`SANPHAM[${index}].TONG_TIEN`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Đã thanh toán</div>
          <div>
            <Controller
              name={`SANPHAM[${index}].DA_THANH_TOAN`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Ngày</div>
          <div>
            <Controller
              name={`SANPHAM[${index}].NGAY`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <DatePicker
                  format="DD-MM-YYYY"
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn ngày"
                  showHeader
                  clear
                />
              )}
            />
          </div>
        </div>
      </Fragment>
    ))
  );
};

const MemberImportServices = () => {
  let Stocks = useStore("Stocks");

  const { control, watch, resetField, setError, clearErrors } = useFormContext();
  const { fields } = useFieldArray({
    control,
    name: "DICHVU",
  });

  let { TypeOs, DICHVU } = watch();

  return (
    fields &&
    fields.map((item, index) => (
      <Fragment key={item.id}>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Cơ sở</div>
          <div>
            <Controller
              name={`DICHVU[${index}].CO_SO`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <SelectPicker
                  placeholder="Chọn cơ sở"
                  value={field.value}
                  options={Stocks}
                  label="Cơ sở"
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
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Dịch vụ</div>
          <div>
            <Controller
              name={`DICHVU[${index}].DICH_VU_THE`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <SelectServiceCardClients
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
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Số lượng</div>
          <div>
            <Controller
              name={`DICHVU[${index}].SL`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={false}
                  placeholder="Nhập số lượng"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Tổng tiền</div>
          <div>
            <Controller
              name={`DICHVU[${index}].TONG_TIEN`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Đã thanh toán</div>
          <div>
            <Controller
              name={`DICHVU[${index}].DA_THANH_TOAN`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Ngày</div>
          <div>
            <Controller
              name={`DICHVU[${index}].NGAY`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <DatePicker
                  format="DD-MM-YYYY"
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn ngày"
                  showHeader
                  clear
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Loại thẻ</div>
          <Controller
            name="TypeOs"
            control={control}
            render={({ field: { ref, ...field }, fieldState }) => (
              <SelectPicker
                placeholder="Chọn loại thẻ"
                options={OptionsTypeService}
                label="Loại thẻ"
                value={
                  field.value
                    ? OptionsTypeService.filter(
                        (x) => x.value === field.value
                      )[0]
                    : null
                }
                onChange={(val) => {
                  let newValue = [...DICHVU];
                  if (val.value === "DV_DANG_BH") {
                    newValue[0].BUOI_BH_DA_LAM = "";
                    newValue[0].HAN_BAO_HANH = "";
                    newValue[0].BUOI_CON = "";
                    newValue[0].HAN_THE = "";
                  }
                  if (val.value === "DV_CON_BUOI") {
                    newValue[0].BUOI_BH_DA_LAM = "";
                    newValue[0].HAN_BAO_HANH = "";
                    newValue[0].BUOI_CON = "";
                    newValue[0].HAN_THE = "";
                  }
                  if (val.value === "DV_HET_BUOI") {
                    newValue[0].BUOI_BH_DA_LAM = "";
                    newValue[0].HAN_BAO_HANH = "";
                    newValue[0].BUOI_CON = 0;
                    newValue[0].HAN_THE = "";
                  }
                  field.onChange(val ? val.value : "");
                  resetField("DICHVU", { defaultValue: newValue });
                }}
                errorMessage={fieldState?.error?.message}
                errorMessageForce={fieldState?.invalid}
                autoHeight
              />
            )}
          />
        </div>
        {TypeOs === "DV_CON_BUOI" && (
          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Buổi còn</div>
            <div>
              <Controller
                name={`DICHVU[${index}].BUOI_CON`}
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <div>
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
                      placeholder="Nhập số buổi"
                      value={field.value}
                      onValueChange={(val) => {
                        clearErrors(`DICHVU[${index}].BUOI_CON`);
                        field.onChange(val.floatValue || "");
                        if (DICHVU[index].DICH_VU_THE) {
                          let { source } = DICHVU[index].DICH_VU_THE;
                          if (source.Combo) {
                            let Combo = JSON.parse(source.Combo);
                            if (Combo && Combo.length === 1) {
                              let { qty } = {
                                qty: Number(Combo[0].qty),
                              };
                              let Total = qty * Number(DICHVU[index]?.SL);
                              if (val.floatValue > Total) {
                                setError(`DICHVU[${index}].BUOI_CON`, {
                                  type: "Client",
                                  message: "Số buổi còn vượt quá tổng số buổi.",
                                });
                              }
                            }
                          }
                        }
                      }}
                    />
                    {fieldState?.invalid && fieldState?.error?.message && (
                      <div className="mt-1.5 text-xs font-light text-danger">
                        {fieldState?.error?.message}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        )}
        {TypeOs === "DV_DANG_BH" && (
          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Buổi bảo hành đã làm</div>
            <div>
              <Controller
                name={`DICHVU[${index}].BUOI_BH_DA_LAM`}
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <NumericFormat
                    className={clsx(
                      "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                      fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                    )}
                    type="text"
                    autoComplete="off"
                    thousandSeparator={false}
                    placeholder="Nhập số buổi"
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange(val.floatValue || "")
                    }
                  />
                )}
              />
            </div>
          </div>
        )}
        {TypeOs === "DV_DANG_BH" && (
          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Hạn bảo hành</div>
            <div>
              <Controller
                name={`DICHVU[${index}].HAN_BAO_HANH`}
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <DatePicker
                    format="DD-MM-YYYY"
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn ngày"
                    showHeader
                    clear
                  />
                )}
              />
            </div>
          </div>
        )}
        {TypeOs !== "DV_DANG_BH" && (
          <div className="mb-3.5 last:mb-0">
            <div className="mb-px">Hạn thẻ</div>
            <div>
              <Controller
                name={`DICHVU[${index}].HAN_THE`}
                control={control}
                render={({ field: { ref, ...field }, fieldState }) => (
                  <DatePicker
                    format="DD-MM-YYYY"
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn ngày"
                    showHeader
                    clear
                  />
                )}
              />
            </div>
          </div>
        )}
      </Fragment>
    ))
  );
};

const MemberImportCardMoney = () => {
  let Stocks = useStore("Stocks");

  const { control } = useFormContext();
  const { fields } = useFieldArray({
    control,
    name: "Thetien",
  });

  return (
    fields &&
    fields.map((item, index) => (
      <Fragment key={item.id}>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Cơ sở</div>
          <div>
            <Controller
              name={`Thetien[${index}].CO_SO`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <SelectPicker
                  placeholder="Chọn cơ sở"
                  value={field.value}
                  options={Stocks}
                  label="Cơ sở"
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
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Thẻ tiền</div>
          <Controller
            name={`Thetien[${index}].THE_TIEN`}
            control={control}
            render={({ field: { ref, ...field }, fieldState }) => (
              <SelectMoneyCardClients
                placeholderInput="Tên thẻ tiền"
                placeholder="Chọn thẻ tiền"
                value={field.value}
                label="Chọn thẻ tiền"
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
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Số lượng</div>
          <div>
            <Controller
              name={`Thetien[${index}].SL`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={false}
                  placeholder="Nhập số lượng"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Tổng tiền</div>
          <div>
            <Controller
              name={`Thetien[${index}].TONG_TIEN`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Đã thanh toán</div>
          <div>
            <Controller
              name={`Thetien[${index}].DA_THANH_TOAN`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Ngày</div>
          <div>
            <Controller
              name={`Thetien[${index}].NGAY`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <DatePicker
                  format="DD-MM-YYYY"
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn ngày"
                  showHeader
                  clear
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Đã tiêu sản phẩm</div>
          <div>
            <Controller
              name={`Thetien[${index}].DA_TIEU_SP`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
        <div className="mb-3.5 last:mb-0">
          <div className="mb-px">Đã tiêu dịch vụ</div>
          <div>
            <Controller
              name={`Thetien[${index}].DA_TIEU_DV`}
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <NumericFormat
                  className={clsx(
                    "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                    fieldState?.invalid ? "border-danger" : "border-[#d5d7da]"
                  )}
                  type="text"
                  autoComplete="off"
                  thousandSeparator={true}
                  placeholder="Nhập số tiền"
                  value={field.value}
                  onValueChange={(val) => field.onChange(val.floatValue || "")}
                />
              )}
            />
          </div>
        </div>
      </Fragment>
    ))
  );
};

function PosCreateOldCard({ f7route }) {
  let CrStocks = useStore("CrStocks");
  let Auth = useStore("Auth");

  const queryClient = useQueryClient();

  let buttonRef = useRef(null);

  const methods = useForm({
    defaultValues: {
      ...initialValues,
      DICHVU: [
        {
          ...initialValues.DICHVU[0],
          CO_SO: { ...CrStocks, label: CrStocks?.Title, value: CrStocks?.ID },
        },
      ],
      SANPHAM: [
        {
          ...initialValues.SANPHAM[0],
          CO_SO: { ...CrStocks, label: CrStocks?.Title, value: CrStocks?.ID },
        },
      ],
      Thetien: [
        {
          ...initialValues.Thetien[0],
          CO_SO: { ...CrStocks, label: CrStocks?.Title, value: CrStocks?.ID },
        },
      ],
    },
  });

  const { handleSubmit, watch, control, reset } = methods;
  let { Type, DICHVU, TypeOs } = watch();

  let { data } = useQuery({
    queryKey: ["ClientServiceTotal", { MemberID: f7route?.params?.id, DICHVU }],
    queryFn: async () => {
      let data = await appPOS.getProdOsUsage(f7route?.params?.id, [
        { ID: DICHVU[0].DICH_VU_THE?.value },
      ]);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: Boolean(Type === "DICHVU" && DICHVU[0].DICH_VU_THE),
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.createOldCardClient(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: f7route?.params?.id,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    let dataPost = {
      members: [
        {
          MemberID: f7route?.params?.id,
          Thetien: [],
          DICHVU: [],
          SANPHAM: [],
        },
      ],
    };
    if (values.Type === "SANPHAM") {
      dataPost.members[0][values.Type] = values[values.Type].map((x) => ({
        ...x,
        CO_SO: x.CO_SO ? x.CO_SO.label : "",
        SAN_PHAM: x.SAN_PHAM ? x.SAN_PHAM.label : "",
        NGAY: x.NGAY ? moment(x.NGAY).format("DD/MM/YYYY") : "",
        SL: x.SL || 0,
        TONG_TIEN: x.TONG_TIEN || 0,
        DA_THANH_TOAN: x.DA_THANH_TOAN || 0,
      }));
    }
    if (values.Type === "DICHVU") {
      dataPost.members[0][values.Type] = values[values.Type].map((x) => ({
        ...x,
        CO_SO: x.CO_SO ? x.CO_SO.label : "",
        DICH_VU_THE: x.DICH_VU_THE ? x.DICH_VU_THE.label : "",
        HAN_BAO_HANH: x.HAN_BAO_HANH
          ? moment(x.HAN_BAO_HANH).format("DD/MM/YYYY")
          : "",
        HAN_THE: x.HAN_THE ? moment(x.HAN_THE).format("DD/MM/YYYY") : "",
        NGAY: x.NGAY ? moment(x.NGAY).format("DD/MM/YYYY") : "",
        BUOI_CON: x.BUOI_CON || 0,
        BUOI_BH_DA_LAM: x.BUOI_BH_DA_LAM || null,
        SL: x.SL || 0,
        TONG_TIEN: x.TONG_TIEN || 0,
        DA_THANH_TOAN: x.DA_THANH_TOAN || 0,
      }));
    }
    if (values.Type === "Thetien") {
      dataPost.members[0][values.Type] = values[values.Type].map((x) => ({
        ...x,
        CO_SO: x.CO_SO ? x.CO_SO.label : "",
        THE_TIEN: x.THE_TIEN ? x.THE_TIEN.label : "",
        NGAY: x.NGAY ? moment(x.NGAY).format("DD/MM/YYYY") : "",
        SL: x.SL || 0,
        TONG_TIEN: x.TONG_TIEN || 0,
        DA_THANH_TOAN: x.DA_THANH_TOAN || 0,
        DA_TIEU_SP: x.DA_TIEU_SP || 0,
        DA_TIEU_DV: x.DA_TIEU_DV || 0,
      }));
    }
    updateMutation.mutate(
      {
        data: dataPost,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.error) {
            toast.error("Dữ liệu thêm mới không hợp lệ.");
          } else {
            toast.success(
              `Đã thêm mới ${data.THEM_MOI}, đã cập nhật ${data.CAP_NHAT}`
            );
            reset({
              ...initialValues,
              DICHVU: [
                {
                  ...initialValues.DICHVU[0],
                  CO_SO: {
                    ...CrStocks,
                    label: CrStocks?.Title,
                    value: CrStocks?.ID,
                  },
                },
              ],
              SANPHAM: [
                {
                  ...initialValues.SANPHAM[0],
                  CO_SO: {
                    ...CrStocks,
                    label: CrStocks?.Title,
                    value: CrStocks?.ID,
                  },
                },
              ],
              Thetien: [
                {
                  ...initialValues.Thetien[0],
                  CO_SO: {
                    ...CrStocks,
                    label: CrStocks?.Title,
                    value: CrStocks?.ID,
                  },
                },
              ],
            });
          }
        },
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="Pos-create-old"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      noToolbar
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
        <NavTitle>Tạo thẻ cũ</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full pb-safe-b"
          autoComplete="off"
        >
          <div className="p-4 overflow-auto grow">
            <div className="mb-3.5 last:mb-0">
              <div className="mb-px">Loại thẻ</div>
              <Controller
                name="Type"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectPicker
                    isClearable={false}
                    autoHeight
                    placeholder="Chọn loại"
                    value={
                      field.value
                        ? Types.filter((x) => x.value === field.value)[0]
                        : null
                    }
                    options={Types}
                    label="Chọn loại"
                    onChange={(val) => {
                      //field.onChange(val?.value);
                      reset({
                        ...initialValues,
                        Type: val?.value,
                        DICHVU: [
                          {
                            ...initialValues.DICHVU[0],
                            CO_SO: {
                              ...CrStocks,
                              label: CrStocks?.Title,
                              value: CrStocks?.ID,
                            },
                          },
                        ],
                        SANPHAM: [
                          {
                            ...initialValues.SANPHAM[0],
                            CO_SO: {
                              ...CrStocks,
                              label: CrStocks?.Title,
                              value: CrStocks?.ID,
                            },
                          },
                        ],
                        Thetien: [
                          {
                            ...initialValues.Thetien[0],
                            CO_SO: {
                              ...CrStocks,
                              label: CrStocks?.Title,
                              value: CrStocks?.ID,
                            },
                          },
                        ],
                      });
                    }}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                  />
                )}
              />
            </div>
            {Type === "SANPHAM" && <MemberImportProducts />}
            {Type === "DICHVU" && <MemberImportServices />}
            {Type === "Thetien" && <MemberImportCardMoney />}
          </div>

          <div className="p-4">
            <button ref={buttonRef} className="hidden" type="submit"></button>
            {Type === "DICHVU" && (
              <PickerPreviewOldCard
                data={DICHVU[0]}
                MemberID={f7route?.params?.id}
                updateMutation={updateMutation}
                TypeOs={TypeOs}
                buttonRef={buttonRef}
              >
                {({ open }) => (
                  <Button
                    onClick={open}
                    type="button"
                    className="rounded-full bg-app"
                    fill
                    large
                    preloader
                    loading={updateMutation.isLoading}
                    disabled={updateMutation.isLoading}
                  >
                    Tạo thẻ cũ
                  </Button>
                )}
              </PickerPreviewOldCard>
            )}
            {Type !== "DICHVU" && (
              <Button
                type="submit"
                className="rounded-full bg-app"
                fill
                large
                preloader
                loading={updateMutation.isLoading}
                disabled={updateMutation.isLoading}
              >
                Tạo thẻ cũ
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </Page>
  );
}

export default PosCreateOldCard;

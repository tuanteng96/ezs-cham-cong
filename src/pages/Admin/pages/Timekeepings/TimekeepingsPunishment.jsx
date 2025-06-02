import React, { useRef, useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  Button,
  f7,
  Link,
  Navbar,
  NavLeft,
  NavTitle,
  Page,
  PhotoBrowser,
  Subnavbar,
} from "framework7-react";
import {
  ChevronLeftIcon,
  InformationCircleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "react-query";
import ConfigsAPI from "@/api/Configs.api";
import { toast } from "react-toastify";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { MenuSubNavbar } from "../Pos/components";
import clsx from "clsx";
import { NumericFormat } from "react-number-format";
import AssetsHelpers from "@/helpers/AssetsHelpers";

let OptionsMethod = [
  {
    label: "{UNIT} mỗi phút {GT}",
    value: "MOI_PHUT",
  },
  {
    label: "{UNIT} theo ngưỡng {GT}",
    value: "PHAT_THEO_NGUONG",
  },
];

let initialValueOption = {
  Type: "MOI_PHUT",
  Options: [
    {
      FromMinute: 0,
      ToMinute: 1440,
      Value: "",
      Method: "",
    },
  ],
};

const getByNameVi = (name) => {
  switch (name) {
    case "DI_SOM":
      return "đi sớm";
    case "DI_MUON":
      return "đi muộn";
    case "VE_SOM":
      return "về sớm";
    case "VE_MUON":
      return "về muộn";
    default:
  }
};

const getUnit = (name) => {
  if (name === "DI_SOM" || name === "VE_MUON") {
    return "Thưởng";
  }
  return "Phạt";
};

function FieldArrayTimekeepings({ name, Value }) {
  const { control, setValue, watch } = useFormContext();
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control, // control props comes from useForm (optional: if you are using FormProvider)
      name: name, // unique name for your Field Array
    }
  );

  return (
    <div>
      {fields &&
        fields.map((item, index) => (
          <div className="p-4 border-b last:border-0" key={item.id}>
            <div className="flex gap-4 mb-4 last:mb-0">
              <div>
                <div className="mb-1 capitalize">
                  {getByNameVi(item)} Từ (Phút)
                </div>
                <div className="relative">
                  <Controller
                    name={`${name}[${index}].FromMinute`}
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
                          thousandSeparator={false}
                          placeholder="Nhập số phút"
                          value={field.value}
                          onValueChange={(val) =>
                            field.onChange(
                              typeof val.floatValue !== "undefined"
                                ? val.floatValue
                                : ""
                            )
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
              <div>
                <div className="mb-1 capitalize">
                  {getByNameVi(item)} Đến (Phút)
                </div>
                <div className="relative">
                  <Controller
                    name={`${name}[${index}].ToMinute`}
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
                          thousandSeparator={false}
                          placeholder="Nhập số phút"
                          value={field.value}
                          onValueChange={(val) =>
                            field.onChange(
                              typeof val.floatValue !== "undefined"
                                ? val.floatValue
                                : ""
                            )
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
            </div>
            <div className="flex items-end gap-4 mb-4 last:mb-0">
              <div className="flex-1">
                <div className="mb-1">Giá trị {getUnit(item)}</div>
                <Controller
                  name={`${name}[${index}].Value`}
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
                        allowLeadingZeros
                        thousandSeparator={true}
                        placeholder="Nhập giá trị"
                        value={field.value}
                        onValueChange={(val) =>
                          field.onChange(
                            typeof val.floatValue !== "undefined"
                              ? val.floatValue
                              : ""
                          )
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
              <button
                disabled={
                  watch()[Value].Options.length === 1 &&
                  item.FromMinute === "" &&
                  item.ToMinute === "" &&
                  item.Value === ""
                }
                type="button"
                className="flex justify-center w-12 h-12 px-2 py-2 text-white rounded bg-danger disabled:opacity-40"
                onClick={() => {
                  if (watch()[Value].Options.length === 1) {
                    setValue(`${name}`, [
                      {
                        FromMinute: "",
                        ToMinute: "",
                        Value: "",
                        Method: "",
                      },
                    ]);
                  } else {
                    remove(index);
                  }
                }}
              >
                <TrashIcon className="w-6" />
              </button>
            </div>
            {fields.length -1 === index && (
              <div className="mb-4 last:mb-0">
                <button
                  className="px-2 py-2 text-white rounded bg-success"
                  type="button"
                  onClick={() => {
                    append({
                      FromMinute: "",
                      ToMinute: "",
                      Value: "",
                      Method: "",
                    });
                  }}
                >
                  Thêm ngưỡng
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function TimekeepingsPunishment({ f7route }) {
  const [active, setActive] = useState("DI_MUON");

  const standalone = useRef(null);

  const methods = useForm({
    defaultValues: {
      DI_SOM: initialValueOption,
      DI_MUON: initialValueOption,
      VE_SOM: initialValueOption,
      VE_MUON: initialValueOption,
    },
  });

  const { control, handleSubmit, reset, setValue, watch } = methods;

  let watchValue = watch();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["TimekeepingsPunishment"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("congcaconfig");
      let result = null;
      if (data?.data && data.data.length > 0) {
        let { Value } = data?.data[0];
        if (Value) {
          result = Value
            ? JSON.parse(Value)
            : {
                DI_SOM: initialValueOption,
                DI_MUON: initialValueOption,
                VE_SOM: initialValueOption,
                VE_MUON: initialValueOption,
              };
        }
      }
      return {
        DI_SOM:
          Array.isArray(result?.DI_SOM) && result?.DI_SOM.length > 0
            ? mapOptions(result?.DI_SOM)
            : initialValueOption,
        DI_MUON:
          Array.isArray(result?.DI_MUON) && result?.DI_MUON.length > 0
            ? mapOptions(result?.DI_MUON)
            : initialValueOption,
        VE_SOM:
          Array.isArray(result?.VE_SOM) && result?.VE_SOM.length > 0
            ? mapOptions(result?.VE_SOM)
            : initialValueOption,
        VE_MUON:
          Array.isArray(result?.VE_MUON) && result?.VE_MUON.length > 0
            ? mapOptions(result?.VE_MUON)
            : initialValueOption,
      };
    },
    onSuccess: (rs) => {
      reset(rs);
    },
  });

  const mapOptions = (arr) => {
    let obj = {
      Type: "",
      Options: [],
    };
    if (arr && arr.length > 0) {
      let isType = arr.some((x) => typeof x.Method === "undefined");
      if (isType) {
        obj.Type = "PHAT_THEO_NGUONG";
      } else {
        obj.Type = arr[0].Method;
      }
      for (let key of arr) {
        let newKey = { ...key };
        if (key.Method === "MOI_PHUT" && newKey.Value) {
          newKey.Value = newKey.Value * -1;
        }
        obj.Options.push(newKey);
      }
    } else {
      obj = {
        Type: "MOI_PHUT",
        Options: [
          {
            FromMinute: 0,
            ToMinute: 1440,
            Value: "",
            Method: "",
          },
        ],
      };
    }
    return obj;
  };

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      await refetch();
      return data;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let newValues = {};
    for (const obj in values) {
      newValues[obj] = values[obj].Options.map((x) => ({
        ...x,
        Value: values[obj].Type === "MOI_PHUT" ? x.Value * -1 : x.Value,
        Method: values[obj].Type,
      })).filter(
        (x) => x.Value !== "" && x.FromMinute !== "" && x.ToMinute !== ""
      );
    }
    updateMutation.mutate(
      { data: newValues, name: "congcaconfig" },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công");
          f7.dialog.close();
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
    <Page
      className="!bg-white"
      name="Timekeepings-shift"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
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
        <NavTitle>Thưởng / Phạt</NavTitle>
        <Subnavbar className="[&>div]:shadow-lg [&>div]:!px-4">
          <MenuSubNavbar
            data={[
              {
                ID: "DI_MUON",
                Key: "DI_MUON",
                Title: "Đi muộn",
                visibleCount: true,
              },
              {
                ID: "VE_SOM",
                Key: "VE_SOM",
                Title: "Về sớm",
                visibleCount: true,
              },
              {
                ID: "DI_SOM",
                Key: "DI_SOM",
                Title: "Tăng ca đi sớm",
                visibleCount: true,
              },
              {
                ID: "VE_MUON",
                Key: "VE_MUON",
                Title: "Tăng ca về muộn",
                visibleCount: true,
              },
            ]}
            selected={active}
            setSelected={(val) => {
              let result = data;
              let values = watchValue;

              if (
                JSON.stringify({
                  ...result[active],
                  Options: result[active].Options.filter(
                    (x) =>
                      x.Value !== "" && x.FromMinute !== "" && x.ToMinute !== ""
                  ),
                }) ===
                JSON.stringify({
                  ...values[active],
                  Options: values[active].Options.filter(
                    (x) =>
                      x.Value !== "" && x.FromMinute !== "" && x.ToMinute !== ""
                  ),
                })
              ) {
                setActive(val);
              } else {
                f7.dialog.confirm(
                  `Bạn có muốn thực hiện lưu thay đổi tại cấu hình ${getByNameVi(
                    active
                  )}`,
                  () => {
                    f7.dialog.preloader("Đang thực hiện ...");
                    let newValues = {};
                    for (const obj in values) {
                      newValues[obj] = values[obj].Options.map((x) => ({
                        ...x,
                        Value:
                          values[obj].Type === "MOI_PHUT"
                            ? x.Value * -1
                            : x.Value,
                        Method: values[obj].Type,
                      })).filter(
                        (x) =>
                          x.Value !== "" &&
                          x.FromMinute !== "" &&
                          x.ToMinute !== ""
                      );
                    }
                    updateMutation.mutate(
                      { data: newValues, name: "congcaconfig" },
                      {
                        onSuccess: () => {
                          toast.success("Cập nhật thành công");
                          f7.dialog.close();
                          setActive(val);
                        },
                      }
                    );
                  },
                  () => {
                    setActive(val);
                  }
                );
              }
            }}
          />
        </Subnavbar>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          className="flex flex-col h-full pb-safe-b"
          onSubmit={handleSubmitWithoutPropagation}
        >
          <div className="p-4 overflow-auto grow">
            {Object.keys(watchValue).map((item, index) => (
              <div className={clsx(item !== active && "hidden")} key={index}>
                {OptionsMethod.map((method, index) => (
                  <div
                    className="border border-[#efefef] rounded mb-3 last:!mb-0 overflow-hidden"
                    key={index}
                  >
                    <div className="bg-gray-100 p-[16px] cursor-pointer flex items-center gap-3">
                      <label
                        className="inline-flex items-center"
                        onClick={() => {
                          setValue(`${item}.Type`, method.value);
                          setValue(`${item}.Options`, [
                            {
                              FromMinute: method.value === "MOI_PHUT" ? 0 : "",
                              ToMinute: method.value === "MOI_PHUT" ? 1440 : "",
                              Value: "",
                              Method: "",
                            },
                          ]);
                        }}
                      >
                        <div
                          className={clsx(
                            "relative w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
                            watchValue[item].Type === method.value
                              ? "after:translate-x-full bg-primary"
                              : "bg-gray-200"
                          )}
                        />
                      </label>

                      <div className="text-[15px] font-medium">
                        {method.label
                          .replaceAll("{GT}", getByNameVi(item))
                          .replaceAll("{UNIT}", getUnit(item))}
                      </div>
                      {method.value !== "MOI_PHUT" && (
                        <>
                          <div onClick={() => standalone?.current?.open()}>
                            <InformationCircleIcon className="w-5 text-warning" />
                          </div>
                          <PhotoBrowser
                            photos={[
                              {
                                url: AssetsHelpers.toAbsoluteUrl(
                                  `/Admin/UserWork/huong-dan-${active}.png`,
                                  ""
                                ),
                              },
                            ]}
                            // thumbs={
                            //   OsImages?.data
                            //     ? OsImages?.data.map((x) => AssetsHelpers.toAbsoluteUrl(x.Src))
                            //     : []
                            // }
                            ref={standalone}
                            navbarShowCount={true}
                            toolbar={false}
                          />
                        </>
                      )}
                    </div>
                    {watchValue[item]?.Type === method.value && (
                      <div>
                        {watchValue[item]?.Type === "MOI_PHUT" ? (
                          <div className="p-4">
                            <div className="mb-4 last:mb-0">
                              <div className="mb-1 capitalize">
                                {getByNameVi(item)} từ phút thứ
                              </div>
                              <div className="relative">
                                <Controller
                                  name={`${item}.Options[${0}].FromMinute`}
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
                                        thousandSeparator={false}
                                        placeholder="Nhập số phút"
                                        value={field.value}
                                        onValueChange={(val) =>
                                          field.onChange(
                                            typeof val.floatValue !==
                                              "undefined"
                                              ? val.floatValue
                                              : ""
                                          )
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
                            <div className="mb-4 last:mb-0">
                              <div className="mb-1">
                                Giá trị {getUnit(item)} trên mỗi phút
                              </div>
                              <Controller
                                name={`${item}.Options[${0}].Value`}
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
                                      allowLeadingZeros
                                      thousandSeparator={true}
                                      placeholder="Nhập giá trị"
                                      value={field.value}
                                      onValueChange={(val) =>
                                        field.onChange(
                                          typeof val.floatValue !== "undefined"
                                            ? val.floatValue
                                            : ""
                                        )
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
                        ) : (
                          <FieldArrayTimekeepings
                            name={`${item}.Options`}
                            Value={item}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="p-4">
            <Button
              type="submit"
              className="rounded-full bg-app"
              fill
              large
              preloader
              loading={updateMutation.isLoading}
              disabled={updateMutation.isLoading}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </FormProvider>
    </Page>
  );
}

export default TimekeepingsPunishment;

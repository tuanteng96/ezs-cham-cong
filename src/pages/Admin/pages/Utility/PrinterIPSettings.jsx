import {
  Button,
  Input,
  Link,
  NavLeft,
  NavRight,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import KeyboardsHelper from "../../../../helpers/KeyboardsHelper";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { PatternFormat } from "react-number-format";
import clsx from "clsx";
import ConfigsAPI from "@/api/Configs.api";

function PrinterIPSettings(props) {
  const CrStocks = useStore("CrStocks");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      Printers: [
        {
          Name: "",
          IpAddress: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "Printers",
  });

  const PrintersConfigs = useQuery({
    queryKey: ["PrintersConfigs", CrStocks],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`ipprinter`);
      let rs = [];
      if (data && data.data && data.data.length > 0) {
        let JSONString = data.data[0].Value;
        if (JSONString) {
          rs = JSON.parse(JSONString);
        }
      }
      return rs;
    },
  });

  useEffect(() => {
    if (PrintersConfigs?.data) {
      let index = PrintersConfigs?.data?.findIndex(
        (x) => x.StockID === CrStocks?.ID
      );

      if (index > -1) {
        reset({
          Printers:
            PrintersConfigs?.data[index]?.Printers &&
            PrintersConfigs?.data[index]?.Printers.length > 0
              ? PrintersConfigs?.data[index]?.Printers
              : [
                  {
                    Name: "",
                    IpAddress: "",
                  },
                ],
        });
      }
    }
  }, [PrintersConfigs?.data, CrStocks]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      await PrintersConfigs.refetch();
      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = [...PrintersConfigs?.data];
    let newPrinters = {
      StockID: CrStocks?.ID,
      StockTitle: CrStocks?.Title,
      Printers: values?.Printers || null,
    };

    if (newValues && newValues.length > 0) {
      let index = newValues.findIndex((x) => x.StockID === CrStocks?.ID);
      if (index > -1) {
        newValues[index] = newPrinters;
      } else {
        newValues.push(newPrinters);
      }
    } else {
      newValues.push(newPrinters);
    }

    updateMutation.mutate(
      { data: newValues, name: "ipprinter" },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công");
        },
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="Printer-IP-Setting"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
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
          Cài đặt IP máy in
        </NavLeft>
        <NavRight className="h-full pr-4">
          <Link
            onClick={() =>
              append({
                Name: "",
                IpAddress: "",
              })
            }
            noLinkClass
            className="!text-white flex item-center justify-center bg-success text-[14px] h-8 px-2 rounded items-center"
          >
            Thêm máy in
          </Link>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4 overflow-auto grow">
          <div className="bg-[#fff4de] p-4 text-warning flex item-center rounded mb-4">
            <ExclamationTriangleIcon className="w-7" />
            <div className="flex-1 pl-3">
              <span className="font-light">
                Bạn đang cấu hình IP máy in tại cơ sở
              </span>
              <span className="pl-2 font-semibold">{CrStocks?.Title}</span>
            </div>
          </div>
          <div>
            {fields &&
              fields.map((item, index) => (
                <div
                  className="relative p-4 mb-4 border rounded last:mb-0"
                  key={item.id}
                >
                  <div
                    className="absolute z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-xl right-2 -top-4 text-danger"
                    onClick={() =>
                      f7.dialog.confirm("Xác nhận xoá máy in ?", () => {
                        remove(index);
                      })
                    }
                  >
                    <XCircleIcon className="w-6" />
                  </div>
                  <div className="mb-3">
                    <div className="mb-px font-light">Tên máy in</div>
                    <Controller
                      rules={{
                        required: true,
                      }}
                      name={`Printers[${index}].Name`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:placeholder:normal-case"
                          type="text"
                          placeholder="Nhập tên máy in"
                          value={field.value}
                          errorMessage={
                            fieldState?.invalid && "Vui lòng nhập tên máy in"
                          }
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                          clearButton={fieldState?.invalid}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Controller
                      rules={{
                        required: true,
                      }}
                      name={`Printers[${index}].IpAddress`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:placeholder:normal-case"
                          type="text"
                          placeholder="Nhập IP máy in"
                          value={field.value}
                          errorMessage={
                            fieldState?.invalid && "Vui lòng nhập IP máy in"
                          }
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                          clearButton={fieldState?.invalid}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}
          </div>
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
            Lưu cài đặt
          </Button>
        </div>
      </form>
    </Page>
  );
}

export default PrinterIPSettings;

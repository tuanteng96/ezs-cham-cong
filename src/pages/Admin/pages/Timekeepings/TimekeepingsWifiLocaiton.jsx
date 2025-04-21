import React, { useEffect, useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  Button,
  f7,
  Input,
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
  Popover,
  useStore,
} from "framework7-react";
import {
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "react-query";
import ConfigsAPI from "@/api/Configs.api";
import { toast } from "react-toastify";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";

function TimekeepingsWifiLocaiton({ f7route }) {
  const queryClient = useQueryClient();

  const StocksAll = useStore("StocksAll");

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      Updated: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "Updated",
  });

  useEffect(() => {
    reset({
      Updated: StocksAll,
    });
  }, [StocksAll]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.updateLatLng(body);
      await queryClient.invalidateQueries(["Auth"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    updateMutation.mutate(
      {
        updated: values.Updated.map((x) => ({
          ID: x.ID,
          Lat: x.Lat || 0,
          Lng: x.Lng || 0,
          WifiName: x.WifiName || "",
          WifiID: x.WifiID || "",
        })),
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật thành công.");
        },
      }
    );
  };

  return (
    <Page
      className="!bg-white"
      name="Timekeepings"
      noToolbar
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
        </NavLeft>
        <NavTitle>Định vị - Wifi</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col h-full pb-safe-b"
        autoComplete="off"
      >
        <div className="p-4 overflow-auto grow">
          {fields &&
            fields.map((item, index) => (
              <div
                className="border rounded shadow mb-3.5 last:mb-0"
                key={item.id}
              >
                <div className="flex items-center px-4 py-3.5 bg-gray-100 border-b text-[15px] font-medium">
                  {item.Title}
                </div>
                <div className="p-4">
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px font-light">Latitude</div>
                    <Controller
                      name={`Updated[${index}].Lat`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:lowercase [&_input]:placeholder:normal-case"
                          type="number"
                          placeholder="Nhập Latitude"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                          // clearButton={true}
                        />
                      )}
                    />
                    <div className="mt-1.5 font-light text-[#999] text-[13px]">
                      Latitude tại ví trị hiện tại vui lòng
                      <span
                        className="pl-1 font-normal underline text-primary"
                        onClick={() => {
                          PromHelpers.GET_LOCATION()
                            .then(({ data }) => {
                              setValue(`Updated[${index}].Lat`, data.latitude);
                            })
                            .catch((error) => {
                              f7.dialog.alert(
                                "Vui lòng bật vị trí của ứng dụng."
                              );
                            });
                        }}
                      >
                        bấm vào đây
                      </span>
                      .
                    </div>
                  </div>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px font-light">Longitude</div>
                    <Controller
                      name={`Updated[${index}].Lng`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:lowercase [&_input]:placeholder:normal-case"
                          type="number"
                          placeholder="Nhập Longitude"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                          // clearButton={true}
                        />
                      )}
                    />
                    <div className="mt-1.5 font-light text-[#999] text-[13px]">
                      Longitude tại ví trị hiện tại vui lòng
                      <span
                        className="pl-1 font-normal underline text-primary"
                        onClick={() => {
                          PromHelpers.GET_LOCATION()
                            .then(({ data }) => {
                              setValue(`Updated[${index}].Lng`, data.longitude);
                            })
                            .catch((error) => {
                              f7.dialog.alert(
                                "Vui lòng bật vị trí của ứng dụng."
                              );
                            });
                        }}
                      >
                        bấm vào đây
                      </span>
                      .
                    </div>
                  </div>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px font-light">Tên Wifi</div>
                    <Controller
                      name={`Updated[${index}].WifiName`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:lowercase [&_input]:placeholder:normal-case"
                          type="text"
                          placeholder="Nhập tên Wifi"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                          // clearButton={true}
                        />
                      )}
                    />
                    <div className="mt-1.5 font-light text-[#999] text-[13px]">
                      Lấy tên Wifi hiện tại vui lòng
                      <span
                        className="pl-1 font-normal underline text-primary"
                        onClick={() => {
                          PromHelpers.GET_NETWORK_TYPE()
                            .then(({ data }) => {
                              setValue(
                                `Updated[${index}].WifiName`,
                                window.PlatformId === "ANDROID"
                                  ? data.SSID
                                  : data.SSID
                              );
                            })
                            .catch((error) => {
                              f7.dialog.alert(
                                "Vui lòng bật vị trí của ứng dụng."
                              );
                            });
                        }}
                      >
                        bấm vào đây
                      </span>
                      .
                    </div>
                  </div>
                  <div className="mb-3.5 last:mb-0">
                    <div className="mb-px font-light">ID truy cập Wifi</div>
                    <Controller
                      name={`Updated[${index}].WifiID`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:lowercase [&_input]:placeholder:normal-case font-lato font-medium"
                          type="text"
                          placeholder="Nhập ID truy cập Wifi"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                          // clearButton={true}
                        />
                      )}
                    />
                    <div className="mt-1.5 font-light text-[#999] text-[13px]">
                      Lấy ID Wifi hiện tại vui lòng
                      <span
                        className="pl-1 font-normal underline text-primary"
                        onClick={() => {
                          PromHelpers.GET_NETWORK_TYPE()
                            .then(({ data }) => {
                              setValue(
                                `Updated[${index}].WifiID`,
                                data.BSSID
                              );
                            })
                            .catch((error) => {
                              f7.dialog.alert(
                                "Vui lòng bật vị trí của ứng dụng."
                              );
                            });
                        }}
                      >
                        bấm vào đây
                      </span>
                      .
                    </div>
                  </div>
                </div>
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
    </Page>
  );
}

export default TimekeepingsWifiLocaiton;

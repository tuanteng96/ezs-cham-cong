import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  ChevronLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
import KeyboardsHelper from "../../../../helpers/KeyboardsHelper";
import AdminAPI from "../../../../api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";

function TimekeepingSettings(props) {
  const CrStocks = useStore("CrStocks");
  
  const queryClient = useQueryClient();
  const { control, handleSubmit, setValue } = useForm({
    defaultValues: {
      ID: CrStocks?.ID || "",
      Lat: CrStocks?.Lat || "",
      Lng: CrStocks?.Lng || "",
      WifiName: CrStocks?.WifiName || "",
      WifiID: CrStocks?.WifiID || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body) => AdminAPI.updateLatLngWifi(body),
  });

  const onSubmit = (values) => {
    updateMutation.mutate({updated: [values]}, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["Auth"] }).then(() => {
          toast.success("Lưu cài đặt thành công.");
        });
      },
    });
  };

  return (
    <Page
      className="bg-white"
      name="Timekeeping-Settings"
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
        <NavTitle>Cài đặt công ca - Wifi</NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4 overflow-auto grow">
          <div className="bg-[#fff4de] p-4 text-warning flex item-center rounded mb-4">
            <ExclamationTriangleIcon className="w-7" />
            <div className="flex-1 pl-3">
              <span className="font-light">
                Bạn đang cấu hình chấm công tại cơ sở
              </span>
              <span className="pl-2 font-semibold">{CrStocks?.Title}</span>
            </div>
          </div>
          <div className="mb-4">
            <div className="mb-px font-light">Latitude</div>
            <Controller
              name="Lat"
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
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
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
                      setValue("Lat", data.latitude);
                    })
                    .catch((error) => {
                      f7.dialog.alert("Vui lòng bật vị trí của ứng dụng.");
                    });
                }}
              >
                bấm vào đây
              </span>
              .
            </div>
          </div>
          <div className="mb-4">
            <div className="mb-px font-light">Longitude</div>
            <Controller
              name="Lng"
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
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
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
                      setValue("Lng", data.longitude);
                    })
                    .catch((error) => {
                      f7.dialog.alert("Vui lòng bật vị trí của ứng dụng.");
                    });
                }}
              >
                bấm vào đây
              </span>
              .
            </div>
          </div>
          <div className="mb-4">
            <div className="mb-px font-light">Tên Wifi</div>
            <Controller
              name="WifiName"
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
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
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
                      setValue("WifiName", window.PlatformId === "ANDROID" ? data.SSID : data.SSID);
                    })
                    .catch((error) => {
                      f7.dialog.alert("Vui lòng bật vị trí của ứng dụng.");
                    });
                }}
              >
                bấm vào đây
              </span>
              .
            </div>
          </div>
          <div>
            <div className="mb-px font-light">ID truy cập Wifi</div>
            <Controller
              name="WifiID"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  className="[&_input]:rounded [&_input]:lowercase [&_input]:placeholder:normal-case"
                  type="text"
                  placeholder="Nhập ID truy cập Wifi"
                  value={field.value}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  onInput={field.onChange}
                  onFocus={(e) =>
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
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
                      setValue("WifiID", data.BSSID);
                    })
                    .catch((error) => {
                      f7.dialog.alert("Vui lòng bật vị trí của ứng dụng.");
                    });
                }}
              >
                bấm vào đây
              </span>
              .
            </div>
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

export default TimekeepingSettings;

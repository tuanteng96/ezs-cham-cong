import { Button, Input, Page, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import AuthAPI from "../../api/Auth.api";
import { useMutation } from "react-query";
import store from "../../js/store";
import DeviceHelpers from "../../helpers/DeviceHelpers";
import PromHelpers from "../../helpers/PromHelpers";
import SubscribeHelpers from "../../helpers/SubscribeHelpers";
import KeyboardsHelper from "../../helpers/KeyboardsHelper";
import Dom7 from "dom7";
import StorageHelpers from "../../helpers/StorageHelpers";
import { PickerOTP } from "./components";

const schemaLogin = yup
  .object({
    USN: yup.string().required("Vui lòng nhập tài khoản."),
    PWD: yup.string().required("Vui lòng nhập mật khẩu."),
  })
  .required();

function LoginPage({ f7router }) {
  const [hiddenPassword, setHiddenPassword] = useState(true);

  let Brand = useStore("Brand");

  const { control, handleSubmit, setError, setValue } = useForm({
    defaultValues: {
      USN: "",
      PWD: "",
    },
    resolver: yupResolver(schemaLogin),
  });

  useEffect(() => {
    StorageHelpers.get({
      keys: ["_historyU", "_historyP"],
      success: ({ _historyU, _historyP }) => {
        setValue("USN", _historyU || "");
        setValue("PWD", _historyP || "");
      },
    });
  }, []);

  const loginMutation = useMutation({
    mutationFn: (body) => AuthAPI.login(body),
  });

  let onSubmit = ({ values, open }) => {
    DeviceHelpers.get({
      success: ({ deviceId }) => {
        loginMutation.mutate(
          { ...values, DeviceID: deviceId },
          {
            onSuccess: ({ data }) => {
              if (data && data?.acc_type && data?.acc_type !== "M") {
                if (data?.Status !== -1) {
                  if (
                    data.ID === 10789 ||
                    data.ID === 1 ||
                    data?.DeviceIDs === deviceId
                  ) {
                    if (data?.opt_token) {
                      open({
                        Token: data?.opt_token,
                        Auth: data,
                        USN: values.USN,
                        PWD: values.PWD,
                      });
                    } else {
                      PromHelpers.SEND_TOKEN_FIREBASE().then(
                        ({ token, error }) => {
                          if (!error) {
                            var bodyFormData = new FormData();
                            bodyFormData.append("token", token);
                            AuthAPI.sendTokenFirebase({
                              ID: data.ID,
                              Type: data.acc_type,
                              bodyFormData,
                            }).then(() =>
                              store.dispatch("setAuth", data).then(() => {
                                f7router.navigate("/home/");
                                StorageHelpers.set({
                                  data: {
                                    _historyU: values.USN,
                                    _historyP: values.PWD,
                                  },
                                });
                              })
                            );
                          } else {
                            SubscribeHelpers.set(data).then(() =>
                              store.dispatch("setAuth", data).then(() => {
                                f7router.navigate("/home/");
                                StorageHelpers.set({
                                  data: {
                                    _historyU: values.USN,
                                    _historyP: values.PWD,
                                  },
                                });
                              })
                            );
                          }
                        }
                      );
                    }
                  } else {
                    setError("USN", {
                      type: "Server",
                      message:
                        "Tài khoản của bạn đang đăng nhập tại thiết bị khác.",
                    });
                  }
                } else {
                  setError("USN", {
                    type: "Server",
                    message: "Tài khoản của bạn đã bị vô hiệu hoá.",
                  });
                }
              } else {
                setError("USN", {
                  type: "Server",
                  message:
                    data?.error === "Yêu cầu đăng nhập"
                      ? "Tài khoản hoặc mật khẩu không hợp lệ."
                      : data?.error,
                });
                setValue("PWD", "");
              }
            },
            onError: (err) => {
              console.log(err);
            },
          }
        );
      },
      fail: (err) => console.log(err),
    });
  };

  const onToBack = () => {
    store.dispatch("setBrand", null).then(() => f7router.navigate("/brand/"));
  };

  return (
    <Page
      noNavbar
      noToolbar
      noSwipeback
      className="bg-white"
      onPageInit={() => f7.panel.close("#panel-app")}
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR()}
    >
      <PickerOTP>
        {({ open }) => (
          <div className="flex flex-col h-full page-scrollbar pb-safe-b">
            <div className="pt-safe-t">
              <div className="relative flex items-center justify-center h-12 px-4">
                <div
                  className="absolute left-0 flex items-center justify-center w-12 h-full"
                  onClick={onToBack}
                >
                  <ArrowLeftIcon className="w-6" />
                </div>
                <div className="text-base font-bold">{Brand?.Name}</div>
              </div>
            </div>
            <div className="flex flex-col justify-between h-[calc(100%-48px)]">
              <div className="flex flex-col items-center justify-center px-4 grow">
                <div className="mb-4 text-center">
                  <div className="mb-1 text-2xl font-bold">Xin chào.</div>
                  <div className="w-10/12 mx-auto font-light">
                    Để tiếp tục sử, vui lòng đăng nhập tài khoản của bạn tại
                    <span className="pl-2 font-semibold">{Brand?.Name}</span>.
                  </div>
                </div>
              </div>
              <div className="pt-4 pb-4 pl-4 pr-4">
                <form
                  onSubmit={handleSubmit((values) =>
                    onSubmit({
                      values,
                      open,
                    })
                  )}
                >
                  <div className="mb-4">
                    <div className="mb-px">Tài khoản</div>
                    <Controller
                      name="USN"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:placeholder:normal-case"
                          type="text"
                          placeholder="Nhập tài khoản"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          clearButton={true}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                        />
                      )}
                    />
                  </div>
                  <div className="mb-4">
                    <div className="mb-px">Mật khẩu</div>
                    <Controller
                      name="PWD"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="relative">
                          <Input
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type={hiddenPassword ? "password" : "text"}
                            placeholder="Nhập mật khẩu"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onChange={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "body",
                                Event: e,
                              })
                            }
                          />
                          <div
                            className="absolute w-12 h-[47px] right-0 top-0 flex items-center justify-center"
                            onClick={() => setHiddenPassword(!hiddenPassword)}
                          >
                            {hiddenPassword ? (
                              <EyeSlashIcon className="w-4" />
                            ) : (
                              <EyeIcon className="w-4" />
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-app"
                    fill
                    large
                    preloader
                    loading={loginMutation.isLoading}
                    disabled={loginMutation.isLoading}
                  >
                    Đăng nhập
                  </Button>
                </form>
                <div className="my-4 relative text-center after:content-[''] after:absolute after:w-full after:h-[1px] after:bg-[#f2f2f7] after:left-0 after:top-3">
                  <span className="relative z-10 px-4 bg-white text-muted">
                    Or
                  </span>
                </div>
                <Button
                  type="button"
                  className="text-white normal-case bg-black"
                  fill
                  large
                  onClick={onToBack}
                >
                  Chọn SPA
                </Button>
              </div>
            </div>
          </div>
        )}
      </PickerOTP>
    </Page>
  );
}

export default LoginPage;

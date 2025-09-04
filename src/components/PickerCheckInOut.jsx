import React, { useEffect, useRef, useState } from "react";
import PickerConfirm from "./PickerConfirm";
import {
  f7,
  useStore,
  Actions,
  ActionsGroup,
  ActionsLabel,
  ActionsButton,
} from "framework7-react";
import { useCheckInOut } from "@/hooks";
import WorkTrackAPI from "@/api/WorkTrack.api";
import { useMutation, useQueryClient } from "react-query";
import PromHelpers from "@/helpers/PromHelpers";
import clsx from "clsx";
import Dom7 from "dom7";
import DateTimeHelpers from "@/helpers/DateTimeHelpers";
import WorksHelpers from "@/helpers/WorksHelpers";
import moment from "moment";
import { toast } from "react-toastify";
import store from "@/js/store";
import AlertHelpers from "@/helpers/AlertHelpers";

function PickerCheckInOut({ children, onSuccess, onError }) {
  const [visible, setVisible] = useState(false);
  const [actionsGridOpened, setActionsGridOpened] = useState(false);
  const [ListHoursWork, setListHoursWork] = useState([]);
  const [Active, setActive] = useState(null);
  const [Option, setOption] = useState({});

  const queryClient = useQueryClient();
  let { CheckIn, CheckOut, CheckInStorage, CheckOutStorage } = useCheckInOut();

  const Brand = useStore("Brand");
  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");
  const WorkTimeSettings = useStore("WorkTimeSettings");

  const { WorkShiftsSetting, WorkTimeToday } = {
    WorkShiftsSetting: WorkTimeSettings?.WorkShiftsSetting || null,
    WorkTimeToday: WorkTimeSettings?.WorkTimeToday || null,
  };

  const actionsToPopover = useRef(null);
  const buttonToPopoverWrapper = useRef(null);

  useEffect(() => {
    return () => {
      if (actionsToPopover.current) {
        actionsToPopover.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    let ListHours = [];
    for (let i = 2; i <= 24; i++) {
      ListHours.push({
        Title: `${i * 30} phút (${(i * 30) / 60} tiếng)`,
        Value: (i * 30) / 60,
        SubTitle: `(${(i * 30) / 60} tiếng)`,
        TimeTitle: `${i * 30} phút`,
      });
    }
    setListHoursWork(ListHours);
  }, []);

  const inOutMutation = useMutation({
    mutationFn: async (body) => {
      try {
        let { data } = await WorkTrackAPI.CheckInOut(body);
        if (!data?.list || data?.list?.length === 0) {
          await store.dispatch("setCrsInOut", body.list[0]);
        }

        await Promise.all([
          queryClient.invalidateQueries(["Auth"]),
          queryClient.invalidateQueries(["TimekeepingHome"]),
          queryClient.invalidateQueries(["TimekeepingList"]),
        ]);
        return data ? { ...data, body: body.list[0] } : { body: body.list[0] };
      } catch (error) {
        await store.dispatch("setCrsInOut", body.list[0]);
        throw { body: body.list[0] };
      }
    },
  });

  const openFlexibleShifts = () =>
    new Promise((resolve, reject) => {
      if (WorkTimeToday?.flexible) {
        if (CheckIn && CheckIn?.Info?.WorkToday) {
          resolve(CheckIn?.Info?.WorkToday);
        } else {
          let newButtons = WorkTimeToday?.Options
            ? WorkTimeToday?.Options.map((x) => ({
                text: x.Title,
                close: true,
                onClick: (actions, e) => {
                  resolve({ ...x, isOff: false });
                },
              }))
            : [];
          if (Brand?.Global?.APP?.isTimekeepingHour) {
            newButtons.push({
              text: "Cộng tác viên theo giờ",
              close: true,
              onClick: (actions, e) => {
                resolve({
                  Type: "CTV",
                });
              },
            });
          }

          actionsToPopover.current = f7.actions.create({
            buttons: [
              [...newButtons],
              [
                {
                  text: "Đóng",
                  color: "red",
                },
              ],
            ],
            targetEl:
              buttonToPopoverWrapper.current.querySelector(
                ".button-to-popover"
              ),
            cssClass: "actions-ctv",
            on: {
              open: () => {
                Dom7(".actions-ctv")
                  .find(".actions-button")
                  .removeClass("actions-button")
                  .addClass(
                    "bg-white h-[50px] border-b border-[#dddddd] flex items-center justify-center"
                  );
              },
            },
          });

          actionsToPopover.current.open();
        }
      } else {
        resolve(WorkTimeToday);
      }
    });

  const handleCheckInLocation = (open) => {
    if (
      !WorkTimeToday ||
      (WorkTimeToday?.flexible &&
        (!WorkTimeToday?.Options || WorkTimeToday?.Options.length === 0))
    ) {
      f7.dialog.alert(
        `Bạn chưa được cài đặt loại công ca. Vui lòng liên hệ quản trị viên để được cài đặt?`
      );
      return;
    }
    if (!CrStocks?.Lat && !CrStocks?.Lng) {
      f7.dialog.alert(
        `Vui lòng liên hệ quản trị viên cập nhật vị trí Spa cơ sở ${CrStocks?.Title}.`
      );
    } else {
      openFlexibleShifts().then((WorkTimeShift) => {
        let { Lat, Lng } = CrStocks;
        if (WorkTimeShift.Type === "CTV") {
          f7.dialog.preloader("Đang xác định vị trí...");

          let PreCheckIndex = 1;
          const PreCheckLocation = () => {
            PromHelpers.GET_LOCATION()
              .then(({ data }) => {
                let lengthInMeters = getDistance(
                  { latitude: Lat, longitude: Lng },
                  { ...data }
                );

                if (
                  lengthInMeters <=
                  (Number(Brand?.Global?.APP?.accuracy) || 150)
                ) {
                  f7.dialog.close();
                  setActionsGridOpened(true);
                  setOption({
                    Lat: data.latitude,
                    Lng: data.longitude,
                    Distance: lengthInMeters,
                  });
                } else {
                  if (PreCheckIndex > 3) {
                    f7.dialog.close();
                    f7.dialog.alert(
                      `Không định vị được vị trí của bạn do kết nối Internet không ổn định. Vui tắt ứng dụng và mở lại.`
                    );
                  } else {
                    setTimeout(() => {
                      PreCheckIndex++;
                      PreCheckLocation();
                    }, 800);
                  }
                }
              })
              .catch((error) => {
                f7.dialog.close();
                f7.dialog.alert("Vui lòng bật vị trí của ứng dụng.");
              });
          };

          PreCheckLocation();
        } else {
          f7.dialog.confirm(
            !CheckIn
              ? "Bạn muốn chấm công vào làm ?"
              : "Bạn muốn chấm công ra về ?",
            () => {
              f7.dialog.close();
              f7.dialog.preloader("Đang xác định vị trí...");

              let PreCheckIndex = 1;
              const PreCheckLocation = () => {
                PromHelpers.GET_LOCATION()
                  .then(({ data }) => {
                    if (PreCheckIndex === 1) {
                      f7.dialog.close();
                      f7.dialog.preloader("Đang chấm công...");
                    }
                    let lengthInMeters = getDistance(
                      { latitude: Lat, longitude: Lng },
                      { ...data }
                    );

                    if (
                      lengthInMeters <=
                      (Number(Brand?.Global?.APP?.accuracy) || 150)
                    ) {
                      DateTimeHelpers.getNowServer().then(({ CrDate }) => {
                        let dataCheckInOut = {
                          list: [
                            {
                              UserID: Auth?.ID,
                              StockID: CrStocks?.ID,
                              Info: {
                                Lat: data.latitude,
                                Lng: data.longitude,
                                Distance: lengthInMeters,
                                WorkToday: {
                                  ...WorkTimeShift,
                                  Value: WorkTimeShift?.isOff
                                    ? 0
                                    : WorkTimeShift?.Value,
                                  flexible: WorkTimeToday?.flexible,
                                },
                              },
                            },
                          ],
                        };
                        if (!CheckIn) {
                          dataCheckInOut.list[0].CheckIn =
                            moment(CrDate).format("YYYY-MM-DD HH:mm");
                          if (WorkTimeShift?.hiddenTime) {
                            dataCheckInOut.list[0].Info["VE_MUON"] = {
                              Value:
                                WorkTimeShift?.SalaryHours *
                                WorkTimeShift?.TotalTime,
                            };
                          }
                        } else {
                          dataCheckInOut.list[0].CheckOut =
                            moment(CrDate).format("YYYY-MM-DD HH:mm");
                          dataCheckInOut.list[0].Info.WorkToday.Value =
                            CheckIn.Info.WorkToday.Value;
                        }

                        WorksHelpers.getConfirmOutIn({
                          WorkShiftsSetting,
                          WorkTimeToday: {
                            ...WorkTimeShift,
                            SalaryHours: WorkTimeToday?.SalaryHours,
                          },
                          CheckIn,
                          CheckOut,
                          CrDate,
                          CheckInOutJSON: dataCheckInOut,
                        })
                          .then((initialValues) => {
                            f7.dialog.close();
                            open({
                              ...dataCheckInOut.list[0],
                              Info: {
                                ...dataCheckInOut.list[0].Info,
                                ...initialValues,
                              },
                            });
                          })
                          .catch(() => {
                            inOutMutation.mutate(dataCheckInOut, {
                              onSuccess: (data) => {
                                AlertHelpers.CheckInOut({
                                  data,
                                  dataCheckInOut,
                                });
                              },
                              onError: (error) => {
                                AlertHelpers.CheckInOut({
                                  data: error,
                                  dataCheckInOut,
                                });
                              },
                            });
                          });
                      });
                    } else {
                      if (PreCheckIndex > 3) {
                        f7.dialog.close();
                        f7.dialog.alert(
                          `Không định vị được vị trí của bạn do kết nối Internet không ổn định. Vui tắt ứng dụng và mở lại.`
                        );
                      } else {
                        setTimeout(() => {
                          PreCheckIndex++;
                          PreCheckLocation();
                        }, 800);
                      }
                    }
                  })
                  .catch((error) => {
                    f7.dialog.close();
                    f7.dialog.alert("Vui lòng bật vị trí của ứng dụng.");
                  });
              };

              PreCheckLocation();
            }
          );
        }
      });
    }
  };

  const handleCheckInWifi = (open) => {
    if (
      !WorkTimeToday ||
      (WorkTimeToday?.flexible &&
        (!WorkTimeToday?.Options || WorkTimeToday?.Options.length === 0))
    ) {
      f7.dialog.alert(
        `Bạn chưa được cài đặt loại công ca. Vui lòng liên hệ quản trị viên để được cài đặt?`
      );
      return;
    }
    if (!CrStocks?.WifiID && !CrStocks?.WifiName) {
      f7.dialog.alert(
        `Vui lòng liên hệ quản trị viên cập nhật thông tin WIFI tại Spa cơ sở ${CrStocks?.Title}.`
      );
    } else {
      openFlexibleShifts().then((WorkTimeShift) => {
        if (WorkTimeShift.Type === "CTV") {
          PromHelpers.GET_NETWORK_TYPE().then(({ data }) => {
            if (
              data.SSID === CrStocks?.WifiName ||
              CrStocks?.WifiID === data.BSSID
            ) {
              f7.dialog.close();
              setActionsGridOpened(true);
              setOption({
                BSSID: data.BSSID,
                SSID: data.SSID,
                WifiInfo: {
                  WifiName: CrStocks?.WifiName,
                  WifiID: CrStocks?.WifiID,
                },
                WarningWifi:
                  data.BSSID !== CrStocks?.WifiID ||
                  data.SSID !== CrStocks?.WifiName,
              });
            } else {
              f7.dialog.close();
              f7.dialog.alert(
                `Vui lòng kết nối WIFI "${CrStocks?.WifiName}" để thực hiện chấm công.`
              );
            }
          });
        } else {
          f7.dialog.confirm(
            !CheckIn
              ? "Bạn muốn chấm công vào làm ?"
              : "Bạn muốn chấm công ra về ?",
            () => {
              f7.dialog.close();
              PromHelpers.GET_NETWORK_TYPE()
                .then(({ data }) => {
                  f7.dialog.preloader("Đang thực hiện ...");
                  if (
                    data.SSID === CrStocks?.WifiName ||
                    CrStocks?.WifiID === data.BSSID
                  ) {
                    DateTimeHelpers.getNowServer().then(({ CrDate }) => {
                      let dataCheckInOut = {
                        list: [
                          {
                            UserID: Auth?.ID,
                            StockID: CrStocks?.ID,
                            Info: {
                              ...Option,
                              WorkToday: {
                                ...WorkTimeShift,
                                Value: WorkTimeShift?.isOff
                                  ? 0
                                  : WorkTimeShift?.Value,
                                flexible: WorkTimeToday?.flexible,
                              },
                            },
                          },
                        ],
                      };
                      if (!CheckIn) {
                        dataCheckInOut.list[0].CheckIn =
                          moment(CrDate).format("YYYY-MM-DD HH:mm");
                        if (WorkTimeShift?.hiddenTime) {
                          dataCheckInOut.list[0].Info["VE_MUON"] = {
                            Value:
                              WorkTimeShift?.SalaryHours *
                              WorkTimeShift?.TotalTime,
                          };
                        }
                      } else {
                        dataCheckInOut.list[0].CheckOut =
                          moment(CrDate).format("YYYY-MM-DD HH:mm");
                        dataCheckInOut.list[0].Info.WorkToday.Value =
                          CheckIn.Info.WorkToday.Value;
                      }

                      WorksHelpers.getConfirmOutIn({
                        WorkShiftsSetting,
                        WorkTimeToday: {
                          ...WorkTimeShift,
                          SalaryHours: WorkTimeToday?.SalaryHours,
                        },
                        CheckIn,
                        CheckOut,
                        CrDate,
                        CheckInOutJSON: dataCheckInOut,
                      })
                        .then((initialValues) => {
                          f7.dialog.close();
                          open({
                            ...dataCheckInOut.list[0],
                            Info: {
                              ...dataCheckInOut.list[0].Info,
                              ...initialValues,
                            },
                          });
                        })
                        .catch(() => {
                          inOutMutation.mutate(dataCheckInOut, {
                            onSuccess: (data) => {
                              AlertHelpers.CheckInOut({
                                data,
                                dataCheckInOut,
                              });
                            },
                            onError: (error) => {
                              AlertHelpers.CheckInOut({
                                data: error,
                                dataCheckInOut,
                              });
                            },
                          });
                        });
                    });
                  } else {
                    f7.dialog.close();
                    f7.dialog.alert(
                      `Vui lòng kết nối WIFI "${CrStocks?.WifiName}" để thực hiện chấm công.`
                    );
                  }
                })
                .catch((error) => {
                  f7.dialog.close();
                  f7.dialog.alert(
                    `Vui lòng kết nối WIFI "${CrStocks?.WifiName}" để thực hiện chấm công.`
                  );
                });
            }
          );
        }
      });
    }
  };

  const handleCheckInBasic = (open) => {
    if (
      !WorkTimeToday ||
      (WorkTimeToday?.flexible &&
        (!WorkTimeToday?.Options || WorkTimeToday?.Options.length === 0))
    ) {
      f7.dialog.alert(
        `Bạn chưa được cài đặt loại công ca. Vui lòng liên hệ quản trị viên để được cài đặt?`
      );
      return;
    }

    openFlexibleShifts().then((WorkTimeShift) => {
      if (WorkTimeShift.Type === "CTV") {
        setActionsGridOpened(true);
      } else {
        f7.dialog.confirm(
          !CheckIn
            ? "Bạn muốn chấm công vào làm ?"
            : "Bạn muốn chấm công ra về ?",
          () => {
            f7.dialog.preloader("Đang thực hiện ...");
            DateTimeHelpers.getNowServer().then(({ CrDate }) => {
              let dataCheckInOut = {
                list: [
                  {
                    UserID: Auth?.ID,
                    StockID: CrStocks?.ID,
                    Info: {
                      ...Option,
                      WorkToday: {
                        ...WorkTimeShift,
                        Value: WorkTimeShift?.isOff ? 0 : WorkTimeShift?.Value,
                        flexible: WorkTimeToday?.flexible,
                      },
                    },
                  },
                ],
              };
              if (!CheckIn) {
                dataCheckInOut.list[0].CheckIn =
                  moment(CrDate).format("YYYY-MM-DD HH:mm");
                if (WorkTimeShift?.hiddenTime) {
                  dataCheckInOut.list[0].Info["VE_MUON"] = {
                    Value:
                      WorkTimeShift?.SalaryHours * WorkTimeShift?.TotalTime,
                  };
                }
              } else {
                dataCheckInOut.list[0].CheckOut =
                  moment(CrDate).format("YYYY-MM-DD HH:mm");
                dataCheckInOut.list[0].Info.WorkToday.Value =
                  CheckIn.Info.WorkToday.Value;
              }

              WorksHelpers.getConfirmOutIn({
                WorkShiftsSetting,
                WorkTimeToday: {
                  ...WorkTimeShift,
                  SalaryHours: WorkTimeToday?.SalaryHours,
                },
                CheckIn,
                CheckOut,
                CrDate,
                CheckInOutJSON: dataCheckInOut,
              })
                .then((initialValues) => {
                  f7.dialog.close();
                  open({
                    ...dataCheckInOut.list[0],
                    Info: {
                      ...dataCheckInOut.list[0].Info,
                      ...initialValues,
                    },
                  });
                })
                .catch(() => {
                  inOutMutation.mutate(dataCheckInOut, {
                    onSuccess: (data) => {
                      AlertHelpers.CheckInOut({
                        data,
                        dataCheckInOut,
                      });
                    },
                    onError: (error) => {
                      AlertHelpers.CheckInOut({
                        data: error,
                        dataCheckInOut,
                      });
                    },
                  });
                });
            });
          }
        );
      }
    });
  };

  const handleCheckCTV = (values) => {
    let WorkTimeShift = {
      Title: values?.Title,
      TotalTime: values.Value,
      TimeFrom: null,
      TimeTo: null,
      Value: 0,
      hiddenTime: true,
      SalaryHours: WorkTimeToday?.SalaryHours || 0,
    };

    f7.dialog.confirm(
      `Thực hiện chấm công với thời gian làm ${values.Title}`,
      !CheckIn ? "Bạn chấm công vào làm ?" : "Bạn chấm công ra về ?",
      () => {
        PromHelpers.GET_NETWORK_TYPE()
          .then(({ data }) => {
            f7.dialog.preloader("Đang thực hiện ...");
            DateTimeHelpers.getNowServer().then(({ CrDate }) => {
              let dataCheckInOut = {
                list: [
                  {
                    UserID: Auth?.ID,
                    StockID: CrStocks?.ID,
                    Info: {
                      ...Option,
                      WorkToday: {
                        ...WorkTimeShift,
                        Value: WorkTimeShift?.isOff ? 0 : WorkTimeShift?.Value,
                        flexible: WorkTimeToday?.flexible,
                      },
                      Type: "CONG_TY",
                    },
                  },
                ],
              };
              if (!CheckIn) {
                dataCheckInOut.list[0].CheckIn =
                  moment(CrDate).format("YYYY-MM-DD HH:mm");
                if (WorkTimeShift?.hiddenTime) {
                  dataCheckInOut.list[0].Info["DI_SOM"] = {
                    Value:
                      WorkTimeShift?.SalaryHours * WorkTimeShift?.TotalTime,
                  };
                }
              } else {
                dataCheckInOut.list[0].CheckOut =
                  moment(CrDate).format("YYYY-MM-DD HH:mm");
                dataCheckInOut.list[0].Info.WorkToday.Value =
                  CheckIn.Info.WorkToday.Value;
              }

              inOutMutation.mutate(dataCheckInOut, {
                onSuccess: (data) => {
                  setActionsGridOpened(false);
                  setOption({});
                  AlertHelpers.CheckInOut({ data, dataCheckInOut });
                },
                onError: (error) => {
                  setActionsGridOpened(false);
                  setOption({});
                  AlertHelpers.CheckInOut({
                    data: error,
                    dataCheckInOut,
                  });
                },
              });
            });
          })
          .catch((error) => {
            f7.dialog.close();
            f7.dialog.alert(
              `Vui lòng kết nối WIFI "${CrStocks?.WifiName}" để thực hiện chấm công.`
            );
          });
      },
      () => {
        setActive(null);
      }
    );
  };

  const handleCheckIn = (open) => {
    if (CheckIn && CheckOut) {
      f7.dialog.alert(`Hôm nay bạn đã thực hiện chấm công rồi nhé.`, () => {
        onError && onError();
      });
    } else {
      if (
        !CrStocks?.Lat &&
        !CrStocks?.Lng &&
        !CrStocks?.WifiID &&
        !CrStocks?.WifiName
      ) {
        handleCheckInBasic(open);
      } else if (
        CrStocks?.Lat &&
        CrStocks?.Lng &&
        !CrStocks?.WifiID &&
        !CrStocks?.WifiName
      ) {
        handleCheckInLocation(open);
      } else if (
        !CrStocks?.Lat &&
        !CrStocks?.Lng &&
        CrStocks?.WifiID &&
        CrStocks?.WifiName
      ) {
        handleCheckInWifi(open);
      } else {
        setVisible(true);
      }
      onSuccess && onSuccess();
    }
  };

  const handleSynchronous = () => {
    f7.dialog
      .create({
        title: "Đồng bộ dữ liệu",
        content: `Bạn vui lòng chọn <span class='text-primary'>"Xác nhận" </span> để thực hiện đồng bộ chấm công với hệ thống.`,
        buttons: [
          {
            text: "Xác nhận",
            close: true,
            onClick: () => {
              f7.dialog.preloader("Đang đồng bộ ...");

              let dataCheckInOut = {
                list: [],
              };

              if (CheckInStorage) {
                dataCheckInOut.list.push(CheckInStorage);
              } else {
                dataCheckInOut.list.push(CheckOutStorage);
              }

              inOutMutation.mutate(dataCheckInOut, {
                onSuccess: async (data) => {
                  AlertHelpers.CheckInOut({ data, dataCheckInOut, Sync: true });
                },
                onError: (error) => {
                  AlertHelpers.CheckInOut({
                    data: error,
                    dataCheckInOut,
                    Sync: true,
                  });
                },
              });
            },
          },
          {
            text: "Đóng",
            close: true,
            cssClass: "!text-gray-900",
          },
        ],
      })
      .open();
  };

  return (
    <PickerConfirm>
      {({ open }) => (
        <>
          <div className="relative" ref={buttonToPopoverWrapper}>
            {children({
              onCheckInOut: () => handleCheckIn(open),
              onSyncInOut: () => handleSynchronous(),
            })}
          </div>
          <Actions
            opened={visible}
            onActionsClosed={() => {
              setVisible(false);
            }}
          >
            <ActionsGroup>
              <ActionsLabel>Phương thức chấm công</ActionsLabel>
              <ActionsButton onClick={() => handleCheckInLocation(open)}>
                Qua Vị trí
                {!CheckIn?.Info?.WifiInfo && CheckIn?.CheckIn && (
                  <span className="text-[12px] text-success pl-1">
                    (Vào lúc {moment(CheckIn?.CheckIn).format("HH:mm")})
                  </span>
                )}
              </ActionsButton>
              <ActionsButton onClick={() => handleCheckInWifi(open)}>
                Qua Wifi
                {CheckIn?.Info?.WifiInfo && CheckIn?.CheckIn && (
                  <span className="text-[12px] text-success pl-1">
                    (Vào lúc {moment(CheckIn?.CheckIn).format("HH:mm")})
                  </span>
                )}
              </ActionsButton>
            </ActionsGroup>
            <ActionsGroup>
              <ActionsButton color="red">Đóng</ActionsButton>
            </ActionsGroup>
          </Actions>
          <Actions
            grid={true}
            opened={actionsGridOpened}
            onActionsClosed={() => {
              setActionsGridOpened(false);
              setOption({});
            }}
          >
            <div className="px-4 pb-4">
              <div className="bg-white rounded-xl">
                <div className="flex items-center justify-center h-12 border-b text-[#8a8a8a]">
                  Chọn thời gian làm
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 max-h-[80vh] overflow-auto">
                  {ListHoursWork &&
                    ListHoursWork.map((x, index) => (
                      <div
                        className={clsx(
                          "text-center h-11 round flex items-center justify-center flex-col transition",
                          Active?.Value === x?.Value
                            ? "bg-app text-white"
                            : "bg-[#f5f5f9]"
                        )}
                        key={index}
                        onClick={() => {
                          setActive(x);
                          handleCheckCTV(x);
                        }}
                      >
                        <div className="leading-4 font-meidum">
                          {x.TimeTitle}
                        </div>
                        <div className="text-xs font-light">{x.SubTitle}</div>
                      </div>
                    ))}
                </div>
              </div>
              <div className="mt-2 bg-white rounded-xl">
                <div
                  className="flex items-center justify-center h-12 text-danger font-medium text-[15px]"
                  onClick={() => {
                    setActionsGridOpened(false);
                  }}
                >
                  Đóng
                </div>
              </div>
            </div>
          </Actions>
        </>
      )}
    </PickerConfirm>
  );
}

export default PickerCheckInOut;

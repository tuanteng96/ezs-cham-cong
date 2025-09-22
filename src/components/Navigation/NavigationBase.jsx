import {
  Link,
  Toolbar,
  f7,
  useStore,
  Actions,
  ActionsGroup,
  ActionsLabel,
  ActionsButton,
  Popover,
} from "framework7-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  BarsArrowUpIcon,
  ChartBarIcon,
  ComputerDesktopIcon,
  HomeIcon,
  Square3Stack3DIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "../../helpers/PromHelpers";
import WorkTrackAPI from "../../api/WorkTrack.api";
import moment from "moment";
import { useIsFetching, useMutation, useQueryClient } from "react-query";
import { useCheckInOut } from "../../hooks";
import PickerConfirm from "../PickerConfirm";
import WorksHelpers from "../../helpers/WorksHelpers";
import { getDistance } from "geolib";
import DateTimeHelpers from "../../helpers/DateTimeHelpers";
import RouterHelpers from "../../helpers/RouterHelpers";
import Dom7 from "dom7";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import store from "@/js/store";
import AlertHelpers from "@/helpers/AlertHelpers";

function NavigationBase({ pathname }) {
  const [visible, setVisible] = useState(false);
  const [actionsGridOpened, setActionsGridOpened] = useState(false);
  const [ListHoursWork, setListHoursWork] = useState([]);
  const [Active, setActive] = useState(null);
  const [Option, setOption] = useState({});

  let [CountProcessings, setCountProcessings] = useState(0);

  let Processings = useStore("Processings");

  let isLoadingProcessings = useIsFetching({ queryKey: ["Processings"] }) > 0;

  const Brand = useStore("Brand");
  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");
  const WorkTimeSettings = useStore("WorkTimeSettings");

  const { WorkShiftsSetting, WorkTimeToday } = {
    WorkShiftsSetting: WorkTimeSettings?.WorkShiftsSetting || null,
    WorkTimeToday: WorkTimeSettings?.WorkTimeToday || null,
  };

  const queryClient = useQueryClient();
  let { CheckIn, CheckOut, CheckInStorage, CheckOutStorage } = useCheckInOut();

  const { pos_mng } = RolesHelpers.useRoles({
    nameRoles: ["pos_mng"],
    auth: Auth,
    CrStocks,
  });

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

  useEffect(() => {
    setCountProcessings(Processings?.Count);
  }, [Processings]);

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
      f7.dialog.alert(`Hôm nay bạn đã thực hiện chấm công rồi nhé.`);
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

  const noBottomNav = useMemo(() => {
    return (
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.includes(pathname) ||
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.some(
        (x) => pathname.indexOf(x) > -1
      )
    );
  }, [pathname]);

  if (noBottomNav) {
    return <></>;
  }

  return (
    <Toolbar
      className="bg-white border-t border-[#EBEDF3]"
      bottom
      inner={false}
      outline={false}
    >
      <div className="grid grid-cols-5">
        <Link href="/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/home/" ? "text-app" : "text-gray-600"
            )}
          >
            <HomeIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Trang chủ</span>
          </div>
        </Link>
        {pos_mng?.hasRight ? (
          <>
            {Brand?.Domain === "https://app.facewashfox.com" ? (
              <Link
                onClick={() =>
                  f7.dialog.alert("Thương hiệu không hỗ trợ trên APP.")
                }
              >
                <div
                  className={clsx(
                    "flex flex-col items-center justify-center pt-1",
                    pathname === "/admin/pos/clients/"
                      ? "text-app"
                      : "text-gray-600"
                  )}
                >
                  <ComputerDesktopIcon className="w-6" />
                  <span className="text-[10px] mt-px leading-4">Thu ngân</span>
                </div>
              </Link>
            ) : (
              <Link href="/admin/pos/clients/">
                <div
                  className={clsx(
                    "flex flex-col items-center justify-center pt-1",
                    pathname === "/admin/pos/clients/"
                      ? "text-app"
                      : "text-gray-600"
                  )}
                >
                  <ComputerDesktopIcon className="w-6" />
                  <span className="text-[10px] mt-px leading-4">Thu ngân</span>
                </div>
              </Link>
            )}
          </>
        ) : (
          <Link href="/technicians/">
            <div
              className={clsx(
                "flex flex-col items-center justify-center pt-1",
                pathname === "/technicians/" ||
                  pathname === "/technicians/?Type=dl"
                  ? "text-app"
                  : "text-gray-600"
              )}
            >
              <UserGroupIcon className="w-6" />
              <span className="text-[10px] mt-px leading-4">KT Viên</span>
            </div>
          </Link>
        )}

        <PickerConfirm>
          {({ open }) => (
            <>
              <div className="relative" ref={buttonToPopoverWrapper}>
                <div className="absolute w-16 h-16 p-1 rotate-45 bg-white border border-b-0 border-r-0 rounded-full -top-4 left-2/4 -translate-x-2/4">
                  {!CheckInStorage && !CheckOutStorage ? (
                    <div
                      className={clsx(
                        "flex flex-col items-center justify-center w-full h-full -rotate-45 rounded-full shadow-3xl transition",
                        !CheckIn && !CheckOut && "bg-success",
                        CheckIn && !CheckOut && "bg-danger",
                        CheckOut && CheckOut && "bg-[#D1D3E0]"
                      )}
                      onClick={() => handleCheckIn(open)}
                    >
                      {!CheckIn && (
                        <ArrowLeftOnRectangleIcon className="text-white w-7 animate-ezs-arrow-out" />
                      )}
                      {CheckIn && (
                        <ArrowRightOnRectangleIcon className="text-white w-7 animate-ezs-arrow-out" />
                      )}
                    </div>
                  ) : (
                    <div
                      className={clsx(
                        "flex flex-col items-center justify-center w-full h-full -rotate-45 rounded-full shadow-3xl transition bg-warning overflow-hidden"
                      )}
                      onClick={() => handleSynchronous()}
                    >
                      <ArrowPathIcon className="relative text-white w-7 animate-ezs-spin-1s" />
                      <span className="absolute inset-0 w-full h-full rounded-full bg-warning opacity-90 animate-ping"></span>
                    </div>
                  )}
                </div>
              </div>
              <Actions
                opened={visible}
                onActionsClosed={() => setVisible(false)}
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
                            <div className="text-xs font-light">
                              {x.SubTitle}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="mt-2 bg-white rounded-xl">
                    <div
                      className="flex items-center justify-center h-12 text-danger font-medium text-[15px]"
                      onClick={() => setActionsGridOpened(false)}
                    >
                      Đóng
                    </div>
                  </div>
                </div>
              </Actions>
            </>
          )}
        </PickerConfirm>

        {pos_mng?.hasRight ? (
          <>
            <Link
              noLinkClass
              href="/admin/processings/"
              className="relative btn-popover-processings-base"
            >
              <div
                className={clsx(
                  "flex flex-col items-center justify-center pt-1",
                  ["/admin/processings/"].includes(pathname)
                    ? "text-app"
                    : "text-gray-600"
                )}
              >
                <Square3Stack3DIcon className="w-6" />
                <span className="text-[10px] mt-px leading-4">Cần xử lý</span>
              </div>
              {isLoadingProcessings && (
                <div className="absolute top-2 right-2 font-lato font-bold text-white bg-danger text-[11px] px-1 py-[2px] w-5 h-[15px] animate-pulse leading-none rounded"></div>
              )}
              {!isLoadingProcessings && (
                <>
                  {CountProcessings > 0 ? (
                    <div className="absolute top-2 right-2 font-lato font-bold text-white bg-danger text-[11px] px-1 py-[2px] leading-none rounded">
                      {CountProcessings}
                    </div>
                  ) : (
                    <></>
                  )}
                </>
              )}
            </Link>
          </>
        ) : (
          <>
            <Link popoverOpen=".popover-salary">
              <div
                className={clsx(
                  "flex flex-col items-center justify-center pt-1",
                  pathname.includes("statistical")
                    ? "text-app"
                    : "text-gray-600"
                )}
              >
                <ChartBarIcon className="w-6" />
                <span className="text-[10px] mt-px leading-4">Bảng lương</span>
              </div>
            </Link>

            <Popover className="popover-salary w-[210px]">
              <div className="flex flex-col py-1">
                <Link
                  href="/statistical/"
                  className={clsx(
                    "relative px-4 py-3 font-medium border-b last:border-0",
                    pathname === "/statistical/" && "text-app"
                  )}
                  popoverClose
                  noLinkClass
                >
                  Bảng lương theo tháng
                </Link>
                <Link
                  href="/statistical/day/"
                  popoverClose
                  className={clsx(
                    "relative px-4 py-3 font-medium border-b last:border-0",
                    pathname === "/statistical/day/" && "text-app"
                  )}
                  noLinkClass
                >
                  Bảng lương theo ngày
                </Link>
              </div>
            </Popover>
          </>
        )}

        <Link panelOpen="right">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              RouterHelpers.PATH_NAVIGATION_PAGES.includes(pathname)
                ? "text-gray-600"
                : "text-app"
            )}
          >
            <BarsArrowUpIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Menu</span>
          </div>
        </Link>
      </div>
    </Toolbar>
  );
}

export default NavigationBase;

import {
  Link,
  Toolbar,
  f7,
  f7ready,
  useStore,
  Actions,
  ActionsGroup,
  ActionsLabel,
  ActionsButton,
} from "framework7-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  BarsArrowUpIcon,
  ChartBarIcon,
  HomeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "../helpers/PromHelpers";
import WorkTrackAPI from "../api/WorkTrack.api";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { useCheckInOut } from "../hooks";
import PickerConfirm from "./PickerConfirm";
import WorksHelpers from "../helpers/WorksHelpers";
import { getDistance } from "geolib";
import DateTimeHelpers from "../helpers/DateTimeHelpers";

const BOTTOM_NAVIGATION_PAGES = [
  "/login/",
  "/brand/",
  "/account/change-password/",
  "/technicians/profile/",
  "/technicians/service/",
  "/technicians/history/",
  "/notifications/",
  "/notifications/view/",
  "/admin/notifications/add/",
  "/admin/notifications/edit/",
  "/admin/utility/timekeeping-setting/",
  "/admin/article/",
  "/stocks/",
];

const PATH_NAVIGATION_PAGES = [
  "/",
  "/home/",
  "/statistical/",
  "/technicians/",
  "/technicians/?Type=dl",
];

function Navigation(props) {
  const [pathname, setPathname] = useState("");
  const [visible, setVisible] = useState(false);
  const Brand = useStore("Brand");
  const CrStocks = useStore("CrStocks");
  //const Stocks = useStore("Stocks");
  const Auth = useStore("Auth");
  const WorkTimeSettings = useStore("WorkTimeSettings");
  const { WorkShiftsSetting, WorkTimeToday } = {
    WorkShiftsSetting: WorkTimeSettings?.WorkShiftsSetting || null,
    WorkTimeToday: WorkTimeSettings?.WorkTimeToday || null,
  };
  const queryClient = useQueryClient();
  let { CheckIn, CheckOut } = useCheckInOut();

  const actionsToPopover = useRef(null);
  const buttonToPopoverWrapper = useRef(null);

  useEffect(() => {
    f7ready((f7) => {
      f7.views.main.on("routeChange", (newRoute) => {
        setPathname(newRoute.url);

        if (window.PlatformId === "ANDROID") {
          if (
            document.activeElement &&
            (document.activeElement.tagName === "INPUT" ||
              document.activeElement.tagName === "TEXTAREA")
          ) {
            document.activeElement.blur();
          }
        }
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (actionsToPopover.current) {
        actionsToPopover.current.destroy();
      }
    };
  }, []);

  const inOutMutation = useMutation({
    mutationFn: (body) => WorkTrackAPI.CheckInOut(body),
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
        `Vui lòng liên hệ quản trị viên cập nhập vị trí Spa cơ sở ${CrStocks?.Title}.`
      );
    } else {
      openFlexibleShifts().then((WorkTimeShift) => {
        let { Lat, Lng } = CrStocks;
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
                      } else {
                        dataCheckInOut.list[0].CheckOut =
                          moment(CrDate).format("YYYY-MM-DD HH:mm");
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
                            onSettled: ({ data }) => {
                              Promise.all([
                                queryClient.invalidateQueries(["Auth"]),
                                queryClient.invalidateQueries([
                                  "TimekeepingHome",
                                ]),
                                queryClient.invalidateQueries([
                                  "TimekeepingList",
                                ]),
                              ]).then(() => {
                                f7.dialog.close();
                                toast.success("Chấm công thành công.", {
                                  position: toast.POSITION.TOP_CENTER,
                                  autoClose: 2000,
                                });
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
        `Vui lòng liên hệ quản trị viên cập nhập thông tin WIFI tại Spa cơ sở ${CrStocks?.Title}.`
      );
    } else {
      openFlexibleShifts().then((WorkTimeShift) => {
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
                    f7.dialog.close();
                    let dataCheckInOut = {
                      list: [
                        {
                          UserID: Auth?.ID,
                          StockID: CrStocks?.ID,
                          Info: {
                            Lat: "",
                            Lng: "",
                            WorkToday: {
                              ...WorkTimeShift,
                              Value: WorkTimeShift?.isOff
                                ? 0
                                : WorkTimeShift?.Value,
                              flexible: WorkTimeToday?.flexible,
                            },
                            BSSID: data.BSSID,
                            SSID: data.SSID,
                            WifiInfo: {
                              WifiName: CrStocks?.WifiName,
                              WifiID: CrStocks?.WifiID,
                            },
                            WarningWifi:
                              data.BSSID !== CrStocks?.WifiID ||
                              data.SSID !== CrStocks?.WifiName,
                          },
                        },
                      ],
                    };
                    if (!CheckIn) {
                      dataCheckInOut.list[0].CheckIn =
                        moment(CrDate).format("YYYY-MM-DD HH:mm");
                    } else {
                      dataCheckInOut.list[0].CheckOut =
                        moment(CrDate).format("YYYY-MM-DD HH:mm");
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
                          onSettled: ({ data }) => {
                            Promise.all([
                              queryClient.invalidateQueries(["Auth"]),
                              queryClient.invalidateQueries([
                                "TimekeepingHome",
                              ]),
                              queryClient.invalidateQueries([
                                "TimekeepingList",
                              ]),
                            ]).then(() => {
                              f7.dialog.close();
                              toast.success("Chấm công thành công.", {
                                position: toast.POSITION.TOP_CENTER,
                                autoClose: 2000,
                              });
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
      f7.dialog.confirm(
        !CheckIn
          ? "Bạn muốn chấm công vào làm ?"
          : "Bạn muốn chấm công ra về ?",
        () => {
          PromHelpers.GET_NETWORK_TYPE()
            .then(({ data }) => {
              f7.dialog.preloader("Đang thực hiện ...");
              DateTimeHelpers.getNowServer().then(({ CrDate }) => {
                f7.dialog.close();
                let dataCheckInOut = {
                  list: [
                    {
                      UserID: Auth?.ID,
                      StockID: CrStocks?.ID,
                      Info: {
                        Lat: "",
                        Lng: "",
                        WorkToday: {
                          ...WorkTimeShift,
                          Value: WorkTimeShift?.isOff
                            ? 0
                            : WorkTimeShift?.Value,
                          flexible: WorkTimeToday?.flexible,
                        },
                        Basic: true,
                        BSSID: data.BSSID,
                        SSID: data.SSID,
                      },
                    },
                  ],
                };
                if (!CheckIn) {
                  dataCheckInOut.list[0].CheckIn =
                    moment(CrDate).format("YYYY-MM-DD HH:mm");
                } else {
                  dataCheckInOut.list[0].CheckOut =
                    moment(CrDate).format("YYYY-MM-DD HH:mm");
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
                      onSettled: ({ data }) => {
                        Promise.all([
                          queryClient.invalidateQueries(["Auth"]),
                          queryClient.invalidateQueries(["TimekeepingHome"]),
                          queryClient.invalidateQueries(["TimekeepingList"]),
                        ]).then(() => {
                          f7.dialog.close();
                          toast.success("Chấm công thành công.", {
                            position: toast.POSITION.TOP_CENTER,
                            autoClose: 2000,
                          });
                        });
                      },
                    });
                  });
              });
            })
            .catch((error) => {
              f7.dialog.close();
              f7.dialog.alert(
                `Vui lòng kết nối WIFI "${CrStocks?.WifiName}" để thực hiện chấm công.`
              );
            });
        }
      );
    });
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

  const noBottomNav = useMemo(() => {
    return (
      BOTTOM_NAVIGATION_PAGES.includes(pathname) ||
      BOTTOM_NAVIGATION_PAGES.some((x) => pathname.indexOf(x) > -1)
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
              pathname === "/home/" ? "text-app" : "text-gray-700"
            )}
          >
            <HomeIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Chấm công</span>
          </div>
        </Link>
        <Link href="/technicians/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/technicians/" ||
                pathname === "/technicians/?Type=dl"
                ? "text-app"
                : "text-gray-700"
            )}
          >
            <UserGroupIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">KT Viên</span>
          </div>
        </Link>
        <PickerConfirm>
          {({ open }) => (
            <>
              <div className="relative" ref={buttonToPopoverWrapper}>
                <div className="absolute w-16 h-16 p-1 rotate-45 bg-white border border-b-0 border-r-0 rounded-full -top-4 left-2/4 -translate-x-2/4">
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
                      <ArrowLeftOnRectangleIcon className="text-white w-7" />
                    )}
                    {CheckIn && (
                      <ArrowRightOnRectangleIcon className="text-white w-7" />
                    )}
                  </div>
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
            </>
          )}
        </PickerConfirm>
        {/* <Link href="/take-break/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/take-break/" ? "text-app" : "text-gray-700"
            )}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[22px]"
            >
              <path
                d="M17.5 5.83335V14.1667C17.5 16.6667 16.25 18.3334 13.3333 18.3334H6.66667C3.75 18.3334 2.5 16.6667 2.5 14.1667V5.83335C2.5 3.33335 3.75 1.66669 6.66667 1.66669H13.3333C16.25 1.66669 17.5 3.33335 17.5 5.83335Z"
                className="stroke-current"
                strokeWidth="1.25"
                strokeMiterlimit={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0833 3.75V5.41667C12.0833 6.33333 12.8333 7.08333 13.7499 7.08333H15.4166"
                className="stroke-current"
                strokeWidth="1.25"
                strokeMiterlimit={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.66675 10.8333H10.0001"
                className="stroke-current"
                strokeWidth="1.25"
                strokeMiterlimit={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.66675 14.1667H13.3334"
                className="stroke-current"
                strokeWidth="1.25"
                strokeMiterlimit={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[10px] mt-px leading-4">Xin nghỉ</span>
          </div>
        </Link> */}
        <Link href="/statistical/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/statistical/" ? "text-app" : "text-gray-700"
            )}
          >
            <ChartBarIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Bảng lương</span>
          </div>
        </Link>
        <Link panelOpen="right">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              PATH_NAVIGATION_PAGES.includes(pathname)
                ? "text-gray-700"
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

export default Navigation;

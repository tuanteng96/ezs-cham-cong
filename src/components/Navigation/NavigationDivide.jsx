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
import PromHelpers from "../../helpers/PromHelpers";
import WorkTrackAPI from "../../api/WorkTrack.api";
import moment from "moment";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { useCheckInOut } from "../../hooks";
import PickerConfirmDivide from "../PickerConfirmDivide";
import WorksHelpers from "../../helpers/WorksHelpers";
import { getDistance } from "geolib";
import DateTimeHelpers from "../../helpers/DateTimeHelpers";
import RouterHelpers from "../../helpers/RouterHelpers";

function NavigationDivide(props) {
  const [pathname, setPathname] = useState("");
  const [visible, setVisible] = useState(false);

  const Brand = useStore("Brand");
  const CrStocks = useStore("CrStocks");
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

        window.PathCurrent = newRoute.url;

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
    mutationFn: async (body) => {
      let data = await WorkTrackAPI.CheckInOut(body);
      await Promise.all([
        queryClient.invalidateQueries(["Auth"]),
        queryClient.invalidateQueries(["TimekeepingHome"]),
        queryClient.invalidateQueries(["TimekeepingList"]),
      ]);
      return data;
    },
  });

  const openFlexibleShifts = () =>
    new Promise((resolve, reject) => {
      resolve(WorkTimeToday);
    });

  const handleCheckInLocation = (open) => {
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
                            Lat: data.latitude,
                            Lng: data.longitude,
                            Distance: lengthInMeters,
                            UserID: Auth?.ID,
                            StockID: CrStocks?.ID,
                            Info: {
                              WorkToday: {
                                Value: 1,
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

                      WorksHelpers.getConfirmOutInDivide({
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
                              ...initialValues.Info,
                            },
                          });
                        })
                        .catch((initialValues) => {
                          if (!initialValues?.error) {
                            dataCheckInOut.list[0].Info = {
                              ...dataCheckInOut.list[0].Info,
                              ...initialValues.Info,
                            };
                            inOutMutation.mutate(dataCheckInOut, {
                              onSuccess: ({ data }) => {
                                f7.dialog.close();
                                toast.success("Chấm công thành công.", {
                                  position: toast.POSITION.TOP_CENTER,
                                  autoClose: 2000,
                                });
                              },
                            });
                          } else {
                            f7.dialog.close();
                            f7.dialog.alert(initialValues?.error);
                          }
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
                    let dataCheckInOut = {
                      list: [
                        {
                          UserID: Auth?.ID,
                          StockID: CrStocks?.ID,
                          Info: {
                            WorkToday: {
                              Value: 1,
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

                    WorksHelpers.getConfirmOutInDivide({
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
                            ...initialValues.Info,
                          },
                        });
                      })
                      .catch((initialValues) => {
                        if (!initialValues?.error) {
                          dataCheckInOut.list[0].Info = {
                            ...dataCheckInOut.list[0].Info,
                            ...initialValues.Info,
                          };
                          inOutMutation.mutate(dataCheckInOut, {
                            onSuccess: ({ data }) => {
                              f7.dialog.close();
                              toast.success("Chấm công thành công.", {
                                position: toast.POSITION.TOP_CENTER,
                                autoClose: 2000,
                              });
                            },
                          });
                        } else {
                          f7.dialog.close();
                          f7.dialog.alert(initialValues?.error);
                        }
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
    openFlexibleShifts().then((WorkTimeShift) => {
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
                    WorkToday: {
                      Value: 1,
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

            WorksHelpers.getConfirmOutInDivide({
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
                    ...initialValues.Info,
                  },
                });
              })
              .catch((initialValues) => {
                if (!initialValues?.error) {
                  dataCheckInOut.list[0].Info = {
                    ...dataCheckInOut.list[0].Info,
                    ...initialValues.Info,
                  };
                  inOutMutation.mutate(dataCheckInOut, {
                    onSettled: ({ data }) => {
                      f7.dialog.close();
                      toast.success("Chấm công thành công.", {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 2000,
                      });
                    },
                  });
                } else {
                  f7.dialog.close();
                  f7.dialog.alert(initialValues?.error);
                }
              });
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
        <PickerConfirmDivide {...{ CheckIn, CheckOut }}>
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
        </PickerConfirmDivide>
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
              RouterHelpers.PATH_NAVIGATION_PAGES.includes(pathname)
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

export default NavigationDivide;

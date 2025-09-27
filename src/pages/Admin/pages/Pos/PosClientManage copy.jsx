import AdminAPI from "@/api/Admin.api";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import PromHelpers from "@/helpers/PromHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ListBulletIcon,
  PlusIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  Navbar,
  Page,
  Popover,
  f7,
  f7ready,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  PanelPos,
  PickerAccumulate,
  PickerAddEditFee,
  PickerAddEditTIP,
  PickerAff,
  PickerEditProd,
  PickerPayments,
} from "./components";
import clsx from "clsx";
import Dom7 from "dom7";
import {
  PickerChangeDateOrder,
  PickerDiscountCodeOrder,
  PickerDiscountEnterOrder,
  PickerPaymentDateOrder,
  PickerPaymentNoteOrder,
} from "../Orders/components";
import { toast } from "react-toastify";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { ref, remove, set } from "firebase/database";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import { useFirebase } from "@/hooks";
import PickerGuestsOrder from "../Orders/components/PickerGuestsOrder";

function PosClientManage({ f7route, f7router }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  let panelRef = useRef();

  const FirebaseApp = useStore("FirebaseApp");

  const firebase = useFirebase(FirebaseApp);

  const database = firebase.db;

  const queryClient = useQueryClient();

  let state = f7route?.query?.state ? JSON.parse(f7route?.query?.state) : null;
  let add = f7route?.query?.add || "";

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const [isLoading, setIsLoading] = useState(true);

  const Client = useQuery({
    queryKey: ["ClientManageID", { Key: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsId({
        pi: 1,
        ps: 1,
        Token: Auth.token,
        Key: "#" + f7route?.params?.id,
      });

      let newPresent = null;

      if (data?.data && data?.data.length > 0) {
        if (!data?.data[0].Present) {
          newPresent = await AdminAPI.clientsPresentId({
            MemberID: f7route?.params?.id,
            Token: Auth.token,
          });
        }
      }

      let bodyFormData = new FormData();
      bodyFormData.append("cmd", "getcheck");
      bodyFormData.append("ids", f7route?.params?.id);

      let { data: CheckIn } = await AdminAPI.getCheckIn({
        data: bodyFormData,
        Token: Auth.token,
        StockID: CrStocks?.ID,
      });

      let RecentlyCheckIn = null;

      if (
        !CheckIn ||
        CheckIn.length === 0 ||
        (CheckIn && CheckIn.length > 0 && CheckIn[0].CheckOutTime)
      ) {
        let recently = await AdminAPI.getCheckInRecently({
          data: {
            MemberID: f7route?.params?.id,
            Top: 10,
          },
          Token: Auth.token,
        });

        RecentlyCheckIn =
          recently?.data?.lst && recently?.data?.lst.length > 0
            ? recently?.data?.lst[0]
            : null;
      }

      return data?.data && data.data.length > 0
        ? {
            ...data.data[0],
            CheckIn:
              CheckIn && CheckIn.length > 0 && !CheckIn[0].CheckOutTime
                ? CheckIn[0]
                : null,
            Present:
              newPresent?.data?.data?.Member &&
              newPresent?.data?.data?.Member.length > 0
                ? newPresent?.data?.data?.Member[0].Present
                : data.data[0].Present,
            RecentlyCheckIn,
          }
        : null;
    },
    onSuccess: (data) => {
      if (!data?.CheckIn?.ID) {
        setIsLoading(false);
      }
    },
    enabled: Number(f7route?.params?.id) > 0,
    initialData: {
      FullName: state?.FullName || "",
      MobilePhone: state?.FullName || "",
    },
  });

  const Order = useQuery({
    queryKey: ["OrderManageID", { ID: Client?.data?.CheckIn?.ID }],
    queryFn: async () => {
      let bodyFormData = new FormData();
      bodyFormData.append("CheckInID", Client?.data?.CheckIn?.ID);

      let { data } = await AdminAPI.clientsOrderId({
        data: bodyFormData,
        Token: Auth.token,
      });

      let Services = await appPOS.getOsList({ mid: f7route?.params?.id });

      Services = Services
        ? Services.filter((x) => x.Product?.IsAddFee !== 1)
        : [];

      let newRs = {
        ...data?.data,
      };
      let newOrderItems = newRs?.OrderItems ? [...newRs?.OrderItems] : [];
      for (let sv of Services) {
        let index = newOrderItems.findIndex(
          (x) => x.ProdID === sv?.OrderItem.ProdID
        );
        if (index > -1) {
          if (newOrderItems[index]["Os"]) {
            newOrderItems[index]["Os"] = [...newOrderItems[index]["Os"], sv];
          } else {
            newOrderItems[index]["Os"] = [sv];
          }
        }
      }
      newRs.OrderItems = newOrderItems.map((x) => {
        let newObj = { ...x };
        let newOs = [];
        if (x.Os && x.Os.length > 0) {
          for (let OsItem of x.Os) {
            if (OsItem.OrderItem.OrderID === x.OrderID) {
              newOs.push(OsItem);
            }
          }
        }
        newObj.Os = newOs;
        return newObj;
      });

      if (Brand?.Global?.Admin?.Pos_quan_ly.kiem_tra_dk_xoa_phu_phi_don_hang) {
        let ids = newRs.OrderItems.filter(
          (x) => x?.ProdOrService === 2 && x?.HasFeeInUse === undefined
        ).map((x) => x.ID);
        if (ids && ids.length > 0) {
          let { data: byUse } = await AdminAPI.getOrderItemInfo24({
            data: {
              ids,
            },
          });
          if (byUse?.lst && byUse?.lst?.length > 0) {
            for (let use of byUse?.lst) {
              let index = newRs.OrderItems.findIndex((k) => k.ID === use.ID);
              if (index > -1) {
                newRs.OrderItems[index]["HasFeeInUse"] = use.HasFeeInUse;
              }
            }
          }
        }
      }

      let ServiceAll = await AdminAPI.clientsServiceUseId({
        ID: f7route?.params?.id,
        Token: Auth?.token,
      });

      newRs.ServiceAll = ServiceAll?.data?.Model?.OrderService || [];

      return newRs;
    },
    onSuccess: () => {
      setIsLoading(false);
    },
    enabled: Number(Client?.data?.CheckIn?.ID) > 0,
  });

  const ServicesUse = useQuery({
    queryKey: ["ServiceUseManageID", { id: f7route?.params?.id }],
    queryFn: async () => {
      let data = null;
      if (appPOS) {
        data = await appPOS.getCurrentOs({
          mid: f7route?.params?.id,
          chk: Client?.data?.CheckIn || null,
        });
      }
      return data && Array.isArray(data)
        ? data.map((x) => ({
            ...x,
            SalaryParseJSON:
              x?.SalaryJSON && JSON.parse(x?.SalaryJSON)?.salaryList
                ? JSON.parse(x?.SalaryJSON)?.salaryList
                : null,
          }))
        : null;
    },
    enabled: Boolean(Client?.data?.ID > 0),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsOrderUpdateId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: f7route?.params?.id,
        Token: Auth.token,
      });
      await Order.refetch();
      await Client.refetch();
      return data;
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsCheckIn(body);
      await Client.refetch();
      await queryClient.invalidateQueries(["InvoiceProcessings"]);
      return data;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsCheckOut(body);
      if (
        Brand?.Global?.Admin?.checkout_time &&
        Brand?.Global?.Admin?.checkout_time.split(";").length > 1
      ) {
        var x = Brand?.Global?.Admin?.checkout_time.split(";")[1];
        var z = data.data.mc.CheckOutTime;
        var c = data.data.mc.CreateDate;

        var z1 = moment().format("YYYY-MM-DD") + " " + x;
        var d1 = new Date(z1);
        var d = new Date(z);

        var mc = moment(c).format("YYYY-MM-DD");
        var mnow = moment().format("YYYY-MM-DD");

        if (mc != mnow || d.getTime() < d1.getTime()) {
          let CheckOutMc = await AdminAPI.clientsCheckOutMc({
            data: {
              mc: data.data.mc,
            },
            Token: Auth?.token,
          });
          data.data["rsMc"] = CheckOutMc?.data;
        }
      }
      await Client.refetch();
      //await Order.refetch();
      await ServicesUse.refetch();
      await queryClient.invalidateQueries(["InvoiceProcessings"]);
      return data;
    },
  });

  const updateCheckoutMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsCheckOutUpdateMc(body);
      return data;
    },
  });

  const signatureMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsSignature(body);
      return data;
    },
  });

  const tipMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientAddEditTIP(body);
      await Client.refetch();
      await Order.refetch();
      return data;
    },
  });

  useEffect(() => {
    let timer = null; // khai báo timer bên ngoài để cleanup hoạt động

    f7ready(() => {
      const add = f7route?.query?.add || "";

      // Ưu tiên kiểm tra add ngay lập tức
      if (add === "prods") return;

      // Đảm bảo các trạng thái load xong mới chạy
      if (
        !isLoading &&
        !Order?.isLoading &&
        !Client?.isLoading &&
        !ServicesUse?.isLoading
      ) {
        const panel = f7.panel.get(Dom7("#panel-pos"));
        const isPrev = panel?.containerEl?.f7Page?.position === "previous";
        const opened = panel?.opened;
        const isOrder =
          Order?.data?.OrderItems && Order?.data?.OrderItems.length > 0;
        const isServiceUse = ServicesUse?.data && ServicesUse?.data.length > 0;

        if (!isPrev && !opened && !isOrder && !isServiceUse) {
          panel?.open();

          if (add === "popover") {
            timer = setTimeout(() => {
              panelRef?.current?.openPopover();
            }, 300);
          }
        }
      }
    });

    // Cleanup để tránh memory leak
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    f7route?.query?.add, // bám trực tiếp vào route.query.add thay vì biến ngoài
    isLoading,
    Order?.isLoading,
    Client?.isLoading,
    ServicesUse?.isLoading,
  ]);

  const onRemoveVoucher = () => {
    f7.dialog.confirm(
      "Xác nhận loại bỏ mã giảm giá này trên đơn hàng ?",
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        var bodyFormData = new FormData();
        bodyFormData.append("CheckInID", Client?.data?.CheckIn?.ID);
        bodyFormData.append("setvcode", 1);
        bodyFormData.append("vcode", "");
        bodyFormData.append("THANH_TOAN_TUY_CHON_DUYET_THUONG", 0);
        updateOrderMutation.mutate(
          {
            data: bodyFormData,
            Token: Auth?.token,
          },
          {
            onSuccess: ({ data }) => {
              f7.dialog.close();
              if (data?.data?.error) {
                toast.error(data?.data?.error);
              } else {
                toast.success("Loại bỏ mã giảm giá thành công.");
                if (data?.data?.prePayedValue) {
                  f7.dialog
                    .create({
                      title: "Đơn hàng đã thay đổi",
                      content: `Tất cả các khoản đã thanh toán có giá trị <span class="text-danger font-lato font-bold text-[15px]">${StringHelpers.formatVND(
                        data?.data?.prePayedValue
                      )}</span> đã bị xoá. Vui lòng thực hiện thanh toán lại !`,
                      buttons: [
                        {
                          text: "Đóng",
                          close: true,
                        },
                      ],
                    })
                    .open();
                }
              }
            },
          }
        );
      }
    );
  };

  const RemoveCTKM = () => {
    f7.dialog.confirm(
      `Xác nhận ${
        Order?.data?.Order?.IsSkipPP ? "sử dụng" : "loại bỏ"
      } CTKM trên đơn hàng ?`,
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        var bodyFormData = new FormData();
        bodyFormData.append("CheckInID", Client?.data?.CheckIn?.ID);
        bodyFormData.append("iskippp", !Order?.data?.Order?.IsSkipPP);
        bodyFormData.append("THANH_TOAN_TUY_CHON_DUYET_THUONG", 1);
        updateOrderMutation.mutate(
          {
            data: bodyFormData,
            Token: Auth?.token,
          },
          {
            onSuccess: ({ data }) => {
              if (data?.data?.error) {
                toast.error(data?.data?.error);
              } else {
                toast.success(
                  `${
                    Order?.data?.Order?.IsSkipPP ? "Sử dụng" : "Loại bỏ"
                  } CTKM thành công.`
                );
              }
              f7.dialog.close();
            },
          }
        );
      }
    );
  };

  const onCheckIn = () => {
    f7.dialog.confirm("Xác nhận Check In cho khách hàng này ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      var bodyFormData = new FormData();
      bodyFormData.append("mid", f7route?.params?.id);
      bodyFormData.append("cmd", "checkin");
      bodyFormData.append("desc", "");

      checkinMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: ({ data }) => {
            toast.success("Khách hàng đã Check In");
            f7.dialog.close();
          },
        }
      );
    });
  };

  window.AlertCheckOut = (Text) => {
    f7.dialog.alert(Text, () => {
      toast.success(Text);
      Client.refetch();
      Order.refetch();
      ServicesUse.refetch();
      queryClient.invalidateQueries(["InvoiceProcessings"]);
      f7router.navigate("/admin/pos/clients/", {
        clearPreviousHistory: true,
      });
    });
  };

  window.PosClientManageReload = () =>
    new Promise(async (resolve, reject) => {
      await Client.refetch();
      await Order.refetch();
      await ServicesUse.refetch();
      await queryClient.invalidateQueries(["InvoiceProcessings"]);
      resolve({ success: true });
    });

  const onCheckOut = () => {
    f7.dialog.confirm("Xác nhận kết thúc cho khách hàng này ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      var bodyFormData = new FormData();
      bodyFormData.append("mid", f7route?.params?.id);
      bodyFormData.append("cmd", "checkout");
      bodyFormData.append("desc", "");
      bodyFormData.append("Signature", "");

      checkoutMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
          StockID: CrStocks?.ID,
          MemberID: f7route?.params?.id,
        },
        {
          onSuccess: ({ data }) => {
            toast.success("Khách hàng đã kết thúc.");
            f7.dialog.close();

            if (data.rsMc && Brand?.Global?.Admin?.checkout_time) {
              updateCheckoutMutation.mutate({
                Token: Auth?.token,
                data: {
                  InCheckIn: data.rsMc,
                  ID: data.mc.ID,
                },
              });
              f7.dialog
                .create({
                  title: "Cập nhập CheckIn",
                  content: `
                  <div class="mt-2">
                    Thay đổi phiên CheckIn <span class="font-lato text-base font-medium">#${
                      data.mc.ID
                    }</span> gồm (<span class="font-lato text-base font-medium">${
                    (data.rsMc?.Orders || []).length
                  }</span>) đơn hàng, (<span class="font-lato text-base font-medium">${
                    (data.rsMc?.OrderService || []).length
                  }</span>) buổi dịch vụ về <span class="font-lato text-base font-medium text-danger">23:59</span> ngày hôm qua.
                  </div>
                `,
                  buttons: [
                    {
                      text: "Đóng",
                      close: true,
                    },
                  ],
                })
                .open();
            } else {
              f7router.navigate("/admin/pos/clients/", {
                clearPreviousHistory: true,
              });
            }

            window?.noti27?.DH_LETAN_CHECKOUT &&
              window?.noti27?.DH_LETAN_CHECKOUT({
                Member: {
                  ...(Client?.data || {}),
                },
                result: data,
              });
          },
        }
      );
    });
  };

  const getStaffMultiOs = (Items) => {
    let Staffs = [];
    for (let item of Items) {
      if (
        item.Services &&
        item.Services.length > 0 &&
        item.Services[0].Staffs &&
        item.Services[0].Staffs.length > 0
      ) {
        Staffs = Staffs.concat(item.Services[0].Staffs);
      }
    }
    return Staffs.map((x) => x.FullName).join(", ");
  };

  const onTIP = () => {
    f7.dialog.preloader("Đang thực hiện ...");

    if (FirebaseApp) {
      remove(
        ref(
          database,
          "tip/" +
            Brand?.Domain?.replace(/^https?:\/\//, "")
              .replaceAll(".", "_")
              .toUpperCase() +
            "/" +
            CrStocks?.ID
        )
      )
        .then(function () {
          set(
            ref(
              database,
              "tip/" +
                Brand?.Domain?.replace(/^https?:\/\//, "")
                  .replaceAll(".", "_")
                  .toUpperCase() +
                "/" +
                CrStocks?.ID +
                "/" +
                f7route?.params?.id
            ),
            {
              CreateDate: moment(new Date()).format("HH:mm DD/MM/YYYY"),
              StockCurrent: CrStocks?.ID,
              FullName: Client?.data?.FullName,
              ID: Client?.data?.ID,
            }
          )
            .then(() => {
              toast.success("Bật TIP thành công.");
              f7.dialog.close();
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch(function (error) {
          console.log("Remove failed: " + error.message);
        });
    } else {
      f7.dialog.close();
      toast.error("Firebase chưa được kết nối.");
    }
  };

  const onTIPAction = ({ Arg }) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let newValues = {
      Amount: 0,
      MemberCheckInID: Client?.data?.CheckIn?.ID,
      Arg,
    };
    tipMutation.mutate(
      {
        data: newValues,
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          toast.success("Cập nhật thành công.");
          f7.dialog.close();
        },
      }
    );
  };

  const onSignature = () => {
    f7.dialog.confirm("Xác nhận thực hiện ký lại ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      signatureMutation.mutate(
        {
          data: {
            mc: Client?.data?.RecentlyCheckIn,
          },
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            toast.success("Đã bật ký lại trên IPAD thành công.");
            f7.dialog.close();
          },
        }
      );
    });
  };

  let DebtPay =
    Order?.data?.Order?.thanhtoan?.tong_gia_tri_dh -
      Order?.data?.Order?.thanhtoan?.thanh_toan_tien -
      Order?.data?.Order?.thanhtoan?.thanh_toan_vi -
      Order?.data?.Order?.thanhtoan?.thanh_toan_ao || 0;

  let isDisabledEdit = () =>
    !Brand?.Global?.Admin?.Chinh_sua_don_hang_da_thanh_toan &&
    (Order?.data?.Order?.CPayed || Order?.data?.Order?.MPayed) &&
    !adminTools_byStock?.hasRight;

  const isDisabled = () => {
    if (Brand?.Global?.Admin?.cam_chinh_gia) {
      if (Auth?.ID === 1) return Auth?.ID !== 1;
      return !adminTools_byStock?.hasRight;
    }
    return false;
  };

  const checkAddEditFee = () => {
    if (!Order?.data?.OrderItems || Order?.data?.OrderItems.length === 0)
      return true;
    return !ArrayHelpers.arrayContains(
      Order?.data?.OrderItems && Order?.data?.OrderItems.map((x) => x.ProdID),
      [
        Number(Brand?.Global?.Admin?.cai_dat_phi?.TIP?.ProdID),
        Number(Brand?.Global?.Admin?.cai_dat_phi?.PHIDICHVU.ProdID),
        Number(Brand?.Global?.Admin?.cai_dat_phi?.PHIQUETTHE.ProdID),
      ]
    );
  };

  return (
    <Page
      noSwipeback
      id="page-pos"
      className="bg-white"
      name="Pos-member"
      onPageBeforeIn={() => {
        PromHelpers.STATUS_BAR_COLOR("light");
        f7.panel.close("#panel-pos");
      }}
      noToolbar
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <div className="flex w-full h-full navbar-custom">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            onClick={() =>
              f7router?.previousRoute?.path === "/admin/pos/clients/add/"
                ? f7.view.main.router.back("/admin/pos/clients", {
                    force: true,
                  })
                : f7router.back()
            }
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
          <div className="flex-1 h-full">
            <Link
              className={clsx(
                "!text-white flex h-full flex-col justify-center",
                !Client?.isLoading &&
                  Client?.data?.CheckIn &&
                  Client?.data?.CheckIn?.StockID !== CrStocks?.ID &&
                  "pointer-events-none"
              )}
              noLinkClass
              panelToggle="left"
            >
              <div className="text-[15px] truncate w-[150px] leading-5 font-medium">
                {Client?.data?.FullName}
              </div>
              <div className="text-[11px] leading-3 font-medium opacity-75 font-lato">
                {Client?.data?.MobilePhone}
              </div>
            </Link>
          </div>
          <div className="flex h-full pr-1">
            {!isLoading &&
            !Order?.isLoading &&
            !Client?.isLoading &&
            !ServicesUse?.isLoading ? (
              <Link
                panelToggle="left"
                noLinkClass
                className="flex flex-col items-center justify-center w-12 h-full text-center !text-white"
              >
                <InformationCircleIcon className="w-6" />
                <div className="text-[10px] leading-3 mt-px">T.Quan</div>
              </Link>
            ) : (
              <Link
                noLinkClass
                className="flex flex-col items-center justify-center w-12 h-full text-center !text-white"
              >
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-6 text-white animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            )}

            <Link
              noLinkClass
              className="flex flex-col items-center justify-center w-12 h-full text-center !text-white"
              onClick={(e) => {
                e.preventDefault();
                f7.panel.close("left");
                f7.views.main.router.navigate(
                  `/admin/pos/manage/${f7route?.params?.id}/services`
                );
              }}
            >
              <CreditCardIcon className="w-6" />
              <div className="text-[10px] leading-3 mt-px">Thẻ LT</div>
            </Link>
            <Link
              noLinkClass
              className="flex flex-col items-center justify-center w-12 h-full text-center !text-white"
              onClick={(e) => {
                e.preventDefault();
                f7.panel.close("left");
                f7.views.main.router.navigate(
                  `/admin/pos/manage/${f7route?.params?.id}/diary/?activeTab=ServicesHistory`
                );
              }}
            >
              <ListBulletIcon className="w-6" />
              <div className="text-[10px] leading-3 mt-px">L.Sử</div>
            </Link>
          </div>
        </div>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full bg-[var(--f7-page-bg-color)]">
        {!Client?.isLoading &&
          Client?.data?.CheckIn &&
          Client?.data?.CheckIn?.StockID !== CrStocks?.ID && (
            <div className="px-3 pt-3">
              <div className="flex justify-center px-4 py-3.5 border-b text-danger bg-white rounded-lg mb-3.5 last:mb-0">
                <ExclamationTriangleIcon className="w-5 mr-2" />
                Đang Check In tại {Client?.data?.CheckIn?.StockTitle}
              </div>
            </div>
          )}

        <div
          className={clsx(
            "overflow-auto grow p-3.5",
            !Client?.isLoading &&
              Client?.data?.CheckIn &&
              Client?.data?.CheckIn?.StockID !== CrStocks?.ID &&
              "grayscale pointer-events-none"
          )}
        >
          <>
            {(isLoading || Order?.isLoading || Client?.isLoading) && (
              <div className="bg-white rounded-lg mb-3.5 last:mb-0">
                {Array(2)
                  .fill()
                  .map((_, index) => (
                    <div
                      className="flex gap-3 p-4 border-b border-dashed last:border-0"
                      key={index}
                    >
                      <div className="w-[70px]">
                        <div className="flex items-center justify-center bg-gray-200 rounded animate-pulse aspect-square">
                          <svg
                            className="w-6 text-gray-300"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 18"
                          >
                            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="w-full h-3.5 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                        <div className="w-8/12 h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex items-center justify-end w-10 opacity-50 animate-pulse">
                        <ChevronRightIcon className="w-6 text-gray-400" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {!isLoading && !Order?.isLoading && !Client?.isLoading && (
              <>
                {Order?.data?.OrderItems &&
                  Order?.data?.OrderItems.length > 0 && (
                    <div className="flex flex-col p-3 bg-white rounded-lg mb-3.5 last:mb-0">
                      <Link
                        className="flex items-center gap-3"
                        noLinkClass
                        popoverOpen=".popover-add-pos"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
                          <ShoppingBagIcon className="w-5" />
                        </div>
                        <div className="font-medium text-primary">
                          Thêm mới mặt hàng, tích thẻ
                        </div>
                      </Link>
                      {/* <div className="border-b border-dashed">
                      <Link
                        popoverOpen=".popover-add-pos"
                        noLinkClass
                        className="flex items-center justify-center px-4 pb-3.5 pt-4 font-semibold text-primary"
                      >
                        <svg
                          className="w-5 fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fillRule="evenodd"
                            d="M.75 2.25a.75.75 0 0 1 .75-.75h1.692a1.5 1.5 0 0 1 1.476 1.232L6.49 12.75h11.144a.75.75 0 0 0 .738-.616l1.14-6.268a.75.75 0 0 1 1.476.268l-1.14 6.268a2.25 2.25 0 0 1-2.213 1.848H6.762l.297 1.634a.75.75 0 0 0 .738.616h9.078a2.625 2.625 0 1 1-2.372 1.5h-4.256a2.625 2.625 0 1 1-4.165-.793 2.25 2.25 0 0 1-.498-1.055L3.192 3H1.5a.75.75 0 0 1-.75-.75M7.875 18a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25m9 0a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25"
                            clipRule="evenodd"
                          />
                          <path d="M12.375 3a.75.75 0 0 1 .75.75v1.875H15a.75.75 0 0 1 0 1.5h-1.875V9a.75.75 0 0 1-1.5 0V7.125H9.75a.75.75 0 0 1 0-1.5h1.875V3.75a.75.75 0 0 1 .75-.75" />
                        </svg>
                        <span className="pl-1.5">
                          Thêm mới mặt hàng, tích thẻ
                        </span>
                      </Link>
                    </div> */}
                    </div>
                  )}
  {console.log(Order?.data?.OrderItems)}
                {Order?.data?.OrderItems &&
                  Order?.data?.OrderItems.length > 0 && (
                    <div className="mb-3.5 last:mb-0">
                      {Order?.data?.OrderItems.map((item, index) => (
                        <PickerEditProd
                          MemberID={f7route?.params?.id}
                          item={item}
                          CheckInID={Client?.data?.CheckIn?.ID}
                          key={index}
                          Order={Order?.data?.Order}
                          OrderItems={Order?.data?.OrderItems}
                        >
                          {({ open }) => (
                            <div
                              className="flex gap-3 p-4 mb-3.5 last:mb-0 bg-white rounded-lg"
                              onClick={open}
                              key={index}
                            >
                              <div className="w-[70px]">
                                <img
                                  className="object-cover w-full border rounded aspect-square"
                                  src={AssetsHelpers.toAbsoluteUrl(
                                    item.Thumbnail
                                  )}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      AssetsHelpers.toAbsoluteUrlCore(
                                        "no-product.png",
                                        "/images/"
                                      );
                                  }}
                                  alt=""
                                />
                              </div>
                              <div className="flex-1">
                                <div className="mb-px font-medium line-clamp-2">
                                  [{item?.ProdCode}] {item?.ProdTitle}
                                  {item.HasFeeInUse && (
                                    <span className="pl-1 text-gray-500">
                                      ( Đã dùng )
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between">
                                  <div className="font-lato">
                                    {item?.Qty}
                                    <span className="px-1">x</span>
                                    {StringHelpers.formatVND(item?.PriceOrder)}
                                    <span className="px-1.5">=</span>
                                    {StringHelpers.formatVND(item?.ToMoney)}
                                  </div>
                                </div>

                                {item?.ProdOrService === 1 &&
                                  item?.Os?.length > 0 && (
                                    <>
                                      {item?.Os?.length === 1 ? (
                                        <div
                                          className="flex text-success mt-1.5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            f7.views.main.router.navigate(
                                              "/admin/pos/calendar/os/?formState=" +
                                                encodeURIComponent(
                                                  JSON.stringify({
                                                    Os: {
                                                      ID: item?.Os[0]
                                                        .Services[0]?.ID,
                                                      MemberID:
                                                        item?.Os[0].Services[0]
                                                          ?.MemberID || "",
                                                      ProdService:
                                                        item?.Os[0].Services[0]
                                                          ?.ProdService || "",
                                                      ProdService2:
                                                        item?.Os[0].Services[0]
                                                          ?.ProdService2 || "",
                                                      Title:
                                                        item?.Os[0].Services[0]
                                                          ?.Title || "",
                                                    },
                                                  })
                                                )
                                            );
                                          }}
                                        >
                                          {item?.Os[0].Services[0].Staffs &&
                                          item?.Os[0].Services[0].Staffs
                                            .length > 0 ? (
                                            <span className="text-sm">
                                              <span className="pr-1">NV:</span>
                                              {item?.Os[0].Services[0].Staffs.map(
                                                (x) => x.FullName
                                              ).join(", ")}
                                            </span>
                                          ) : (
                                            <>
                                              <PlusIcon className="w-3.5 mr-1" />
                                              <span className="text-sm">
                                                Nhân viên thực hiện
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <>
                                          <Link
                                            noLinkClass
                                            className="flex text-success mt-1.5"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                            popoverOpen={`.popover-OrderItem-${item?.ID}`}
                                          >
                                            {getStaffMultiOs(item?.Os) ? (
                                              <>
                                                <span className="pr-1">
                                                  NV:
                                                </span>
                                                {getStaffMultiOs(item?.Os)}
                                              </>
                                            ) : (
                                              <>
                                                <PlusIcon className="w-3.5 mr-1" />
                                                <span className="text-sm">
                                                  Nhân viên thực hiện
                                                </span>
                                              </>
                                            )}
                                          </Link>
                                          <Popover
                                            className={`popover-OrderItem-${item?.ID}`}
                                          >
                                            <div className="flex flex-col py-1">
                                              {item?.Os.map((os, i) => (
                                                <Link
                                                  key={i}
                                                  popoverClose
                                                  className="flex flex-col p-3 font-medium border-b last:border-0"
                                                  noLinkClass
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    f7.views.main.router.navigate(
                                                      "/admin/pos/calendar/os/?formState=" +
                                                        encodeURIComponent(
                                                          JSON.stringify({
                                                            Os: {
                                                              ID: os.Services[0]
                                                                ?.ID,
                                                              MemberID:
                                                                os.Services[0]
                                                                  ?.MemberID ||
                                                                "",
                                                              ProdService:
                                                                os.Services[0]
                                                                  ?.ProdService ||
                                                                "",
                                                              ProdService2:
                                                                os.Services[0]
                                                                  ?.ProdService2 ||
                                                                "",
                                                              Title:
                                                                os.Services[0]
                                                                  ?.Title || "",
                                                            },
                                                          })
                                                        )
                                                    );
                                                  }}
                                                >
                                                  <div>
                                                    [#{os?.Product?.ID}]{" "}
                                                    {os?.Product?.Title}
                                                  </div>

                                                  {os?.Services &&
                                                  os?.Services[0].Staffs &&
                                                  os?.Services[0].Staffs
                                                    .length > 0 ? (
                                                    <div className="mt-1 text-sm font-light text-gray-600">
                                                      <span className="pr-1">
                                                        NV:
                                                      </span>
                                                      {os?.Services[0].Staffs.map(
                                                        (x) => x.FullName
                                                      ).join(", ")}
                                                    </div>
                                                  ) : (
                                                    <></>
                                                  )}
                                                </Link>
                                              ))}
                                            </div>
                                          </Popover>
                                        </>
                                      )}
                                    </>
                                  )}
                              </div>
                              <div className="flex items-center justify-end w-10">
                                <ChevronRightIcon className="w-6 text-gray-400" />
                              </div>
                            </div>
                          )}
                        </PickerEditProd>
                      ))}
                    </div>
                  )}
                {(!Order?.data?.OrderItems ||
                  Order?.data?.OrderItems.length === 0) && (
                  <div
                    className={clsx(
                      "flex flex-col items-center justify-center px-8 py-8 text-center",
                      ServicesUse?.data && ServicesUse?.data.length > 0
                        ? "h-auto"
                        : "h-full"
                    )}
                  >
                    <div className="mb-5">
                      <img
                        className="w-16"
                        src={AssetsHelpers.toAbsoluteUrlCore(
                          "/AppCore/images/empty-cart.png",
                          ""
                        )}
                      />
                    </div>
                    <div className="text-base font-medium">
                      Hoá đơn đang trống
                    </div>
                    <div className="font-light text-[#757676] mt-2">
                      Chạm vào một mục
                      <span className="px-1 font-medium">
                        "Thêm mới hoá đơn"
                      </span>
                      bên dưới để thêm mới hoá đơn.
                    </div>
                    <div className="mt-5">
                      <Link
                        popoverOpen=".popover-add-pos"
                        className="px-4 py-3 font-medium text-white rounded bg-app"
                      >
                        Thêm mới hoá đơn
                        <ChevronDownIcon className="w-5 ml-2" />
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </>

          {ServicesUse?.isLoading && (
            <div className="mb-3.5 last:mb-0">
              {Array(2)
                .fill()
                .map((_, index) => (
                  <div
                    className="flex gap-3 p-4 bg-white mb-3.5 last:mb-0 rounded-lg"
                    key={index}
                  >
                    <div className="w-[70px]">
                      <div className="flex items-center justify-center bg-gray-200 rounded animate-pulse aspect-square">
                        <svg
                          className="w-6 text-gray-300"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 20 18"
                        >
                          <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="w-full h-3.5 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                      <div className="w-8/12 h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-end w-10 opacity-50 animate-pulse">
                      <ChevronRightIcon className="w-6 text-gray-400" />
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!ServicesUse?.isLoading && (
            <>
              {ServicesUse?.data && ServicesUse?.data.length > 0 && (
                <div className="last:mb-0">
                  {ServicesUse?.data
                    ?.filter((x) => x.OrderID !== Order?.data?.Order?.ID)
                    .map((item, index) => (
                      <Link
                        href={
                          "/admin/pos/calendar/os/?formState=" +
                          encodeURIComponent(
                            JSON.stringify({
                              Os: {
                                ID: item?.ID,
                                MemberID: item?.MemberID || "",
                                ProdService: item?.ProdService || "",
                                ProdService2: item?.ProdService2 || "",
                                Title: item?.Title || "",
                              },
                            })
                          )
                        }
                        className="flex gap-3 p-4 mb-3.5 bg-white rounded-lg last:mb-0"
                        key={index}
                      >
                        <div className="w-[70px] aspect-square bg-gray-100 rounded flex items-center justify-center border">
                          <svg
                            className="w-11"
                            viewBox="0 0 64 64"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <title />
                            <g data-name="Layer 5" id="Layer_5">
                              <rect
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                height={6}
                                width={48}
                                x={14}
                                y={50}
                              />
                              <polyline
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                points="60 56 60 62 56 62 56 56"
                              />
                              <polyline
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                points="20 56 20 62 16 62 16 56"
                              />
                              <path
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                d="M60,50V46a2,2,0,0,0-2-2H18a2,2,0,0,0-2,2v4"
                              />
                              <path
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                d="M54,44V39a1,1,0,0,0-1-1H41a1,1,0,0,0-1,1v5"
                              />
                              <path
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                d="M36,44V39a1,1,0,0,0-1-1H23a1,1,0,0,0-1,1v5"
                              />
                              <path
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                d="M58,44V36a4,4,0,0,0-4-4H22a4,4,0,0,0-4,4v8"
                              />
                              <path
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                d="M33.42,32A18,18,0,1,0,18,37.89"
                              />
                              <line
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                x1={20}
                                x2={20}
                                y1={2}
                                y2={7}
                              />
                              <line
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                x1={2}
                                x2={7}
                                y1={20}
                                y2={20}
                              />
                              <line
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                x1={33}
                                x2={38}
                                y1={20}
                                y2={20}
                              />
                              <polyline
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                points="29 20 20 20 20 13"
                              />
                              <polyline
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                points="41 20 48 20 42 26 49 26"
                              />
                              <polyline
                                className="fill-none stroke-gray-800 stroke-[2px]"
                                points="62 16 55 16 61 10 54 10"
                              />
                            </g>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex mb-1.5 gap-1">
                            <div
                              className={clsx(
                                "px-1.5 py-px text-[12px] rounded bg-success-light text-success"
                              )}
                            >
                              Tích thẻ
                            </div>
                            <div
                              className={clsx(
                                "px-1.5 py-px text-[12px] rounded",
                                item.Status === "doing"
                                  ? "bg-warning-light text-warning"
                                  : "bg-success-light text-success"
                              )}
                            >
                              {item.Status === "doing"
                                ? "Đang thực hiện"
                                : "Hoàn thành"}
                            </div>
                            {item.IsWarrant && (
                              <div className="px-1.5 py-px text-[12px] rounded bg-success-light text-success">
                                BH
                              </div>
                            )}
                          </div>
                          <div className="mb-px font-medium line-clamp-2">
                            [#{item?.ID}] {item?.OrderTitle}
                          </div>
                          <div>
                            {item.SalaryParseJSON &&
                              item.SalaryParseJSON.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  <span className="pr-2">NV:</span>
                                  {item.SalaryParseJSON.map(
                                    (x) =>
                                      `${
                                        x.UserFullName
                                      } (${StringHelpers.formatVND(x.Value)})`
                                  ).join(", ")}
                                </div>
                              )}
                            {item.Fees && item.Fees.length > 0 && (
                              <div className="text-xs text-gray-600">
                                <span className="pr-2">PP:</span>
                                {item.Fees.map(
                                  (x) => `${x.Title} (${x.Qty})`
                                ).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-6">
                          <ChevronRightIcon className="w-6 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <div
          className={clsx(
            "shadow-lg pb-safe-b bg-white",
            !Client?.isLoading &&
              Client?.data?.CheckIn &&
              Client?.data?.CheckIn?.StockID !== CrStocks?.ID &&
              "pointer-events-none grayscale"
          )}
        >
          <div className="flex justify-between gap-2 py-1 pr-4 border-t">
            <PickerDiscountCodeOrder
              CheckIn={Client?.data?.CheckIn}
              Order={Order?.data?.Order}
            >
              {({ open }) => (
                <>
                  {Order?.data?.Order?.VoucherCode && (
                    <div className="relative flex w-[calc(100%-145px)]">
                      <div
                        className="relative w-[calc(100%-40px)]"
                        onClick={() => !isDisabledEdit() && open()}
                      >
                        <svg
                          className="absolute z-10 stroke-2 w-6 top-2/4 -translate-y-2/4 left-3.5 stroke-gray-800 pointer-events-none"
                          viewBox="0 0 64 64"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <title />
                          <g id="Discount">
                            <path d="M61.5894,44.5781,43.5591,7.94a4.0025,4.0025,0,0,0-4.1221-2.2l-16.66,2.27c-.0314.0043-.0576.0207-.0879.0278a.9494.9494,0,0,0-.0938.0152l-8.2427,2.7493L3.6245,2.2188a1,1,0,0,0-1.249,1.5625l9.7172,7.7737L6.6509,13.37a3.9751,3.9751,0,0,0-2.7393,3.79V58a4.0043,4.0043,0,0,0,4,4h30a3.9489,3.9489,0,0,0,3.9078-3.2371l17.9438-8.8254A4.0094,4.0094,0,0,0,61.5894,44.5781ZM39.9116,57.96a1.0186,1.0186,0,0,0-.0093.1152A1.9717,1.9717,0,0,1,37.9116,60h-30a2.0023,2.0023,0,0,1-2-2V17.16a1.9822,1.9822,0,0,1,1.3667-1.8916l6.6737-2.2262,5.3435,4.2749A3.9578,3.9578,0,0,0,18.9116,19a4,4,0,1,0,4-4,3.9643,3.9643,0,0,0-2.3435.7736l-4.3563-3.485,6.7-2.2348,15.6393,5.2167a1.98,1.98,0,0,1,1.3608,1.89ZM23.6245,18.2188,22.252,17.1207a1.9741,1.9741,0,0,1,.66-.1207,2.0226,2.0226,0,1,1-1.9635,1.6393l1.4274,1.142a1,1,0,0,0,1.249-1.5625ZM58.8813,48.1426H58.88L41.9116,56.4883V17.16a3.9731,3.9731,0,0,0-2.7334-3.7881L27.3037,9.4111l12.4-1.6894a2,2,0,0,1,2.06,1.1l18.03,36.6377A2.0072,2.0072,0,0,1,58.8813,48.1426Z" />
                            <path d="M16.6855,39.5449A4.7688,4.7688,0,1,0,13.31,38.1494,4.7584,4.7584,0,0,0,16.6855,39.5449Zm-1.9614-6.7324a2.775,2.775,0,1,1-.812,1.9619A2.763,2.763,0,0,1,14.7241,32.8125Z" />
                            <path d="M25.7627,43.8506a4.7734,4.7734,0,1,0,6.751,0A4.7408,4.7408,0,0,0,25.7627,43.8506ZM31.1,49.1875a2.775,2.775,0,1,1,.812-1.9619A2.7778,2.7778,0,0,1,31.1,49.1875Z" />
                            <path d="M32.5137,31.3984a1,1,0,0,0-1.4141,0L13.31,49.1875a1,1,0,1,0,1.414,1.4141l17.79-17.7891A1,1,0,0,0,32.5137,31.3984Z" />
                          </g>
                        </svg>
                        <div className="py-3 font-semibold truncate pl-14">
                          <span className="uppercase text-success">
                            {Order?.data?.Order?.VoucherCode}
                          </span>
                          <span className="pl-2 text-[12px] font-medium text-gray-500">
                            (-{Order?.data?.Order.Discount})
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex items-center justify-center w-[40px] min-w-[40px] opacity-80"
                        onClick={() => !isDisabledEdit() && onRemoveVoucher()}
                      >
                        <XMarkIcon className="w-5" />
                      </div>
                    </div>
                  )}
                  {!Order?.data?.Order?.VoucherCode && (
                    <div
                      className="relative flex-1"
                      onClick={() =>
                        !isDisabledEdit() &&
                        Order?.data?.Order?.ID > 0 &&
                        open()
                      }
                    >
                      <svg
                        className="absolute z-10 stroke-2 w-6 top-2/4 -translate-y-2/4 left-3.5 stroke-gray-800 pointer-events-none"
                        viewBox="0 0 64 64"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title />
                        <g id="Discount">
                          <path d="M61.5894,44.5781,43.5591,7.94a4.0025,4.0025,0,0,0-4.1221-2.2l-16.66,2.27c-.0314.0043-.0576.0207-.0879.0278a.9494.9494,0,0,0-.0938.0152l-8.2427,2.7493L3.6245,2.2188a1,1,0,0,0-1.249,1.5625l9.7172,7.7737L6.6509,13.37a3.9751,3.9751,0,0,0-2.7393,3.79V58a4.0043,4.0043,0,0,0,4,4h30a3.9489,3.9489,0,0,0,3.9078-3.2371l17.9438-8.8254A4.0094,4.0094,0,0,0,61.5894,44.5781ZM39.9116,57.96a1.0186,1.0186,0,0,0-.0093.1152A1.9717,1.9717,0,0,1,37.9116,60h-30a2.0023,2.0023,0,0,1-2-2V17.16a1.9822,1.9822,0,0,1,1.3667-1.8916l6.6737-2.2262,5.3435,4.2749A3.9578,3.9578,0,0,0,18.9116,19a4,4,0,1,0,4-4,3.9643,3.9643,0,0,0-2.3435.7736l-4.3563-3.485,6.7-2.2348,15.6393,5.2167a1.98,1.98,0,0,1,1.3608,1.89ZM23.6245,18.2188,22.252,17.1207a1.9741,1.9741,0,0,1,.66-.1207,2.0226,2.0226,0,1,1-1.9635,1.6393l1.4274,1.142a1,1,0,0,0,1.249-1.5625ZM58.8813,48.1426H58.88L41.9116,56.4883V17.16a3.9731,3.9731,0,0,0-2.7334-3.7881L27.3037,9.4111l12.4-1.6894a2,2,0,0,1,2.06,1.1l18.03,36.6377A2.0072,2.0072,0,0,1,58.8813,48.1426Z" />
                          <path d="M16.6855,39.5449A4.7688,4.7688,0,1,0,13.31,38.1494,4.7584,4.7584,0,0,0,16.6855,39.5449Zm-1.9614-6.7324a2.775,2.775,0,1,1-.812,1.9619A2.763,2.763,0,0,1,14.7241,32.8125Z" />
                          <path d="M25.7627,43.8506a4.7734,4.7734,0,1,0,6.751,0A4.7408,4.7408,0,0,0,25.7627,43.8506ZM31.1,49.1875a2.775,2.775,0,1,1,.812-1.9619A2.7778,2.7778,0,0,1,31.1,49.1875Z" />
                          <path d="M32.5137,31.3984a1,1,0,0,0-1.4141,0L13.31,49.1875a1,1,0,1,0,1.414,1.4141l17.79-17.7891A1,1,0,0,0,32.5137,31.3984Z" />
                        </g>
                      </svg>

                      <Input
                        className="[&_input]:border-0 [&_input]:shadow-none [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14 pointer-events-none"
                        type="text"
                        placeholder="Mã giảm giá"
                        readonly
                      />
                    </div>
                  )}
                </>
              )}
            </PickerDiscountCodeOrder>

            <div className="w-[145px] flex items-end flex-col justify-center">
              <div className="leading-3 text-[13px] text-gray-500 font-medium">
                Tổng đơn hàng
              </div>
              {Order?.isLoading && (
                <div className="w-2/4 h-5 mt-2 bg-gray-200 rounded-full animate-pulse"></div>
              )}
              {!Order?.isLoading && (
                <div className="text-[20px] leading-5 font-[800] font-lato mt-1 text-app">
                  {StringHelpers.formatVND(Order?.data?.Order?.ToPay)}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-3 border-t">
            {DebtPay &&
            DebtPay !== Order?.data?.Order?.thanhtoan?.tong_gia_tri_dh ? (
              <div className="flex items-end justify-between mb-2.5">
                <div className="font-medium leading-3">Đã thanh toán</div>
                <div className="text-base font-bold leading-3 font-lato text-success">
                  ₫
                  {StringHelpers.formatVND(
                    Order?.data?.Order?.thanhtoan?.tong_gia_tri_dh - DebtPay
                  )}
                </div>
              </div>
            ) : (
              <></>
            )}

            <div className="flex gap-2">
              <Button
                style={{ "--f7-preloader-color": "#000" }}
                popoverOpen=".popover-order-paymented"
                type="button"
                className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
                fill
                large
                preloader
                loading={Order?.isLoading || Client.isLoading}
                disabled={
                  Order?.isLoading ||
                  Client.isLoading ||
                  (!Client?.data?.CheckIn && !Order?.data?.Order?.ID) ||
                  !(
                    (!Client?.data?.CheckIn && Client?.data?.RecentlyCheckIn) ||
                    (Brand?.Global?.Admin?.cai_dat_phi?.visible &&
                      checkAddEditFee()) ||
                    Order?.data?.OrderItems?.length > 0
                  )
                }
                // disabled={
                //   Order?.isLoading ||
                //   Client.isLoading ||
                //   (!Client?.data?.CheckIn && !Client?.data?.RecentlyCheckIn) ||
                //   !Client?.data?.CheckIn ||
                //   !Order?.data?.Order?.ID ||
                //   Order?.data?.OrderItems?.length === 0
                // }
              >
                <EllipsisVerticalIcon className="w-6" />
              </Button>

              <Popover
                className="popover-order-paymented"
                onPopoverClosed={() => {
                  Dom7(".popover").each(function (el) {
                    f7.popover.close(el);
                  });
                }}
              >
                <div className="flex flex-col py-1">
                  {!Client?.data?.CheckIn && Client?.data?.RecentlyCheckIn && (
                    <Link
                      popoverClose
                      className="flex justify-between p-3 font-medium border-b last:border-0"
                      noLinkClass
                      onClick={onSignature}
                    >
                      Ký lại
                    </Link>
                  )}

                  {Brand?.Global?.Admin?.cai_dat_phi?.visible &&
                    checkAddEditFee() && (
                      <PickerAddEditFee
                        Order={Order?.data}
                        Client={Client?.data}
                        ServicesUse={ServicesUse?.data}
                      >
                        {({ open }) => (
                          <>
                            <Link
                              onClick={open}
                              popoverClose
                              className="flex justify-between p-3 font-medium border-b last:border-0"
                              noLinkClass
                            >
                              Phí
                            </Link>
                          </>
                        )}
                      </PickerAddEditFee>
                    )}

                  {Client?.data?.CheckIn &&
                  Order?.data?.Order?.ID &&
                  Order?.data?.OrderItems?.length > 0 ? (
                    <>
                      {!isDisabledEdit() && (
                        <>
                          <Link
                            popoverClose
                            className="flex justify-between p-3 font-medium border-b last:border-0"
                            noLinkClass
                            onClick={RemoveCTKM}
                          >
                            Áp dụng CTKM
                            <div className="w-9 h-5 bg-[#EBEDF3] rounded-[30px] relative items-center">
                              <div
                                className={clsx(
                                  "h-[15px] w-[15px] absolute shadow rounded-full top-2/4 -translate-y-2/4",
                                  !Order?.data?.Order?.IsSkipPP
                                    ? "right-1 bg-primary"
                                    : "left-1 bg-white"
                                )}
                              ></div>
                            </div>
                          </Link>
                          {!isDisabled() && (
                            <PickerDiscountEnterOrder
                              CheckIn={Client?.data?.CheckIn}
                              Order={Order?.data?.Order}
                            >
                              {({ open }) => (
                                <Link
                                  onClick={open}
                                  popoverClose
                                  className="flex justify-between p-3 font-medium border-b last:border-0"
                                  noLinkClass
                                >
                                  Giảm giá
                                  {Order?.data?.Order?.CustomeDiscount > 0 ? (
                                    <div className="px-1.5 font-semibold text-xs text-white rounded bg-danger font-lato flex items-center">
                                      {Order?.data?.Order?.CustomeDiscount > 100
                                        ? StringHelpers.formatVND(
                                            Order?.data?.Order?.CustomeDiscount
                                          )
                                        : `${Order?.data?.Order?.CustomeDiscount}%`}
                                    </div>
                                  ) : (
                                    <></>
                                  )}
                                </Link>
                              )}
                            </PickerDiscountEnterOrder>
                          )}
                        </>
                      )}

                      <PickerAff
                        data={Order?.data?.Order?.AffM}
                        Order={Order?.data?.Order}
                        OrderItems={Order?.data?.OrderItems}
                      >
                        {({ open }) => (
                          <Link
                            popoverClose
                            className="flex justify-between p-3 font-medium border-b last:border-0"
                            noLinkClass
                            onClick={open}
                          >
                            Giới thiệu
                            {Order?.data?.Order?.AffM?.length > 0 && (
                              <div className="px-1.5 font-semibold text-xs text-white rounded bg-danger font-lato flex items-center">
                                {Order?.data?.Order?.AffM?.length}
                              </div>
                            )}
                          </Link>
                        )}
                      </PickerAff>
                      {!Brand?.Global?.Admin?.cai_dat_phi?.visible &&
                        Brand?.Global?.Admin?.Tips &&
                        Client?.data?.CheckIn?.CreateDate && (
                          <PickerAddEditTIP
                            Value={Client?.data?.CheckIn?.MemberTipAmount}
                            Client={Client?.data}
                          >
                            {({ open }) => (
                              <>
                                <Link
                                  className="flex justify-between p-3 font-medium border-b last:border-0"
                                  noLinkClass
                                  popoverOpen=".popover-tips-menu"
                                >
                                  TIP
                                  {Client?.data?.CheckIn?.MemberTipAmount >
                                  0 ? (
                                    <div className="px-1.5 font-semibold text-xs text-white rounded bg-success font-lato flex items-center">
                                      {StringHelpers.formatVND(
                                        Client?.data?.CheckIn?.MemberTipAmount
                                      )}
                                    </div>
                                  ) : (
                                    <span className="pl-1">
                                      ({Client?.data?.CheckIn?.MemberTipDesc})
                                    </span>
                                  )}
                                </Link>
                                <Popover className="popover-tips-menu w-[150px] shadow-lg">
                                  <div className="flex flex-col py-1">
                                    <Link
                                      popoverClose
                                      className="flex justify-between p-3 font-medium border-b last:border-0"
                                      noLinkClass
                                      onClick={() => {
                                        open();
                                        Dom7(".popover").each(function (el) {
                                          f7.popover.close(el);
                                        });
                                      }}
                                    >
                                      Nhập tiền TIP
                                    </Link>
                                    <Link
                                      onClick={() => {
                                        onTIP();
                                        Dom7(".popover").each(function (el) {
                                          f7.popover.close(el);
                                        });
                                      }}
                                      popoverClose
                                      className="flex justify-between p-3 font-medium border-b last:border-0"
                                      noLinkClass
                                    >
                                      Hiển thị IPAD
                                    </Link>
                                    <Link
                                      onClick={() => {
                                        onTIPAction({ Arg: 0 });
                                        Dom7(".popover").each(function (el) {
                                          f7.popover.close(el);
                                        });
                                      }}
                                      popoverClose
                                      className="flex justify-between p-3 font-medium border-b last:border-0"
                                      noLinkClass
                                    >
                                      Đã TIP ngoài
                                    </Link>
                                    <Link
                                      onClick={() => {
                                        onTIPAction({ Arg: "VAT" });
                                        Dom7(".popover").each(function (el) {
                                          f7.popover.close(el);
                                        });
                                      }}
                                      popoverClose
                                      className="flex justify-between p-3 font-medium border-b last:border-0"
                                      noLinkClass
                                    >
                                      TIP kèm hoá đơn
                                    </Link>
                                  </div>
                                </Popover>
                              </>
                            )}
                          </PickerAddEditTIP>
                        )}

                      <PickerAccumulate
                        data={Order?.data?.Order?.TAKE_MM}
                        Order={Order?.data?.Order}
                      >
                        {({ open }) => (
                          <Link
                            popoverClose
                            className="flex justify-between p-3 font-medium border-b last:border-0"
                            noLinkClass
                            onClick={open}
                          >
                            Tích luỹ
                            {Order?.data?.Order?.TAKE_MM?.length > 0 && (
                              <div className="px-1.5 font-semibold text-xs text-white rounded bg-danger font-lato flex items-center">
                                {Order?.data?.Order?.TAKE_MM?.length}
                              </div>
                            )}
                          </Link>
                        )}
                      </PickerAccumulate>

                      <Link
                        popoverClose
                        className="flex justify-between p-3 font-medium border-b last:border-0"
                        noLinkClass
                        href={`/admin/pos/orders/view/${Order?.data?.Order?.ID}/bonus-sales-commission/`}
                        //href={`/admin/pos/orders/view/${Order?.data?.Order?.ID}/bonus-sales-commission-sharing/`}
                      >
                        Hoa hồng & Doanh số
                        {Order?.data?.Order?.Counter?.doanh_so +
                          Order?.data?.Order?.Counter?.thuong >
                          0 && (
                          <div className="px-1.5 font-semibold text-xs text-white rounded bg-danger font-lato flex items-center">
                            {Order?.data?.Order?.Counter?.doanh_so +
                              Order?.data?.Order?.Counter?.thuong}
                          </div>
                        )}
                      </Link>

                      {(!Brand?.Global?.Admin?.ks_chuyen_ngay ||
                        (Brand?.Global?.Admin?.ks_chuyen_ngay &&
                          adminTools_byStock?.hasRight)) && (
                        <PickerChangeDateOrder
                          Order={Order?.data?.Order}
                          OrderID={Order?.data?.Order?.ID}
                          invalidateQueries={["OrderManageID"]}
                        >
                          {({ open }) => (
                            <Link
                              popoverClose
                              className="flex justify-between p-3 font-medium border-b last:border-0"
                              noLinkClass
                              onClick={open}
                            >
                              Chuyển ngày đơn hàng
                            </Link>
                          )}
                        </PickerChangeDateOrder>
                      )}

                      <PickerPaymentDateOrder
                        Order={Order?.data?.Order}
                        OrderID={Order?.data?.Order?.ID}
                      >
                        {({ open }) => (
                          <Link
                            onClick={open}
                            popoverClose
                            className="flex justify-between p-3 font-medium border-b last:border-0"
                            noLinkClass
                          >
                            Ngày thanh toán dự kiến
                          </Link>
                        )}
                      </PickerPaymentDateOrder>

                      <PickerPaymentNoteOrder
                        Order={Order?.data?.Order}
                        OrderID={Order?.data?.Order?.ID}
                        invalidateQueries={["OrderManageID"]}
                      >
                        {({ open }) => (
                          <Link
                            onClick={open}
                            popoverClose
                            className="flex justify-between p-3 font-medium border-b last:border-0"
                            noLinkClass
                          >
                            Ghi chú
                          </Link>
                        )}
                      </PickerPaymentNoteOrder>
                    </>
                  ) : (
                    <></>
                  )}
                  {Brand?.Global?.Admin?.cai_dat_sl_khach &&
                  Order?.data?.mck?.ID ? (
                    <PickerGuestsOrder CheckInID={Order?.data?.mck}>
                      {({ open }) => (
                        <Link
                          popoverClose
                          className="flex justify-between p-3 font-medium border-b last:border-0"
                          noLinkClass
                          onClick={open}
                        >
                          Số khách
                          {Order?.data?.mck?.GuestCount > 0 && (
                            <div className="px-1.5 font-semibold text-xs text-white rounded bg-danger font-lato flex items-center">
                              {Order?.data?.mck?.GuestCount}
                            </div>
                          )}
                        </Link>
                      )}
                    </PickerGuestsOrder>
                  ) : (
                    <></>
                  )}
                </div>
              </Popover>
              <PickerPayments Order={Order?.data?.Order} Client={Client?.data}>
                {({ open }) => (
                  <Button
                    onClick={() =>
                      DebtPay > 0 ||
                      (Order?.data?.Order?.ID || 0) === 0 ||
                      Order?.data?.Order?.ToPay === 0
                        ? open()
                        : f7.views.main.router.navigate(
                            `/admin/pos/orders/view/${Order?.data?.Order?.ID}/split-payments/`
                          )
                    }
                    type="button"
                    className="flex-1 bg-success"
                    fill
                    large
                    preloader
                    loading={Order?.isLoading}
                    disabled={
                      Order?.isLoading ||
                      !Client?.data?.CheckIn ||
                      !Order?.data?.Order?.ID ||
                      Order?.data?.OrderItems?.length === 0
                    }
                  >
                    {DebtPay === 0 &&
                    Order?.data?.Order?.ID > 0 &&
                    Order?.data?.Order?.ToPay > 0 &&
                    Order?.data?.OrderItems?.length > 0
                      ? "Đã thanh toán"
                      : "Thanh toán"}
                  </Button>
                )}
              </PickerPayments>
              {Client?.data?.CheckIn && (
                <Button
                  onClick={onCheckOut}
                  className="rounded bg-primary w-[120px]"
                  fill
                  large
                  preloader
                  loading={Order?.isLoading || checkoutMutation.isLoading}
                  disabled={Order?.isLoading || checkoutMutation.isLoading}
                  type="button"
                >
                  Kết thúc
                </Button>
              )}
              {Brand?.Global?.Admin?.check_in_mobile &&
                !Client?.data?.CheckIn && (
                  <Button
                    className="rounded bg-primary w-[120px]"
                    fill
                    large
                    preloader
                    loading={Order?.isLoading}
                    disabled={Order?.isLoading}
                    type="button"
                    onClick={onCheckIn}
                  >
                    Check In
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      <Popover className="popover-add-pos">
        <div className="flex flex-col py-2">
          <Link
            className="inline-flex px-4 py-3 border-b last:border-0"
            popoverClose
            panelClose
            noLinkClass
            href={`/admin/pos/manage/${f7route?.params?.id}/add-prods`}
          >
            Mua mới sản phẩm, liệu trình
          </Link>
          <Link
            className="inline-flex px-4 py-3 border-b last:border-0"
            popoverClose
            panelClose
            noLinkClass
            href={`/admin/pos/manage/${f7route?.params?.id}/services`}
          >
            Tích thẻ liệu trình có sẵn
          </Link>
        </div>
      </Popover>

      <PanelPos Client={Client?.data} ref={panelRef} />
    </Page>
  );
}

export default PosClientManage;

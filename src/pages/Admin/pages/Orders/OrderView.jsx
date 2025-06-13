import {
  ChevronLeftIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import React from "react";
import PromHelpers from "@/helpers/PromHelpers";
import { useMutation, useQuery, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import StringHelpers from "@/helpers/StringHelpers";
import moment from "moment";
import { toast } from "react-toastify";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import {
  PickerChangeDateOrder,
  PickerCodOrder,
  PickerDebtLockOrder,
  PickerGiftOrder,
  PickerServiceUseOrder,
} from "./components";
import clsx from "clsx";
import AssetsHelpers from "@/helpers/AssetsHelpers";

function OrderViewAdmin({ f7router, f7route }) {
  const queryClient = useQueryClient();

  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ClientOrderViewID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsViewOrderId({
        OrderID: f7route?.params?.id,
        Token: Auth?.token,
      });

      return data || null;
    },
    onSuccess: (data) => {
      if (data.error) {
        f7.dialog.alert("Đơn hàng đã bị xoá hoặc không tồn tại.", async () => {
          f7.dialog.preloader("Đang xử lý ...");
          await queryClient.invalidateQueries(["OrdersList"]);
          f7.dialog.close();
          f7router.back();
        });
      }
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const cancelGiftMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientCancelGiftOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: data?.Order?.Member?.ID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["Processings"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      await refetch();
      return data;
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientCancelOrderId(body);
      await queryClient.invalidateQueries(["Processings"]);
      await refetch();
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let rs = await AdminAPI.clientDeleteOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: data?.Order?.Member?.ID,
        Token: Auth.token,
      });
      await queryClient.invalidateQueries(["ClientOrderID"]);
      await queryClient.invalidateQueries(["OrdersList"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      await queryClient.invalidateQueries(["Processings"]);

      return rs;
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.createMemberBooking(body);
      return data;
    },
  });

  const changeMemberMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsChangeMemberOrderId(body);
      return data;
    },
  });

  const finishMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientFinishOrderId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: data?.Order?.Member?.ID,
        Token: Auth.token,
      });
      await refetch();
      await queryClient.invalidateQueries(["ClientOrderID"]);
      await queryClient.invalidateQueries(["ClientManageID"]);
      await queryClient.invalidateQueries(["OrdersList"]);
      await queryClient.invalidateQueries(["Processings"]);

      return data;
    },
  });

  const onCancelGift = () => {
    f7.dialog.confirm("Xác nhận huỷ tặng đơn hàng ?", () => {
      cancelGiftMutation.mutate(
        {
          data: {
            AbstractSource: "TANG_DH_KET_THUC_NO",
            OrderID: f7route?.params?.id,
          },
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            toast.success("Huỷ tặng đơn hàng thành công.");
          },
        }
      );
    });
  };

  const onCancelDebtLock = () => {
    f7.dialog.confirm("Xác nhận huỷ khoá nợ ?", () => {
      cancelGiftMutation.mutate(
        {
          data: {
            AbstractSource: "KHOA_NO_KET_THUC_NO",
            OrderID: f7route?.params?.id,
          },
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            toast.success("Huỷ khoá nợ công.");
          },
        }
      );
    });
  };

  const onCancelOrder = () => {
    f7.dialog.confirm("Xác nhận huỷ đơn hàng.", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      var bodyFormData = new FormData();
      bodyFormData.append("OrderID", f7route?.params?.id);

      cancelOrderMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            f7router.back();
            toast.success("Huỷ đơn hàng thành công.");
            window?.noti27?.TIN_NHAN &&
              window?.noti27.TIN_NHAN({
                type: "CANCEL_ORDER_ONLINE_POS",
                data: data,
              });
          },
        }
      );
    });
  };

  const onFinish = () => {
    f7.dialog.confirm("Xác nhận hoàn thành đơn hàng này ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "ORDER_FN");
      bodyFormData.append("OrderID", f7route?.params?.id);

      finishMutation.mutate(
        {
          data: bodyFormData,
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            f7.dialog.close();
            toast.success("Đơn hàng đã hoàn thành.");
            window?.noti27?.TIN_NHAN &&
              window?.noti27.TIN_NHAN({
                type: "COMPLETE_ORDER_POS",
                data: data,
              });
          },
        }
      );
    });
  };

  const onFinishAnonymous = () => {
    f7.dialog.confirm(
      data?.PhoneID
        ? "Xác nhận tạo khách mới & hoàn thành đơn hàng này ?"
        : "Xác nhận duyệt đơn hàng cho khách hàng này ?",
      async () => {
        f7.dialog.preloader("Đang thực hiện ...");
        let MemberID = null;
        if (!data?.PhoneID) {
          let Member = await createMemberMutation.mutateAsync({
            data: {
              member: {
                FullName: data?.Order?.SenderName,
                MobilePhone: data?.Order?.SenderPhone,
                IsAff: 1,
              },
            },
            Token: Auth?.token,
          });
          MemberID = Member?.data?.member?.ID;
        } else {
          MemberID = data?.PhoneID;
        }

        if (MemberID) {
          await changeMemberMutation.mutateAsync({
            data: {
              memberid: MemberID,
              orderid: data?.Order?.ID,
            },
            Token: Auth?.token,
          });
        }

        var bodyFormData = new FormData();
        bodyFormData.append("cmd", "ORDER_FN");
        bodyFormData.append("OrderID", f7route?.params?.id);

        finishMutation.mutate(
          {
            data: bodyFormData,
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success("Đơn hàng đã hoàn thành.");
              window?.noti27?.TIN_NHAN &&
                window?.noti27.TIN_NHAN({
                  type: "ANONYMOUS_COMPLETE_ORDER_POS",
                  data: data,
                });
            },
          }
        );
      }
    );
  };

  const onDelete = () => {
    f7.dialog.confirm(
      "Xác nhận xoá đơn hành ? Không thể hoàn tác sau khi xoá.",
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        var bodyFormData = new FormData();
        bodyFormData.append("id", f7route?.params?.id);

        deleteMutation.mutate(
          {
            data: bodyFormData,
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              f7router.back();
              toast.success("Xoá đơn hàng thành công.");
            },
          }
        );
      }
    );
  };

  const isDelete = () => {
    if (adminTools_byStock?.hasRight) return adminTools_byStock?.hasRight;
    return (
      moment(data?.Order?.CreateDate).format("DD/MM/YYYY") ===
      moment().format("DD/MM/YYYY")
    );
  };

  let DebtPay =
    data?.Order?.thanhtoan?.tong_gia_tri_dh -
    data?.Order?.thanhtoan?.thanh_toan_tien -
    data?.Order?.thanhtoan?.thanh_toan_vi -
    data?.Order?.thanhtoan?.thanh_toan_ao;

  return (
    <Page
      className="!bg-white"
      name="Order-view"
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
        <NavTitle>Đơn hàng #{f7route?.params?.id}</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full pb-safe-b">
        {!isLoading && (
          <div className="overflow-auto grow">
            <div className="p-4 bg-white border-b">
              <div className="flex items-end justify-between mb-2 text-gray-500">
                <span className="text-[15px] font-medium leading-4 font-lato">
                  {moment(data?.Order?.CreateDate).format("HH:mm DD/MM/YYYY")}
                </span>

                <div
                  className={clsx(
                    StringHelpers.getClassOrder(data?.Order)?.Background,
                    StringHelpers.getClassOrder(data?.Order)?.Color,
                    "px-2.5 py-px rounded font-medium text-[13px]"
                  )}
                >
                  {StringHelpers.getClassOrder(data?.Order)?.Value}
                </div>
              </div>
              <div className="text-gray-500">
                <span>
                  {data?.Order?.User?.FullName
                    ? "Tạo bởi " + data?.Order?.User?.FullName
                    : `Đơn hàng Online ${
                        data?.Order?.Status === "user_sent" && "chờ duyệt"
                      }`}
                </span>
                <span className="px-1">-</span>
                <span>
                  Tại {data?.Order?.Stock?.Title || data?.Bill?.Title}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center p-4 bg-white border rounded">
                <div className="flex-1 pr-2">
                  <div className="mb-1 font-medium">
                    {data?.Order?.SenderName || "Chưa có"}
                  </div>
                  <div className="leading-5 text-gray-500">
                    <div>{data?.Order?.SenderPhone || "Chưa có"}</div>
                    <div>{data?.Order?.SenderAddress || "Chưa có địa chỉ"}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center text-xl uppercase rounded-full bg-primary-light w-14 h-14 text-primary">
                  {data?.Order?.SenderName
                    ? data?.Order?.SenderName.substring(0, 1)
                    : "No"}
                </div>
              </div>
              <div className="mt-3 overflow-hidden bg-white border rounded">
                {data?.Items && data?.Items.length > 0 && (
                  <>
                    {data?.Items.map((item, index) => (
                      <div
                        className="flex p-4 border-b border-dashed last:border-0"
                        key={index}
                      >
                        <div className="w-14">
                          <div className="overflow-hidden bg-gray-400 rounded aspect-square">
                            <img
                              className="object-cover w-full h-full"
                              src={AssetsHelpers.toAbsoluteUrl(item.ProdThumb)}
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
                        </div>
                        <div className="flex-1 pl-3">
                          {
                            <PickerServiceUseOrder Prod={item}>
                              {({ open }) => (
                                <div
                                  className="mb-1 font-medium"
                                  onClick={() => item.ProdOrService && open()}
                                >
                                  {item.ProdTitle}
                                  {item.ProdOrService === 1 && (
                                    <InformationCircleIcon className="inline w-5 ml-1 text-warning align-sub" />
                                  )}
                                </div>
                              )}
                            </PickerServiceUseOrder>
                          }

                          <div className="flex justify-between font-medium text-gray-500 font-lato">
                            <div>
                              {StringHelpers.formatVND(item.PriceOrder)}
                              <span className="px-1">x</span>
                              {item.Qty}
                            </div>
                            <div>{StringHelpers.formatVND(item.ToMoney)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {(data?.Order?.SenderOther || data?.Order?.Desc) && (
                  <div className="p-4 bg-white">
                    <div>
                      <span className="font-medium">Ghi chú</span>
                      <span className="pl-2 text-gray-500">
                        {data?.Order?.SenderOther}
                        {data?.Order?.Desc ? `- ${data?.Order?.Desc}` : <></>}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="py-2 mt-3 bg-white border rounded">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-gray-500">Nguyên giá</div>
                  <div className="font-bold font-lato">
                    {StringHelpers.formatVND(data?.Order?.TotalProdValue)}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-gray-500">Giảm giá</div>
                  <div className="font-bold font-lato">
                    {data?.Order?.TotalProdValue - data?.Order?.TotalValue > 0
                      ? StringHelpers.formatVND(
                          data?.Order?.TotalProdValue - data?.Order?.TotalValue
                        )
                      : 0}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-gray-500">Còn lại</div>
                  <div className="font-bold font-lato">
                    {StringHelpers.formatVND(data?.Order?.TotalValue)}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-gray-500">Mã giảm giá</div>
                  <div className="font-bold font-lato">
                    {data?.Order?.Discount ||
                      data?.Order?.VoucherFix ||
                      data?.Order?.VoucherSamePrice}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-gray-500">Sau mã giảm giá</div>
                  <div className="font-bold font-lato">
                    {StringHelpers.formatVND(data?.Order?.ToMoney)}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-gray-500">Chiết khấu cả đơn</div>
                  <div className="font-bold font-lato">
                    {data?.Order?.CustomeDiscount > 100
                      ? StringHelpers.formatVND(data?.Order?.CustomeDiscount)
                      : `${data?.Order?.CustomeDiscount || 0}%`}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-base text-gray-500">Cần thanh toán</div>
                  <div className="text-lg font-bold font-lato">
                    {StringHelpers.formatVND(data?.Order?.ToPay)}
                  </div>
                </div>
              </div>
              {data?.Order?.Status !== "user_sent" && (
                <div className="py-2 mt-3 bg-white border rounded">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">TM + CK + Q.Thẻ</div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.thanh_toan_tien
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">
                      Thanh toán ví + Thẻ tiền
                    </div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.thanh_toan_vi
                      )}
                    </div>
                  </div>
                  {/* <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">Trả hàng hoàn ví</div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.tra_hang_hoan_vi
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">Trả hàng hoàn tiền</div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.tra_hang_hoan_tien
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">Kết thúc hoàn ví</div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.ket_thuc_the_hoan_vi
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">Kết thúc hoàn tiền</div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.ket_thuc_the_hoan_tien
                      )}
                    </div>
                  </div> */}
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">Thanh toán ảo trả hàng</div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.thanh_toan_ao_tra_hang
                      )}
                    </div>
                  </div>
                  {/* <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-gray-500">Thanh toán ảo kết thúc</div>
                    <div className="font-bold font-lato">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.thanh_toan_ao_ket_thuc_the
                      )}
                    </div>
                  </div> */}
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="text-base text-gray-500">Còn nợ</div>
                    <div className="text-lg font-bold font-lato text-danger">
                      {StringHelpers.formatVND(
                        data?.Order?.thanhtoan?.tong_gia_tri_dh -
                          data?.Order?.thanhtoan?.thanh_toan_tien -
                          data?.Order?.thanhtoan?.thanh_toan_vi -
                          data?.Order?.thanhtoan?.thanh_toan_ao
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {isLoading && (
          <div className="overflow-auto grow">
            <div className="px-4">
              <div className="flex items-center justify-center p-4 bg-white border rounded">
                <div className="flex-1 pr-2">
                  <div className="mb-2 font-medium">
                    <div className="w-8/12 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="leading-5 text-gray-500">
                    <div className="w-6/12 h-2 mb-1 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-10/12 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-center text-xl rounded-full bg-primary-light w-14 h-14 text-primary animate-pulse"></div>
              </div>
            </div>
            <div className="px-4">
              <div className="mt-3 bg-white border rounded">
                {Array(3)
                  .fill()
                  .map((_, index) => (
                    <div
                      className="flex p-4 border-b border-dashed last:border-0"
                      key={index}
                    >
                      <div className="w-16">
                        <div className="overflow-hidden bg-gray-400 rounded aspect-square">
                          <div className="flex items-center justify-center w-full h-full bg-gray-300 rounded">
                            <svg
                              className="w-4 h-4 text-gray-200"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 20 18"
                            >
                              <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 pl-3">
                        <div className="mb-2 font-medium">
                          <div className="w-8/12 h-2.5 mb-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="w-full h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>

                        <div className="flex justify-between font-medium text-gray-500 font-lato">
                          <div>
                            <div className="w-[100px] h-2 mb-1 bg-gray-200 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <div className="w-[50px] h-2 bg-gray-200 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-3 bg-white border rounded">
                {Array(3)
                  .fill()
                  .map((_, index) => (
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      key={index}
                    >
                      <div className="text-gray-500">
                        <div className="w-24 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <div className="font-bold max-w-[60%] text-right">
                        <div className="w-40 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <Button
              style={{ "--f7-preloader-color": "#000" }}
              popoverOpen=".popover-order"
              type="button"
              className="bg-white max-w-[50px] text-black border border-[#d3d3d3]"
              fill
              large
              preloader
              loading={isLoading}
              disabled={isLoading}
            >
              <EllipsisVerticalIcon className="w-6" />
            </Button>
            <Popover className="popover-order">
              <div className="flex flex-col py-1">
                {(data?.Order?.Status === "finish" ||
                  (data?.Order?.Status === "cancel" &&
                    data?.Order?.IsReturn > 0)) && (
                  <Link
                    popoverClose
                    className="flex justify-between p-3 font-medium border-b last:border-0"
                    noLinkClass
                    href={`/admin/pos/orders/view/${f7route?.params?.id}/bonus-sales-commission/`}
                  >
                    Hoa hồng và doanh số
                    {data?.Order?.Counter?.doanh_so +
                      data?.Order?.Counter?.thuong >
                      0 && (
                      <div className="px-1.5 font-semibold text-xs text-white rounded bg-danger font-lato flex items-center">
                        {data?.Order?.Counter?.doanh_so +
                          data?.Order?.Counter?.thuong}
                      </div>
                    )}
                  </Link>
                )}
                {data?.Order?.Status === "finish" && data?.Order?.AdminAction !== "TANG_DH_KET_THUC_NO" && (
                  <PickerGiftOrder
                    OrderID={f7route?.params?.id}
                    Order={data?.Order}
                  >
                    {({ open }) => (
                      <Link
                        popoverClose
                        className="p-3 font-medium border-b last:border-0"
                        noLinkClass
                        onClick={open}
                      >
                        Tặng
                      </Link>
                    )}
                  </PickerGiftOrder>
                )}

                {data?.Order?.Status === "finish" &&
                  data?.Order?.AdminAction === "TANG_DH_KET_THUC_NO" &&
                  isDelete() && (
                    <Link
                      popoverClose
                      className="p-3 font-medium border-b last:border-0"
                      noLinkClass
                      onClick={onCancelGift}
                    >
                      Huỷ tặng
                    </Link>
                  )}
      
                {data?.Order?.Status === "finish" && data?.Order?.AdminAction !== "TANG_DH_KET_THUC_NO" && (
                  <PickerDebtLockOrder
                    OrderID={f7route?.params?.id}
                    Order={data?.Order}
                  >
                    {({ open }) => (
                      <Link
                        popoverClose
                        className="p-3 font-medium border-b last:border-0"
                        noLinkClass
                        onClick={open}
                      >
                        Khoá nợ
                      </Link>
                    )}
                  </PickerDebtLockOrder>
                )}

                {data?.Order?.Status === "finish" &&
                  data?.Order?.AdminAction === "KHOA_NO_KET_THUC_NO" &&
                  isDelete() && (
                    <Link
                      popoverClose
                      className="p-3 font-medium border-b last:border-0"
                      noLinkClass
                      onClick={onCancelDebtLock}
                    >
                      Huỷ khoá nợ
                    </Link>
                  )}

                {data?.Order?.Status === "finish" && (
                  <Link
                    popoverClose
                    className="p-3 font-medium border-b last:border-0"
                    noLinkClass
                    href={`/admin/pos/orders/view/${f7route?.params?.id}/return/`}
                  >
                    Trả hàng
                  </Link>
                )}
                {(data?.Order?.Status === "cancel"
                  ? data?.Order?.IsReturn > 0
                  : data?.Order?.Status) && (
                  <PickerCodOrder OrderID={f7route?.params?.id}>
                    {({ open }) => (
                      <Link
                        popoverClose
                        className="p-3 font-medium border-b last:border-0"
                        noLinkClass
                        onClick={open}
                      >
                        COD
                      </Link>
                    )}
                  </PickerCodOrder>
                )}

                {data?.Order?.Status !== "user_sent" &&
                  (!Brand?.Global?.Admin?.ks_chuyen_ngay ||
                    (Brand?.Global?.Admin?.ks_chuyen_ngay &&
                      adminTools_byStock?.hasRight)) && (
                    <PickerChangeDateOrder
                      OrderID={f7route?.params?.id}
                      Order={data?.Order}
                    >
                      {({ open }) => (
                        <Link
                          popoverClose
                          className="p-3 font-medium border-b last:border-0"
                          noLinkClass
                          onClick={open}
                        >
                          Chuyển ngày đơn hàng
                        </Link>
                      )}
                    </PickerChangeDateOrder>
                  )}

                {data?.Order?.Status === "user_sent" && isDelete() && (
                  <Link
                    popoverClose
                    className="p-3 font-medium border-b last:border-0 text-danger"
                    noLinkClass
                    onClick={onCancelOrder}
                  >
                    Huỷ đơn hàng
                  </Link>
                )}

                {data?.Order?.Status !== "user_sent" &&
                  !Brand?.Global?.Admin?.an_xoa_don_hang &&
                  isDelete() && (
                    <Link
                      onClick={onDelete}
                      popoverClose
                      className="p-3 font-medium border-b last:border-0 text-danger"
                      noLinkClass
                    >
                      Xoá đơn hàng
                    </Link>
                  )}
              </div>
            </Popover>
            {data?.Order?.Status === "user_sent" && (
              <>
                {data?.IsAnonymous && (
                  <>
                    <Button
                      type="button"
                      popoverOpen=".popover-order-finish"
                      className="flex-1 bg-success"
                      fill
                      large
                      preloader
                      loading={isLoading || finishMutation?.isLoading}
                      disabled={isLoading || finishMutation?.isLoading}
                    >
                      Hoàn thành <ChevronUpIcon className="w-5 ml-2" />
                    </Button>
                    <Popover className="popover-order-finish">
                      <div className="flex flex-col py-1">
                        <Link
                          popoverClose
                          className="flex justify-between p-3 font-medium border-b last:border-0"
                          noLinkClass
                          onClick={onFinish}
                        >
                          Hoàn thành cho khách vãng lai
                        </Link>
                        <Link
                          popoverClose
                          className="flex justify-between p-3 font-medium border-b last:border-0"
                          noLinkClass
                          onClick={onFinishAnonymous}
                        >
                          {data?.PhoneID > 0
                            ? "Duyệt cho khách hàng"
                            : "Tạo mới khách và duyệt"}
                        </Link>
                      </div>
                    </Popover>
                  </>
                )}
                {!data?.IsAnonymous && (
                  <>
                    <Button
                      type="button"
                      className="flex-1 bg-success"
                      fill
                      large
                      preloader
                      loading={isLoading || finishMutation?.isLoading}
                      disabled={isLoading || finishMutation?.isLoading}
                      onClick={onFinish}
                    >
                      Hoàn thành
                    </Button>
                  </>
                )}
              </>
            )}
            {data?.Order?.Status !== "user_sent" &&
              data?.Order?.Status !== "cancel" &&
              !data?.Order?.IsReturn && (
                <Button
                  type="button"
                  className="flex-1 bg-success"
                  fill
                  large
                  preloader
                  loading={isLoading}
                  disabled={isLoading}
                  onClick={() =>
                    f7router.navigate(
                      `/admin/pos/orders/view/${f7route?.params?.id}/split-payments/`
                    )
                  }
                >
                  {data?.Order?.ToPay > 0 &&
                    data?.Order?.ToPay - DebtPay === 0 &&
                    "Thanh toán"}
                  {DebtPay > 0 &&
                    data?.Order?.ToPay - DebtPay !== 0 &&
                    "Thanh toán thêm"}

                  {!DebtPay && "Lịch sử thanh toán"}
                  {DebtPay > 0 && data?.Order?.Counter?.thanh_toan > 0 && (
                    <div className="px-1.5 font-semibold text-xs text-white rounded bg-danger font-lato ml-2 flex items-center">
                      {data?.Order?.Counter?.thanh_toan}
                    </div>
                  )}
                </Button>
              )}

            {data?.Order?.Status === "cancel" && (
              <Button
                type="button"
                className="flex-1 bg-danger"
                fill
                large
                preloader
                loading={isLoading}
                disabled={true}
              >
                {data?.Order?.Status === "cancel" && data?.Order?.IsReturn
                  ? "Đơn trả hàng"
                  : "Đơn huỷ"}
              </Button>
            )}
            <Button
              type="button"
              className="w-[60px] bg-primary"
              fill
              large
              preloader
              preloaderColor="black"
              onClick={() =>
                f7router.navigate(`/admin/printers/order/${data?.Order?.ID}/`)
              }
              loading={isLoading}
              disabled={isLoading}
            >
              <PrinterIcon className="w-6" />
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default OrderViewAdmin;

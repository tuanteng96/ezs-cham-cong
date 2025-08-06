import AdminAPI from "@/api/Admin.api";
import PromHelpers from "@/helpers/PromHelpers";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Button,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { BonusRoseAuto, BonusSalesAuto } from "./components";

function OrderBonusSalesCommissionAuto({ f7route }) {
  const queryClient = useQueryClient();

  let prevState = f7route?.query?.prevState
    ? JSON.parse(f7route?.query?.prevState)
    : null;

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const methods = useForm({
    defaultValues: {
      BounsSalesIn: [],
    },
  });

  const { control, handleSubmit, reset, setValue, watch } = methods;

  const { fields, remove, append } = useFieldArray({
    control,
    name: "BounsSalesIn",
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsViewOrderChangeBonusId(body);
      if (prevState && prevState.invalidateQueries) {
        await Promise.all(
          prevState.invalidateQueries.map((key) =>
            queryClient.invalidateQueries([key])
          )
        );
      } else {
        await Promise.all([
          queryClient.invalidateQueries(["ClientOrderViewID"]),
          queryClient.invalidateQueries(["OrderManageID"]),
          queryClient.invalidateQueries(["ClientOrderViewPaymentID"]),
        ]);
      }
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["ClientOrderBonusAutoViewID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientsViewOrderBonusId({
        data: { OrderID: f7route?.params?.id },
        Token: Auth?.token,
      });
      const StaffStock = data?.nhan_vien || [];
      const newStaff =
        StaffStock.length > 0
          ? StaffStock.map((item) => ({
              ...item,
              label: item.co_so,
              options: item.ds
                ? item.ds.map((user) => ({
                    ...user,
                    label: user.Fn,
                    value: user.ID,
                  }))
                : [],
            }))
          : [];
      const newData = {
        ...data,
        nhan_vien: newStaff,
        oiItems: data.oiItems.map((item) => ({
          ...item,
          label: item.ProdTitle,
          value: item.ID,
        })),
      };
      return newData || null;
    },
    onSuccess: (data) => {
      if (data) {
        const { doanh_so, hoa_hong, oiItems } = data;
        let newObj =
          oiItems && oiItems.length > 0
            ? oiItems.map((product) => {
                const Hoa_hong_arr = hoa_hong
                  .filter((item) => item.SubSourceID === product.ID)
                  .reduce((r, { Value, User, SubSourceID, ID }) => {
                    var temp = r.find((o) => o.User.ID === User.ID);
                    if (!temp) {
                      r.push({ Value, User, SubSourceID, ID });
                    } else {
                      temp.Value += Value;
                    }
                    return r;
                  }, []);

                const T_Hoa_hong_arr = Hoa_hong_arr.map(
                  (item) => item.Value
                ).reduce((prev, curr) => prev + curr, 0);
                const Doanh_so_arr = doanh_so
                  .filter((item) => item.OrderItemID === product.ID)
                  .reduce((r, { Value, User, OrderItemID, ID, KpiType }) => {
                    var temp = r.find((o) => o.User.ID === User.ID);
                    if (!temp) {
                      r.push({
                        Value,
                        User,
                        OrderItemID,
                        ID,
                        Type: KpiType
                          ? { label: "Loại " + KpiType, value: KpiType }
                          : "",
                      });
                    } else {
                      temp.Value += Value;
                    }
                    return r;
                  }, []);

                const T_Doanh_so_arr = Doanh_so_arr.map(
                  (item) => item.Value
                ).reduce((prev, curr) => prev + curr, 0);

                const new_Hoa_hong = Hoa_hong_arr.map((item) => ({
                  SubSourceID: item.SubSourceID,
                  User: item.User,
                  Value: Math.round(
                    product.lan_thanh_toan?.thanh_toan_hien_tai *
                      (item.Value /
                        product.lan_thanh_toan?.lan_thanh_toan_truoc)
                  ),
                }));
                const new_Doanh_so = Doanh_so_arr.map((item) => ({
                  OrderItemID: item.OrderItemID,
                  User: item.User,
                  Value: Math.round(
                    product.gia_tri_doanh_so * (item.Value / T_Doanh_so_arr)
                  ),
                  Type: item.Type,
                }));

                return {
                  Product: product,
                  Hoa_Hong: [...new_Hoa_hong],
                  Doanh_So: [...new_Doanh_so],
                };
              })
            : [];

        if (
          Brand?.Global?.Admin?.cai_dat_phi?.visible &&
          Brand?.Global?.Admin?.cai_dat_phi?.an_tinh_hs_ds
        ) {
          newObj = newObj.filter(
            (x) =>
              x.Product.ProdTitle !==
                Brand?.Global?.Admin?.cai_dat_phi?.TIP?.ProdTitle &&
              x.Product.ProdTitle !==
                Brand?.Global?.Admin?.cai_dat_phi?.PHIDICHVU?.ProdTitle &&
              x.Product.ProdTitle !==
                Brand?.Global?.Admin?.cai_dat_phi?.PHIQUETTHE?.ProdTitle
          );
        }

        reset({ BounsSalesIn: newObj });
      }
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const onSubmit = ({ BounsSalesIn }) => {
    const Hoa_Hong = [].concat.apply(
      [],
      BounsSalesIn && BounsSalesIn.length > 0
        ? BounsSalesIn.map((item) => item.Hoa_Hong)
        : []
    );
    const Doanh_So = [].concat.apply(
      [],
      BounsSalesIn && BounsSalesIn.length > 0
        ? BounsSalesIn.map((item) => item.Doanh_So)
        : []
    );
    const dataSubmit = {
      OrderID: f7route?.params?.id,
      save: {
        them_hoa_hong: Hoa_Hong.map((item) => ({
          ID: item.ID || 0,
          Value: item.Value,
          ReceiverUserID: item.User?.ID,
          SubSourceID: item.SubSourceID,
        })).filter((o) => o.Value !== null),
        them_doanh_so: Doanh_So.map((item) => ({
          ID: item.ID || 0,
          Value: item.Value,
          ReceiverUserID: item.User?.ID,
          OrderItemID: item.OrderItemID,
          KpiType: item.Type ? item.Type.value : "",
        })).filter((o) => o.Value !== null),
      },
    };

    updateMutation.mutate(
      {
        data: dataSubmit,
        Token: Auth?.token,
        StockID: CrStocks?.ID,
      },
      {
        onSuccess: (data) => {
          toast.success("Cập nhật thành công.");
        },
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="Order-bonus-sale-commission"
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
        <NavTitle>Hoa hồng, doanh số tự động</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          className="relative flex flex-col h-full pb-safe-b"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="p-4 overflow-auto grow">
            {fields &&
              fields.map((item, index) => (
                <div className="mb-4 border rounded last:mb-0" key={item.id}>
                  <div className="flex gap-3 px-4 py-2.5 border-b bg-gray-50 rounded-t">
                    <div className="flex-1 font-medium">
                      <div className="font-bold text-[15px] leading-6">
                        {item?.Product?.label}
                      </div>
                      <div className="mt-1.5 font-lato">
                        {item.Product.Qty}
                        <span className="px-1">x</span>
                        {StringHelpers.formatVND(item.Product.don_gia)}
                        <span className="px-1">=</span>
                        {StringHelpers.formatVND(item.Product.ToPay)}
                      </div>
                      <div className="mt-px">
                        <span className="font-light">Giá trị doanh số:</span>
                        <span className="pl-1 font-lato">
                          {StringHelpers.formatVND(
                            item.Product.gia_tri_doanh_so
                          )}
                        </span>
                      </div>
                      <div className="mt-px">
                        <span className="font-light">Giá trị Thanh toán:</span>
                        <span className="pl-1 font-lato">
                          {StringHelpers.formatVND(
                            item.Product.gia_tri_thanh_toan
                          )}
                        </span>
                      </div>
                      {fields &&
                      fields.some((x) => x.Product?.so_lan_thuong > 0) &&
                      item.Product?.so_lan_thuong === 0 ? (
                        <div className="mt-1 font-light text-danger">
                          (*) Chưa có dữ liệu thưởng lần đầu cho mặt hàng này.
                          Vui lòng tạo thưởng doanh số thủ công cho sản phẩm
                          này.
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="border-b">
                      <div className="flex items-center px-4 pt-4 font-semibold uppercase">
                        Hoa hồng
                      </div>
                      <BonusRoseAuto
                        name={`BounsSalesIn[${index}].Hoa_Hong`}
                        adminTools_byStock={adminTools_byStock}
                      />
                    </div>
                    <div>
                      <div className="px-4 pt-4 font-semibold uppercase">
                        Doanh số
                      </div>
                      <BonusSalesAuto
                        name={`BounsSalesIn[${index}].Doanh_So`}
                        adminTools_byStock={adminTools_byStock}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div
            role="status"
            className={clsx(
              "grow left-0 flex items-center justify-center w-full transition h-full top-0 z-10 bg-white/50",
              !isLoading && "hidden"
            )}
          >
            <svg
              aria-hidden="true"
              className="w-8 h-8 mr-2 text-gray-300 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="fill-muted"
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
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
              Cập nhật
            </Button>
          </div>
        </form>
      </FormProvider>
    </Page>
  );
}

export default OrderBonusSalesCommissionAuto;

import AdminAPI from "@/api/Admin.api";
import PromHelpers from "@/helpers/PromHelpers";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import StringHelpers from "@/helpers/StringHelpers";
import {
  ChevronLeftIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Button,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import {
  BonusRose,
  BonusSales,
  PickerAdvancedEmployees,
  PickerMultiEmployees,
  PickerOneEmployees,
} from "./components";
import NoFound from "@/components/NoFound";

function OrderBonusSalesCommission({ f7route }) {
  const queryClient = useQueryClient();

  let prevState = f7route?.query?.prevState
    ? JSON.parse(f7route?.query?.prevState)
    : null;

  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");
  let Brand = useStore("Brand");

  let buttonRef = useRef("");

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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ClientOrderBonusViewID", { ID: f7route?.params?.id }],
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
        const newObj =
          oiItems && oiItems.length > 0
            ? oiItems.map((product) => {
                const Hoa_hong_arr = hoa_hong.filter(
                  (item) => item.SubSourceID === product.ID
                );
                const Doanh_so_arr = doanh_so
                  .filter((item) => item.OrderItemID === product.ID)
                  .map((x) => ({
                    ...x,
                    Type: { label: "Loại " + x.KpiType, value: x.KpiType },
                  }));

                return {
                  Product: product,
                  Hoa_Hong: Hoa_hong_arr,
                  Doanh_So: Doanh_so_arr,
                };
              })
            : [];

        reset({ BounsSalesIn: newObj });
      }
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  let isFields =
    (fields && fields.some((x) => x.Doanh_So && x.Doanh_So.length > 0)) ||
    (fields && fields.some((x) => x.Hoa_Hong && x.Hoa_Hong.length > 0));

  useEffect(() => {
    let timeoutId = null;
    if (!isLoading && typeof data !== "undefined" && !isFields) {
      timeoutId = setTimeout(() => {
        buttonRef?.current?.el?.click();
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [buttonRef, isFields, isLoading]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientsViewOrderChangeBonusId(body);
      await refetch();
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
        ]);
      }
      return data;
    },
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
        hoa_hong: Hoa_Hong.map((item) => ({
          ID: item.ID || 0,
          Value: item.Value,
          ReceiverUserID: item.User?.ID,
          SubSourceID: item.SubSourceID,
        })).filter((o) => o.Value !== null),
        doanh_so: Doanh_So.map((item) => ({
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
        <NavTitle>Hoa hồng, doanh số</NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            popoverOpen=".popover-add-bonus"
            ref={buttonRef}
          >
            <PlusIcon className="w-6" />
          </Link>
          <Popover className="popover-add-bonus min-w-[270px]">
            <div className="flex flex-col py-1">
              <PickerOneEmployees Order={data}>
                {({ open }) => (
                  <Link
                    className="relative px-4 py-3 font-medium border-b last:border-0"
                    popoverClose
                    noLinkClass
                    onClick={open}
                  >
                    Áp dụng 1 hoặc nhiều NV
                  </Link>
                )}
              </PickerOneEmployees>
              <PickerMultiEmployees Order={data}>
                {({ open }) => (
                  <Link
                    onClick={open}
                    popoverClose
                    className="relative px-4 py-3 font-medium border-b last:border-0"
                    noLinkClass
                  >
                    Áp dụng mỗi nhân viên 1 sản phẩm
                  </Link>
                )}
              </PickerMultiEmployees>
              {Brand?.Global?.Admin?.thuong_ds_nang_cao
                ? Auth?.ID === 1
                : !Brand?.Global?.Admin?.thuong_ds_nang_cao && (
                    <PickerAdvancedEmployees Order={data}>
                      {({ open }) => (
                        <Link
                          onClick={open}
                          popoverClose
                          className="relative px-4 py-3 font-medium border-b last:border-0"
                          noLinkClass
                        >
                          Nâng cao
                        </Link>
                      )}
                    </PickerAdvancedEmployees>
                  )}
            </div>
          </Popover>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          className="relative flex flex-col h-full pb-safe-b"
          onSubmit={handleSubmit(onSubmit)}
        >
          {!isLoading && (
            <div className="p-4 overflow-auto grow">
              {isFields &&
                fields &&
                fields.map((item, index) => (
                  <div
                    className="mb-4 border rounded shadow last:mb-0"
                    key={item.id}
                  >
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
                      </div>
                      <div
                        className="flex items-center justify-end w-10 h-8 pt-2.5 text-danger"
                        onClick={() =>
                          f7.dialog.confirm("Xác nhận loại bỏ ?", () => {
                            if (fields.length === 1) {
                              remove(index);
                              handleSubmit(onSubmit)();
                            } else {
                              remove(index);
                            }
                          })
                        }
                      >
                        <TrashIcon className="w-6" />
                      </div>
                    </div>
                    <div>
                      <div className="border-b">
                        <div className="flex items-center px-4 pt-4 font-semibold uppercase">
                          Hoa hồng
                        </div>
                        <BonusRose
                          name={`BounsSalesIn[${index}].Hoa_Hong`}
                          adminTools_byStock={adminTools_byStock}
                        />
                      </div>
                      <div>
                        <div className="px-4 pt-4 font-semibold uppercase">
                          Doanh số
                        </div>
                        <BonusSales
                          name={`BounsSalesIn[${index}].Doanh_So`}
                          adminTools_byStock={adminTools_byStock}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              {!isFields && (
                <NoFound
                  Title="Không có thưởng."
                  Desc="Rất tiếc ... Không tìm thưởng hoa hồng, doanh số nào."
                />
              )}
            </div>
          )}
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
              disabled={updateMutation.isLoading || !isFields}
            >
              Cập nhật
            </Button>
          </div>
        </form>
      </FormProvider>
    </Page>
  );
}

export default OrderBonusSalesCommission;

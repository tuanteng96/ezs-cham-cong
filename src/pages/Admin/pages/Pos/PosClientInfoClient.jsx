import {
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
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
import React, { useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import { useMutation, useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import StringHelpers from "@/helpers/StringHelpers";
import moment from "moment";
import clsx from "clsx";
import NoFound from "@/components/NoFound";
import { toast } from "react-toastify";
import { PickerEditCard, PickerViewCard } from "./components";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import { PickerSheet } from "@/partials/components/Sheet";
import { PickerAddEditCustomerInfo } from "@/pages/Technicians/components";
import StaffsAPI from "@/api/Staffs.api";

function PosClientInfoClient({ f7router, f7route }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ClientInfoClient", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await StaffsAPI.getCustomerInfo({
        data: {
          MemberID: f7route?.params?.id,
          Pi: 1,
          Ps: 1000,
        },
        Token: Auth?.token,
      });

      return data?.lst && data?.lst.length > 0 ? data?.lst[0] : null;
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await StaffsAPI.deleteCustomerInfo(body);
      await refetch();
      return data;
    },
  });

  const onDelete = (item) => {
    f7.dialog.confirm(`Bạn có chắc chắn muốn xoá ?`, () => {
      f7.dialog.preloader("Đang thực hiện...");

      deleteMutation.mutate(
        {
          data: {
            delete: [item.ID],
          },
          Token: Auth.token,
        },
        {
          onSuccess: (data) => {
            f7.dialog.close();
            toast.success(`Xoá thành công.`);
          },
        }
      );
    });
  };

  let isCustomer =
    data?.Items &&
    data?.Items.findIndex(
      (o) =>
        moment(o.CreateDate).format("DD-MM-YYYY") ===
        moment().format("DD-MM-YYYY")
    );

  return (
    <Page
      className="bg-[var(--f7-page-bg-color)]"
      name="Pos-client-info"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
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
        <NavTitle>Thông tin khách hàng</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {isLoading && (
        <div className="p-4">
          {Array(2)
            .fill()
            .map((_, index) => (
              <div className="mb-4 border rounded last:mb-0" key={index}>
                <div className="flex justify-between px-4 py-4 font-medium bg-gray-100 border-b">
                  <div>
                    <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between px-4 py-4 font-medium border-b">
                  <div>
                    <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded-full w-[100px] animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 px-4 py-3.5">
                  <button
                    type="button"
                    className="py-2.5 shadow-lg font-medium text-white rounded bg-primary h-10 animate-pulse"
                  ></button>

                  <button
                    type="button"
                    className="py-2.5 shadow-lg font-medium text-white rounded bg-success h-10 animate-pulse"
                  ></button>
                </div>
              </div>
            ))}
        </div>
      )}
      <div className="flex flex-col h-full pb-safe-b">
        <div className="overflow-auto grow">
          {!isLoading && (
            <>
              {data?.Items && data?.Items?.length > 0 && (
                <div className="p-4">
                  {data?.Items?.sort((x, y) =>
                    moment(y.CreateDate).diff(moment(x.CreateDate))
                  ).map((item, index) => (
                    <PickerSheet
                      key={index}
                      Title="Bạn muốn thực hiện ?"
                      Options={[
                        {
                          Title:
                            moment().format("YYYY-MM-DD") !==
                              moment(item.CreateDate).format("YYYY-MM-DD") &&
                            !adminTools_byStock?.hasRight
                              ? "Xem chi tiết"
                              : "Xem & chỉnh sửa",
                          component: ({ children, close, setHideForChild }) => (
                            <PickerAddEditCustomerInfo
                              invalidateQueries="ClientInfoClient"
                              data={item}
                              MemberID={f7route?.params?.id}
                              onOpen={() => setHideForChild(true)}
                              onClose={() => {
                                setHideForChild(false);
                                close();
                              }}
                            >
                              {({ open }) => (
                                <div
                                  className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                  onClick={() => {
                                    open();
                                  }}
                                >
                                  {children}
                                </div>
                              )}
                            </PickerAddEditCustomerInfo>
                          ),
                        },

                        {
                          Title: "Xoá thông tin",
                          className:
                            "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer text-danger",
                          onClick: (e) => {
                            onDelete(item);
                          },
                          hidden:
                            moment().format("YYYY-MM-DD") !==
                              moment(item.CreateDate).format("YYYY-MM-DD") &&
                            !adminTools_byStock?.hasRight,
                        },
                      ].filter((x) => !x.hidden)}
                      Close={{
                        Title: "Đóng",
                      }}
                    >
                      {({ open }) => (
                        <div
                          className="flex flex-col p-4 mb-3.5 bg-white rounded-lg last:mb-0"
                          onClick={open}
                        >
                          <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0 items-center">
                            <div className="font-semibold text-gray-500 font-lato">
                              {moment(item.CreateDate).format("DD/MM/YYYY")}
                            </div>
                            <div>
                              <EllipsisVerticalIcon className="w-6 text-primary" />
                            </div>
                          </div>
                          <div className="flex justify-between pb-2.5 mb-2.5 border-b last:mb-0 last:pb-0 last:border-0 items-center">
                            <div className="text-gray-500">Người nhập</div>
                            <div className="font-medium">
                              {item?.UserFullName || ""}
                            </div>
                          </div>
                        </div>
                      )}
                    </PickerSheet>
                  ))}
                </div>
              )}
              {(!data?.Items || data?.Items.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                />
              )}
            </>
          )}
        </div>
        {!isCustomer && (
          <div className="p-4">
            <PickerAddEditCustomerInfo
              MemberID={f7route?.params?.id}
              invalidateQueries="ClientInfoClient"
            >
              {({ open }) => (
                <Button
                  onClick={open}
                  type="button"
                  className="rounded-full bg-app"
                  fill
                  large
                  preloader
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Thêm mới thông tin
                </Button>
              )}
            </PickerAddEditCustomerInfo>
          </div>
        )}
      </div>
    </Page>
  );
}

export default PosClientInfoClient;

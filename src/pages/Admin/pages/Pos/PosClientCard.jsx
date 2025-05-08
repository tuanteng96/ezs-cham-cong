import {
  ChevronLeftIcon,
  InformationCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import {
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

function PosClientCard({ f7router, f7route }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ClientCardID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientCardId({
        MemberID: f7route?.params?.id,
      });

      return data?.data || null;
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const UnlockMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientCardUnlockId(body);
      await refetch();
      return data;
    },
  });

  const onUnlock = (item) => {
    f7.dialog.confirm(
      "Xác nhận " +
        (item.trang_thai === "Khóa" ? "kích hoạt thẻ ?" : "khóa thẻ ?"),
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        UnlockMutation.mutate(
          {
            ID: item.id,
            Token: Auth?.token,
          },
          {
            onSuccess: () => {
              f7.dialog.close();
              toast.success(
                item.trang_thai === "Khóa"
                  ? "Kích hoạt thẻ thành công."
                  : "Khóa thẻ thành công."
              );
            },
          }
        );
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="Pos-client-card"
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
        <NavTitle>Thẻ tiền</NavTitle>
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
      {!isLoading && (
        <>
          {data && data?.length > 0 && (
            <div className="p-4">
              {data?.map((item, index) => (
                <div className="mb-4 border rounded last:mb-0" key={index}>
                  <PickerEditCard data={item} MemberID={f7route?.params?.id}>
                    {({ open }) => (
                      <div
                        onClick={() => adminTools_byStock?.hasRight && open()}
                        className="flex justify-between px-4 py-3.5 font-medium bg-gray-100 border-b"
                      >
                        <div className="flex-1">{item.ten}</div>
                        {adminTools_byStock?.hasRight && (
                          <div className="flex justify-end w-10">
                            <PencilIcon className="w-5" />
                          </div>
                        )}
                      </div>
                    )}
                  </PickerEditCard>
                  <div className="flex justify-between px-4 py-3.5 border-b">
                    <div>ID</div>
                    <div className="font-semibold">#{item.id}</div>
                  </div>
                  <div className="flex justify-between px-4 py-3.5 border-b">
                    <div>Còn lại</div>
                    {item.gia_tri_chi_tieu_sp !== 0 ||
                    item.gia_tri_chi_tieu_dv !== 0 ? (
                      <Link
                        popoverOpen={`.popover-${item.id}`}
                        noLinkClass
                        className="flex font-semibold"
                      >
                        {StringHelpers.formatVND(
                          item.gia_tri_chi_tieu - item.su_dung
                        )}
                        <InformationCircleIcon className="w-5 ml-2 text-warning" />
                      </Link>
                    ) : (
                      <div className="flex font-semibold">
                        {StringHelpers.formatVND(
                          item.gia_tri_chi_tieu - item.su_dung
                        )}
                      </div>
                    )}
                  </div>
                  {(item.gia_tri_chi_tieu_sp !== 0 ||
                    item.gia_tri_chi_tieu_dv !== 0) && (
                    <Popover className={`popover-${item.id}`}>
                      <div>
                        <div className="px-4 py-3 border-b border-dashed">
                          <div className="mb-px text-gray-600">
                            Chi tiêu sản phẩm
                          </div>
                          <div className="text-base font-bold font-lato">
                            {StringHelpers.formatVND(
                              item.gia_tri_chi_tieu_sp - item.su_dung_sp
                            )}
                          </div>
                        </div>

                        <div className="px-4 py-3">
                          <div className="mb-px text-gray-600">
                            Chi tiêu dịch vụ
                          </div>
                          <div className="text-base font-bold font-lato">
                            {StringHelpers.formatVND(
                              item.gia_tri_chi_tieu_dv - item.su_dung_dv
                            )}
                          </div>
                        </div>
                      </div>
                    </Popover>
                  )}

                  <div className="flex justify-between px-4 py-3.5 border-b">
                    <div>HSD</div>
                    <div className="font-semibold">
                      {!item.han_dung ? (
                        "Không giới hạn"
                      ) : (
                        <>
                          {item.han_dung &&
                          moment().diff(item.han_dung, "minutes") < 0 ? (
                            moment(item.han_dung).format("DD/MM/YYYY")
                          ) : (
                            <span className="text-danger">Hết hạn</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between px-4 py-3.5 border-b">
                    <div>Trạng thái</div>
                    <div className="font-semibold">
                      {item.trang_thai === "Khóa" ? (
                        <span className="text-danger">Đang khóa</span>
                      ) : (
                        <span className="text-success">Đang sử dụng</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={clsx(
                      "grid grid-cols-2 gap-3 px-4 py-3.5",
                      adminTools_byStock?.hasRight
                        ? "grid-cols-2"
                        : "grid-cols-1"
                    )}
                  >
                    {adminTools_byStock?.hasRight && (
                      <button
                        onClick={() => onUnlock(item)}
                        type="button"
                        className={clsx(
                          "py-2.5 shadow-lg font-medium text-white rounded ",
                          item.trang_thai === "Khóa"
                            ? "bg-success"
                            : "bg-danger"
                        )}
                      >
                        {item.trang_thai === "Khóa" ? "Kích hoạt" : "Khóa thẻ"}
                      </button>
                    )}

                    <PickerViewCard data={item}>
                      {({ open }) => (
                        <button
                          onClick={open}
                          type="button"
                          className="py-2.5 shadow-lg font-medium text-white rounded bg-primary"
                        >
                          Lịch sử sử dụng
                        </button>
                      )}
                    </PickerViewCard>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(!data || data.length === 0) && (
            <NoFound
              Title="Không có kết quả nào."
              Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
            />
          )}
        </>
      )}
    </Page>
  );
}

export default PosClientCard;

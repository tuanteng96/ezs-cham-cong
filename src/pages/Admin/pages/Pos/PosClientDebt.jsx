import { ArrowPathIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React from "react";
import PromHelpers from "@/helpers/PromHelpers";
import { useMutation, useQuery, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import StringHelpers from "@/helpers/StringHelpers";
import moment from "moment";
import NoFound from "@/components/NoFound";
import { toast } from "react-toastify";

function PosClientDebt({ f7router, f7route }) {
  const queryClient = useQueryClient();
  let Auth = useStore("Auth");
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ClientDebtID", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let { data } = await AdminAPI.clientDebtId({
        data: {
          DateEnd: null,
          DateStart: "1/1/1990",
          Pi: 1,
          Ps: 1,
          StockID: "",
          TypeCN: "",
        },
        Token: Auth?.token,
        MemberID: f7route?.params?.id,
      });
      let rs = null;
      if (data.result) {
        let { Items } = data.result;
        let index = Items.findIndex(
          (x) => x.Id === Number(f7route?.params?.id)
        );
        if (index > -1) {
          rs = Items[index];
        }
      }

      return {
        ...rs,
        ListOrders: rs?.ListOrders ? rs?.ListOrders.reverse() : null,
      };
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  const resetMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientResetDebtId(body);
      await AdminAPI.clientsPresentAppId({
        MemberID: f7route?.params?.id,
        Token: Auth.token,
      });
      await refetch();
      await queryClient.invalidateQueries(["ClientManageID"]);
      return data;
    },
  });

  const onReset = () => {
    f7.dialog.confirm("Xác nhận tính toán lại công nợ ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      resetMutation.mutate(
        {
          Token: Auth?.token,
          MemberID: f7route?.params?.id,
        },
        {
          onSuccess: () => {
            toast.success("Tính toán công nợ thành công.");
            f7.dialog.close();
          },
        }
      );
    });
  };

  return (
    <Page
      className="bg-white"
      name="Pos-client-debt"
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
        <NavTitle>
          Công nợ
          {data?.TongNo && data?.TongNo > 0 && (
            <span className="pl-1">
              ({StringHelpers.formatVND(data?.TongNo)})
            </span>
          )}
        </NavTitle>
        <NavRight className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            onClick={onReset}
          >
            <ArrowPathIcon className="w-6" />
          </Link>
        </NavRight>
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
          {data?.ListOrders && data?.ListOrders.length > 0 && (
            <div className="p-4">
              {data?.ListOrders.map((item, index) => (
                <div className="mb-4 border rounded last:mb-0" key={index}>
                  <div className="flex justify-between px-4 py-3.5 font-medium bg-gray-100 border-b">
                    <div>ĐH #{item?.Id}</div>
                    <div>{moment(item?.CreateDate).format("DD-MM-YYYY")}</div>
                  </div>
                  <div className="flex justify-between px-4 py-3.5 border-b">
                    <div>Tổng nợ</div>
                    <div className="font-semibold text-danger">
                      {StringHelpers.formatVND(item.TongNo)}
                    </div>
                  </div>
                  <div>
                    {item?.ListDebt &&
                      item?.ListDebt.map((item, index) => (
                        <div
                          className="p-4 border-b border-dashed last:border-b-0"
                          key={index}
                        >
                          <div className="mb-1 font-medium">
                            {item.ProdTitle}
                          </div>
                          <div className="flex justify-between">
                            <div>SL x {item.Qty}</div>
                            <div className="font-bold font-lato">
                              {StringHelpers.formatVND(item.ConNo)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3 px-4 py-3.5">
                    {/* <PickerDebt data={item}>
                      {({ open }) => (
                        <button
                          onClick={open}
                          type="button"
                          className="py-2.5 shadow-lg font-medium text-white rounded bg-primary"
                        >
                          Chi tiết
                        </button>
                      )}
                    </PickerDebt> */}

                    <Link
                      type="button"
                      className="py-2.5 shadow-lg font-medium text-white rounded bg-success"
                      href={`/admin/pos/orders/view/${
                        item?.Id
                      }/split-payments/?prevState=${JSON.stringify({
                        invalidateQueries: ["ClientDebtID", "ClientManageID"],
                      })}`}
                    >
                      Thanh toán
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(!data?.ListOrders || data?.ListOrders.length === 0) && (
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

export default PosClientDebt;

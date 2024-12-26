import { ChevronLeftIcon } from "@heroicons/react/24/outline";
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
import React, { useRef, useState } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import { useInfiniteQuery, useMutation, useQueryClient } from "react-query";
import AdminAPI from "@/api/Admin.api";
import moment from "moment";
import NoFound from "@/components/NoFound";
import ArrayHelpers from "@/helpers/ArrayHelpers";
import clsx from "clsx";
import { toast } from "react-toastify";
import { PickerEditPoint, PickerExchangePoint } from "./components";
import { RolesHelpers } from "@/helpers/RolesHelpers";

function PosClientPoints({ f7router, f7route }) {
  let Auth = useStore("Auth");
  let CrStocks = useStore("CrStocks");

  const { adminTools_byStock } = RolesHelpers.useRoles({
    nameRoles: ["adminTools_byStock"],
    auth: Auth,
    CrStocks,
  });

  const queryClient = useQueryClient();

  const allowInfinite = useRef(true);

  const [filters] = useState({
    StockID: "", // ID Stock
    DateStart: "", // "21/11/2024"
    DateEnd: "",
    Pi: 1,
    Ps: 12,
    Order: "CreateDate desc",
    MemberID: f7route?.params?.id,
  });

  const Points = useInfiniteQuery({
    queryKey: ["ClientPointID", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await AdminAPI.clientPointsId({
        data: {
          ...filters,
          Pi: pageParam,
          Ps: 12,
        },
        Token: Auth?.token,
      });

      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.Pi === lastPage.PCount ? undefined : lastPage.Pi + 1,
    keepPreviousData: true,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(Points?.data?.pages, "lst");

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    Points.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.clientDeletePointsId(body);
      await Points.refetch();
      await queryClient.invalidateQueries({ queryKey: ["ClientManageID"] });
      return data;
    },
  });

  const onDelete = (item) => {
    const dataPost = {
      delete: [item.ID],
    };
    f7.dialog.confirm("Xác nhận xoá ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      deleteMutation.mutate(
        {
          data: dataPost,
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            toast.success("Xoá thành công.");
            f7.dialog.close();
          },
        }
      );
    });
  };

  return (
    <Page
      className="bg-white"
      name="Pos-client-point"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => Points.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={Points.isFetchingNextPage}
      onInfinite={loadMore}
      noToolbar
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
          <div className="font-semibold">
            Tích điểm
            {Points?.data?.pages &&
              Points?.data?.pages.length > 0 &&
              Points?.data?.pages[0].TotalPoint > 0 && (
                <span className="pl-1">
                  (
                  {Points?.data?.pages &&
                    Points?.data?.pages.length > 0 &&
                    Points?.data?.pages[0].TotalPoint}
                  <span className="pl-1">điểm</span>)
                </span>
              )}
          </div>
        </NavLeft>
        {/* <NavTitle>Tích điểm</NavTitle> */}
        <NavRight className="h-full pr-4">
          <PickerExchangePoint
            MemberID={f7route?.params?.id}
            Points={
              Points?.data?.pages &&
              Points?.data?.pages.length > 0 &&
              Points?.data?.pages[0].TotalPoint
            }
          >
            {({ open }) => (
              <Link
                onClick={open}
                noLinkClass
                className="!text-white flex item-center justify-center bg-success text-[14px] h-8 px-2 rounded items-center"
              >
                Đổi điểm
              </Link>
            )}
          </PickerExchangePoint>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {Points.isLoading && (
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
      {!Points.isLoading && (
        <>
          {Lists && Lists.length > 0 && (
            <div className="p-4">
              {Lists.map((item, index) => (
                <div className="mb-4 border rounded last:mb-0" key={index}>
                  <div className="flex justify-between px-4 py-3.5 font-medium bg-gray-100 border-b">
                    <div>#{item?.ID}</div>
                    <div>{moment(item?.CreateDate).format("DD-MM-YYYY")}</div>
                  </div>
                  <div>
                    <div className="flex justify-between px-4 py-3.5 border-b last:border-0">
                      <div>Điểm</div>
                      <div
                        className={clsx(
                          "font-semibold",
                          item.Point > 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {item.Point}
                      </div>
                    </div>
                    {(item.Desc || item.RefOrderID !== null) &&
                      item.Point > 0 && (
                        <div className="flex justify-between px-4 py-3.5 border-b last:border-0">
                          {item.RefOrderID > 0 &&
                            item.Point > 0 &&
                            `Tích điểm đơn hàng : #${item.RefOrderID} - ${item.Title}`}
                          {item.RefOrderID > 0 &&
                            item.Point < 0 &&
                            `Khấu trừ tích điểm đơn hàng : #${item.RefOrderID} - ${item.Title}`}
                          {!item.RefOrderID && item.Desc}
                        </div>
                      )}
                  </div>
                  {(moment(item.CreateDate).format("DD-MM-YYYY") ===
                    moment().format("DD-MM-YYYY") ||
                    adminTools_byStock?.hasRight) && (
                    <div className="grid grid-cols-2 gap-3 px-4 py-3.5 border-t">
                      <PickerEditPoint data={item}>
                        {({ open }) => (
                          <button
                            onClick={open}
                            type="button"
                            className="py-2.5 shadow-lg font-medium text-white rounded bg-primary"
                          >
                            Chỉnh sửa
                          </button>
                        )}
                      </PickerEditPoint>

                      <button
                        type="button"
                        className="py-2.5 shadow-lg font-medium text-white rounded bg-danger"
                        onClick={() => onDelete(item)}
                      >
                        Xoá
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {(!Lists || Lists.length === 0) && (
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

export default PosClientPoints;

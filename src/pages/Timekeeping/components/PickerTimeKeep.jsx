import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Sheet } from "framework7-react";
import moment from "moment";
import React, { useEffect, useState } from "react";
import StringHelpers from "../../../helpers/StringHelpers";

function PickerTimeKeep({ children, item }) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);

  const close = () => setVisible(false);

  useEffect(() => {
    if (
      item &&
      item["Users"] &&
      item["Users"].length > 0 &&
      item["Users"][0].List &&
      item["Users"][0].List.length > 0
    ) {
      setData(item["Users"][0]["List"][0]);
    }
  }, [item]);

  return (
    <>
      {children({
        open: () => setVisible(true),
        close: close,
      })}
      <Sheet
        style={{ height: "auto" }}
        swipeToClose
        //push
        backdrop
        opened={visible}
        onSheetClose={close}
      >
        <div className="h-full">
          <div className="flex items-center justify-center h-6">
            <span className="inline-block w-12 h-[6px] rounded-[3px] bg-[#e9ebed] m-[calc(calc(24px-6px)/2)]"></span>
          </div>
          <div className="pb-safe-b h-[calc(100%-24px)] flex flex-col">
            <div className="px-4 mt-3">
              <div className="text-lg font-semibold">
                {moment(item.Date).format("ddd, [Ngày] ll")}
              </div>
            </div>
            <div className="p-4 overflow-auto grow no-scrollbar">
              {data?.Info?.WorkToday && data?.Info?.WorkToday?.TimeFrom && (
                <div className="flex mb-2">
                  <div className="pr-2 mb-px font-light text-gray-500">
                    Ca làm việc
                  </div>
                  <div className="font-medium capitalize">
                    <span className="pr-1">{data?.Info?.WorkToday?.Title}</span>
                    ({data?.Info?.WorkToday?.TimeFrom} -{" "}
                    {data?.Info?.WorkToday?.TimeTo})
                  </div>
                </div>
              )}
              <div className="p-4 mb-4 border rounded">
                <div className="relative flex items-center justify-between mb-2">
                  <div>
                    <div className="font-light text-gray-500">Vào làm</div>
                    <div className="text-lg font-bold text-success">
                      {data?.CheckIn
                        ? moment(data?.CheckIn).format("HH:mm")
                        : "--:--"}
                    </div>
                  </div>
                  <ArrowLeftOnRectangleIcon className="absolute right-0 w-7 top-2/4 -translate-y-2/4 text-success" />
                </div>
                {/* <div className="grid grid-cols-2 gap-8 mb-2.5">
                  <div>
                    <div className="mb-px font-light text-gray-500">Lat</div>
                    <div className="font-medium truncate">
                      {data?.Info?.Lat || 0.0}
                    </div>
                  </div>
                  <div className="font-medium">
                    <div className="mb-px font-light text-gray-500">Lng</div>
                    <div className="font-medium truncate">
                      {data?.Info?.Lng || 0.0}
                    </div>
                  </div>
                </div> */}

                {data?.Info?.Type && (
                  <div>
                    <div className="mb-px font-light text-gray-500">
                      Thông tin
                    </div>
                    <div className="font-medium">
                      {data?.Info["DI_SOM"] ? "Đi làm sớm" : "Đi làm muộn"}
                      <span className="px-1">-</span>
                      {data?.Info?.Type === "CA_NHAN"
                        ? "Việc cá nhân"
                        : "Việc công ty"}
                      <span className="pl-1">
                        (
                        {data?.Info["DI_SOM"] ? (
                          <span className="text-success">
                            +
                            {StringHelpers.formatVND(
                              data?.Info["DI_SOM"]?.Value
                            )}
                          </span>
                        ) : (
                          <span className="text-danger">
                            -
                            {StringHelpers.formatVND(
                              data?.Info["DI_MUON"]?.Value
                            )}
                          </span>
                        )}
                        )
                      </span>
                    </div>
                  </div>
                )}

                {data?.Info?.Desc && (
                  <div className="mt-2.5">
                    <div className="mb-px font-light text-gray-500">Lý do</div>
                    <div>{data?.Info?.Desc}</div>
                  </div>
                )}
              </div>
              <div className="p-4 border rounded">
                <div className="relative flex items-center justify-between mb-2">
                  <div>
                    <div className="font-light text-gray-500">Ra về</div>
                    <div className="text-lg font-bold text-danger">
                      {data?.CheckOut
                        ? moment(data?.CheckOut).format("HH:mm")
                        : "--:--"}
                    </div>
                  </div>
                  <ArrowRightOnRectangleIcon className="absolute right-0 w-7 top-2/4 -translate-y-2/4 text-danger" />
                </div>
                {/* <div className="grid grid-cols-2 gap-8 mb-2.5">
                  <div>
                    <div className="mb-px font-light text-gray-500">Lat</div>
                    <div className="font-medium truncate">
                      {data?.Info?.CheckOut?.Lng || 0.0}
                    </div>
                  </div>
                  <div>
                    <div className="mb-px font-light text-gray-500">Lng</div>
                    <div className="font-medium truncate">
                      {data?.Info?.CheckOut?.Lat || 0.0}
                    </div>
                  </div>
                </div> */}
                {data?.Info?.CheckOut?.Type && (
                  <div>
                    <div className="mb-px font-light text-gray-500">
                      Thông tin
                    </div>
                    <div className="font-medium">
                      {data?.Info?.CheckOut["VE_SOM"]
                        ? "Đi về sớm"
                        : "Đi về muộn"}
                      <span className="px-1">-</span>
                      {data?.Info?.CheckOut?.Type === "CA_NHAN"
                        ? "Việc cá nhân"
                        : "Việc công ty"}
                      <span className="pl-1">
                        (
                        {data?.Info?.CheckOut["VE_MUON"] ? (
                          <span className="text-success">
                            +
                            {StringHelpers.formatVND(
                              data?.Info?.CheckOut["VE_MUON"].Value
                            )}
                          </span>
                        ) : (
                          <span className="text-danger">
                            -
                            {StringHelpers.formatVND(
                              data?.Info?.CheckOut["VE_SOM"]?.Value
                            )}
                          </span>
                        )}
                        )
                      </span>
                    </div>
                  </div>
                )}
                {data?.Info?.CheckOut?.Desc && (
                  <div className="mt-2.5">
                    <div className="mb-px font-light text-gray-500">Lý do</div>
                    <div className="font-medium">
                      {data?.Info?.CheckOut?.Desc}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}

export default PickerTimeKeep;

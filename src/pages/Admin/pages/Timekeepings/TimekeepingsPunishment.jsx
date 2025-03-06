import React from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  f7,
  Link,
  Navbar,
  NavLeft,
  NavRight,
  NavTitle,
  Page,
} from "framework7-react";
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { PickerPunishment } from "./components";
import { useMutation, useQuery } from "react-query";
import ConfigsAPI from "@/api/Configs.api";
import { toast } from "react-toastify";
import StringHelpers from "@/helpers/StringHelpers";

function TimekeepingsPunishment({ f7route }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["TimekeepingsPunishment"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("congcaconfig");
      let result = [];
      if (data?.data && data.data.length > 0) {
        let { Value } = data?.data[0];
        if (Value) {
          let newValue = JSON.parse(Value);
          result = newValue;
        }
      }
      return (
        result || {
          DI_SOM: [],
          DI_MUON: [],
          VE_SOM: [],
          VE_MUON: [],
        }
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ConfigsAPI.setValue(body);
      await refetch();
      return data;
    },
  });

  const onDelete = (item) => {
    f7.dialog.confirm("Xác nhận xoá ca làm việc ?", () => {
      f7.dialog.preloader("Đang thực hiện ...");

      let newValues = [...data].filter((x) => x.ID !== item.ID);

      updateMutation.mutate(
        { data: newValues, name: "calamviecconfig" },
        {
          onSuccess: () => {
            toast.success("Xoá thành công");
            f7.dialog.close();
          },
        }
      );
    });
  };

  const getByName = (name) => {
    switch (name) {
      case "DI_SOM":
        return "Cấu hình đi sớm";
      case "DI_MUON":
        return "Cấu hình đi muộn";
      case "VE_SOM":
        return "Cấu hình về sớm";
      case "VE_MUON":
        return "Cấu hình về muộn";
      default:
    }
  };

  const renderNote = ({ Name, Item }) => {
    let text = "";
    let note = "";

    switch (Name) {
      case "DI_SOM":
        if (Item.Value > 100) {
          note = `Được cộng tiền = ${StringHelpers.formatVND(Item.Value)}`;
        } else if (Item.Value <= 100 && Item.Value >= 0) {
          note = `Được cộng tiền = ${Item.Value} lần lương 1 giờ`;
        } else if (Item.Value === -60) {
          note = `Được cộng tiền = Số phút vênh x ( Lương cơ bản / 60 phút )`;
        } else if (Item.Value < 0 && Item.Value >= -10) {
          note = `Được + ${Item.Value * -1} công`;
        } else {
          note = `Được cộng tiền = Số phút vênh x ${StringHelpers.formatVNDPositive(
            Item.Value
          )}`;
        }
        text = `Đi sớm từ ${Item.FromMinute} - ${Item.ToMinute} Phút : ${note}`;
        break;
      case "DI_MUON":
        if (Item.Value > 100) {
          note = `Bị trừ ${StringHelpers.formatVND(Item.Value)}`;
        } else if (Item.Value <= 100 && Item.Value >= 0) {
          note = `Bị trừ ${Item.Value} lần lương 1 giờ`;
        } else if (Item.Value === -60) {
          note = `Bị trừ tiền = Số phút vênh x ( Lương cơ bản / 60 phút )`;
        } else if (Item.Value < 0 && Item.Value >= -10) {
          note = `Trừ + ${Item.Value * -1} công`;
        } else {
          note = `Bị trừ tiền = Số phút vênh x ${StringHelpers.formatVNDPositive(
            Item.Value
          )}`;
        }
        text = `Đi muộn từ ${Item.FromMinute} - ${Item.ToMinute} Phút : ${note}`;
        break;
      case "VE_SOM":
        if (Item.Value > 100) {
          note = `Bị trừ ${StringHelpers.formatVND(Item.Value)}`;
        } else if (Item.Value <= 100 && Item.Value >= 0) {
          note = `Bị trừ ${Item.Value} lần lương 1 giờ`;
        } else if (Item.Value === -60) {
          note = `Bị trừ tiền = Số phút vênh x ( Lương cơ bản / 60 phút )`;
        } else if (Item.Value < 0 && Item.Value >= -10) {
          note = `Trừ + ${Item.Value * -1} công`;
        } else {
          note = `Bị trừ tiền = Số phút vênh x ${StringHelpers.formatVNDPositive(
            Item.Value
          )}`;
        }
        text = `Về sớm từ ${Item.FromMinute} - ${Item.ToMinute} Phút : ${note}`;
        break;
      case "VE_MUON":
        if (Item.Value > 100) {
          note = `Được cộng tiền = ${StringHelpers.formatVND(Item.Value)}`;
        } else if (Item.Value <= 100 && Item.Value >= 0) {
          note = `Được cộng tiền = ${Item.Value} lần lương 1 giờ`;
        } else if (Item.Value === -60) {
          note = `Được cộng tiền = Số phút vênh x ( Lương cơ bản / 60 phút )`;
        } else if (Item.Value < 0 && Item.Value >= -10) {
          note = `Được + ${Item.Value * -1} công`;
        } else {
          note = `Được cộng tiền = Số phút vênh x ${StringHelpers.formatVNDPositive(
            Item.Value
          )}`;
        }
        text = `Về muộn từ ${Item.FromMinute} - ${Item.ToMinute} Phút : ${note}`;
        break;
    }
    return <div>{text}</div>;
  };

  return (
    <Page
      className="!bg-white"
      name="Timekeepings-shift"
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
        <NavTitle>Thưởng / Phạt</NavTitle>
        <NavRight className="h-full">
          <PickerPunishment data={data}>
            {({ open }) => (
              <Link
                onClick={open}
                noLinkClass
                className="!text-white flex item-center justify-center rounded items-center h-full w-12"
              >
                <PlusIcon className="w-6" />
              </Link>
            )}
          </PickerPunishment>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div>
        {isLoading && (
          <div className="p-4">
            {Array(3)
              .fill()
              .map((_, i) => (
                <div
                  className="border mb-3.5 last:mb-0 p-4 rounded flex items-start"
                  key={i}
                >
                  <div className="flex-1">
                    <div className="mb-2.5 font-medium text-[15px] text-primary">
                      <div className="w-2/4 h-3.5 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-gray-500">
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-full mb-1"></div>
                      <div className="animate-pulse h-2.5 bg-gray-200 rounded-full w-8/12"></div>
                    </div>
                  </div>
                  <Link
                    noLinkClass
                    className="flex items-baseline justify-end w-12 h-12 opacity-50"
                  >
                    <EllipsisHorizontalIcon className="w-6" />
                  </Link>
                </div>
              ))}
          </div>
        )}
        {!isLoading && (
          <div>
            {data && (
              <div className="p-4">
                {Object.keys(data).map((key, index) => (
                  <div className="border mb-3.5 last:mb-0 rounded" key={index}>
                    <div className="flex px-4 py-3.5 font-semibold border-b bg-gray-50 justify-between items-center">
                      <div>{getByName(key)}</div>
                      <PickerPunishment
                        Type={key}
                        data={data}
                      >
                        {({ open }) => (
                          <div onClick={open}>
                            <PlusIcon className="w-6 text-primary" />
                          </div>
                        )}
                      </PickerPunishment>
                    </div>
                    <div>
                      {data[key] &&
                        data[key].length > 0 &&
                        data[key].map((item, i) => (
                          <PickerPunishment
                            Type={key}
                            initialValues={item}
                            data={data}
                            key={i}
                            getByName={getByName}
                            index={i}
                          >
                            {({ open }) => (
                              <div
                                className="p-4 border-b border-dashed last:border-0"
                                onClick={open}
                              >
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <div className="flex">
                                      {item.FromMinute}p - {item.ToMinute}p
                                      <PencilSquareIcon className="w-4 ml-1" />
                                    </div>
                                    <div className="font-lato text-[15px] font-semibold">
                                      {console.log(item)}
                                      {/* {StringHelpers.formatVND(item.Value)} */}
                                    </div>
                                  </div>
                                  <div className="text-gray-600 font-lato">
                                    {item.Value !== "" &&
                                      renderNote({
                                        Name: key,
                                        Item: item,
                                      })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </PickerPunishment>
                        ))}
                      {(!data[key] || data[key].length === 0) && (
                        <div className="p-4 text-gray-600">
                          Chưa có cài đặt.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

export default TimekeepingsPunishment;

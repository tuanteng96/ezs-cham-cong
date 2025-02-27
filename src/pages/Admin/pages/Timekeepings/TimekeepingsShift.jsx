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
  Popover,
} from "framework7-react";
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { PickerShift } from "./components";
import { useMutation, useQuery } from "react-query";
import ConfigsAPI from "@/api/Configs.api";
import NoFound from "@/components/NoFound";
import clsx from "clsx";
import { toast } from "react-toastify";

function TimekeepingsShift({ f7route }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["TimekeepingsShift"],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue("calamviecconfig");
      let result = [];
      if (data?.data && data.data.length > 0) {
        let { Value } = data?.data[0];
        if (Value) {
          let newValue = JSON.parse(Value);
          result = newValue;
        }
      }
      return result;
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

  return (
    <Page
      className="!bg-white"
      name="Timekeepings-shift"
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
        <NavTitle>Ca làm việc</NavTitle>
        <NavRight className="h-full pr-4">
          <PickerShift data={data}>
            {({ open }) => (
              <Link
                onClick={open}
                noLinkClass
                className="!text-white flex item-center justify-center bg-success text-[14px] h-8 px-2 rounded items-center"
              >
                Thêm mới
              </Link>
            )}
          </PickerShift>
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
            {data && data.length > 0 && (
              <div className="p-4">
                {data.map((item, index) => (
                  <PickerShift data={data} initialValues={item} key={index}>
                    {({ open }) => (
                      <div className="border mb-3.5 last:mb-0 p-4 rounded flex items-start">
                        <div className="flex-1">
                          <div className="mb-1 font-medium text-[15px] text-primary">
                            {item.Name}
                          </div>
                          <div className="text-gray-500">
                            {item.flexible
                              ? item.Options.map(
                                  (x) =>
                                    x.Title.charAt(0).toUpperCase() +
                                    x.Title.slice(1)
                                ).join(", ")
                              : item.Days.filter((x) => !x.isOff)
                                  .map(
                                    (x) =>
                                      x.Title.charAt(0).toUpperCase() +
                                      x.Title.slice(1)
                                  )
                                  .join(", ")}
                          </div>
                        </div>
                        <Link
                          noLinkClass
                          className="flex items-baseline justify-end w-12 h-12"
                          popoverOpen={`.popover-shift-${item.ID}`}
                        >
                          <EllipsisHorizontalIcon className="w-6" />
                        </Link>
                        <Popover
                          className={clsx(
                            "w-[100px]",
                            `popover-shift-${item.ID}`
                          )}
                        >
                          <div className="flex flex-col py-1">
                            <Link
                              popoverClose
                              className="flex justify-between p-3 font-medium border-b last:border-0"
                              noLinkClass
                              onClick={open}
                            >
                              Chỉnh sửa
                            </Link>
                            <Link
                              popoverClose
                              className="flex justify-between p-3 font-medium border-b last:border-0 text-danger"
                              noLinkClass
                              onClick={() => onDelete(item)}
                            >
                              Xoá
                            </Link>
                          </div>
                        </Popover>
                      </div>
                    )}
                  </PickerShift>
                ))}
              </div>
            )}
            {(!data || data.length === 0) && (
              <div className="px-4">
                <NoFound
                  Title="Chưa cài đặt ca làm việc."
                  Desc="Chưa có cài đặt ca làm việc. Vui lòng thêm mới ca làm việc ?"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

export default TimekeepingsShift;

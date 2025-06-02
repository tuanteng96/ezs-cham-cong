import React, { useEffect, useRef } from "react";
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
  PlusIcon,
} from "@heroicons/react/24/outline";
import { PickerShift } from "./components";
import { useMutation, useQuery } from "react-query";
import ConfigsAPI from "@/api/Configs.api";
import NoFound from "@/components/NoFound";
import clsx from "clsx";
import { toast } from "react-toastify";

function TimekeepingsShift({ f7route }) {
  let isOpen = true;
  let elRef = useRef();
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

  useEffect(() => {
    if (elRef?.current && isOpen && data && data.length === 1) {
      elRef?.current?.click();
      isOpen = false;
    }
  }, [elRef?.current, data]);

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
        <NavRight className="h-full">
          <PickerShift data={data}>
            {({ open }) => (
              <Link
                onClick={open}
                noLinkClass
                className="!text-white flex item-center justify-center rounded items-center h-full w-12"
              >
                <PlusIcon className="w-6" />
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
                    <div className="mb-2.5 font-medium text-base text-primary">
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
                    {({ open, openSetup }) => (
                      <div className="border mb-3.5 last:mb-0 p-4 rounded">
                        {index === 0 && (
                          <div ref={elRef} onClick={openSetup}></div>
                        )}
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="text-base font-medium text-primary">
                              {item.Name}
                            </div>
                          </div>
                          <Link
                            noLinkClass
                            className="flex items-baseline justify-end w-12 h-10"
                            popoverOpen={`.popover-shift-${item.ID}`}
                          >
                            <EllipsisHorizontalIcon className="w-6" />
                          </Link>
                        </div>
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
                        <div className="text-gray-500">
                          {item.flexible ? (
                            <>
                              {item.Options &&
                                item.Options.map((otp, i) => (
                                  <div
                                    className="flex justify-between mb-1 last:mb-0"
                                    key={i}
                                  >
                                    <div className="">
                                      {otp?.Title} ({otp?.TimeFrom}
                                      <span className="px-1">-</span>
                                      {otp?.TimeTo})
                                    </div>
                                    <div>Số công {otp?.Value}</div>
                                  </div>
                                ))}
                            </>
                          ) : (
                            <>
                              {item.Days &&
                                item.Days.filter((x) => !x.isOff).map(
                                  (otp, i) => (
                                    <div
                                      className="flex justify-between mb-1 last:mb-0"
                                      key={i}
                                    >
                                      <div>
                                        <span className="capitalize">{otp?.Title}</span> (
                                        {otp?.TimeFrom}
                                        <span className="px-1">-</span>
                                        {otp?.TimeTo})
                                      </div>
                                      <div>Số công {otp?.Value}</div>
                                    </div>
                                  )
                                )}
                            </>
                          )}
                        </div>
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

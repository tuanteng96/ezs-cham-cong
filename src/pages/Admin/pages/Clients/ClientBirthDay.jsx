import React, { useEffect, useState } from "react";
import {
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import { ArrowRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import NoFound from "@/components/NoFound";
import { useQueryClient } from "react-query";
import clsx from "clsx";
import AssetsHelpers from "@/helpers/AssetsHelpers";

function ClientBirthDay(props) {
  const queryClient = useQueryClient();

  let ClientBirthDay = useStore("ClientBirthDay");

  return (
    <Page
      className="bg-white"
      name="ClientBirthDay"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) =>
        queryClient.invalidateQueries(["ClientBirthDay"]).then(() => done())
      }
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
        </NavLeft>
        <NavTitle>
          Khách hàng sinh nhật
          {ClientBirthDay && ClientBirthDay.length > 0 && (
            <span className="pl-1">({ClientBirthDay.length})</span>
          )}
        </NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div>
        {ClientBirthDay &&
          ClientBirthDay.map((item, index) => (
            <Link
              noLinkClass
              href={`/admin/pos/manage/${item.ID}/?state=${JSON.stringify({
                MobilePhone: item.MobilePhone,
                FullName: item.FullName,
              })}`}
              className="flex items-center p-4 border-b last:mb-0 last:border-b-0"
              key={index}
            >
              <div className="w-11">
                <img
                  className="object-cover w-full rounded-full aspect-square"
                  src={
                    !item?.Photo
                      ? AssetsHelpers.toAbsoluteUrlCore(
                          "/AppCore/images/blank.png",
                          ""
                        )
                      : AssetsHelpers.toAbsoluteUrl(item?.Photo)
                  }
                  onError={(e) =>
                    (e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                      "/AppCore/images/blank.png",
                      ""
                    ))
                  }
                />
              </div>
              <div className="flex-1 pl-4 pr-4">
                <div className="flex mb-px font-medium">
                  <div
                    className={clsx(
                      "max-w-[180px] truncate",
                      item.GroupJSON &&
                        item.GroupJSON.length > 0 &&
                        item.GroupJSON[0].Color
                        ? ""
                        : "!text-black"
                    )}
                    style={{
                      color:
                        item.GroupJSON &&
                        item.GroupJSON.length > 0 &&
                        item.GroupJSON[0].Color,
                    }}
                  >
                    {item.FullName}
                  </div>
                </div>
                <div className="flex items-center text-gray-500 font-lato">
                  {item.MobilePhone}
                </div>
              </div>
              <div className="flex justify-end w-10 gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary">
                  <ArrowRightIcon className="w-5" />
                </div>
              </div>
            </Link>
          ))}
        {(!ClientBirthDay || ClientBirthDay.length === 0) && (
          <NoFound
            Title="Không có kết quả nào."
            Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
          />
        )}
      </div>
    </Page>
  );
}

export default ClientBirthDay;

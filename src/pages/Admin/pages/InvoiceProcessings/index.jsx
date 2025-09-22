import React, { useEffect, useState } from "react";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  AdjustmentsVerticalIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import NoFound from "@/components/NoFound";
import moment from "moment";
import { useQueryClient } from "react-query";
import { PickerFilter } from "./components";
import StringHelpers from "@/helpers/StringHelpers";
import AssetsHelpers from "@/helpers/AssetsHelpers";

function InvoiceProcessings(props) {
  const queryClient = useQueryClient();
  const [Lists, setLists] = useState(null);
  const [filters, setFilters] = useState({
    Type: "",
    Key: "",
  });

  let InvoiceProcessings = useStore("InvoiceProcessings");

  useEffect(() => {
    setLists(InvoiceProcessings);
  }, [InvoiceProcessings]);

  useEffect(() => {
    if (InvoiceProcessings && InvoiceProcessings.length > 0) {
      let { Type, Key } = filters;
      let newLists = [...InvoiceProcessings];
      if (Type !== "") {
        if (Type === 2) {
          newLists = newLists.filter((x) => x?.CheckIn?.CheckOutTime);
        } else {
          newLists = newLists
            .filter((item) =>
              Type === 0
                ? item?.CheckIn?.OrderCheckInID
                : !item?.CheckIn?.OrderCheckInID
            )
            .filter((x) => !x?.CheckIn?.CheckOutTime);
        }
      }
      if (Type === "") {
        newLists = newLists.filter((x) => !x?.CheckIn?.CheckOutTime);
      }
      if (Key) {
        newLists = newLists.filter(
          (item) =>
            StringHelpers.ConvertViToEn(item.FullName).includes(
              StringHelpers.ConvertViToEn(Key)
            ) || item.MobilePhone.includes(Key)
        );
      }
      setLists(newLists);
    }
  }, [filters, InvoiceProcessings]);

  return (
    <Page
      className="bg-white"
      name="Processings"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) =>
        queryClient.invalidateQueries(["InvoiceProcessings"]).then(() => done())
      }
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
          Hoá đơn đang xử lý
          {InvoiceProcessings &&
            InvoiceProcessings.filter((x) => !x?.CheckIn?.CheckOutTime).length >
              0 && (
              <span className="pl-1">
                (
                {
                  InvoiceProcessings.filter((x) => !x?.CheckIn?.CheckOutTime)
                    .length
                }
                )
              </span>
            )}
        </NavTitle>
        <NavRight className="h-full">
          <PickerFilter
            initialValues={filters}
            onChange={(values) => setFilters(values)}
          >
            {({ open }) => (
              <Link
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
                onClick={open}
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </Link>
            )}
          </PickerFilter>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div>
        {Lists && Lists.length > 0 && (
          <>
            {Lists.map((item, index) => (
              <Link
                noLinkClass
                className="flex items-center p-4 border-b last:mb-0"
                key={index}
                href={`/admin/pos/manage/${item.ID}/?state=${JSON.stringify({
                  MobilePhone: item.MobilePhone,
                  FullName: item.FullName,
                })}`}
              >
                <div className="w-11">
                  <img
                    className="w-full rounded-full"
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
                  <div className="flex mb-px font-medium max-w-[200px]">
                    <div className="truncate">{item.FullName}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 font-lato">
                    <div>{item.MobilePhone}</div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <div>
                      <span>
                        <span>In</span>
                        <span className="pl-1 font-medium text-success">
                          {moment(item?.CheckIn?.CreateDate).format("HH:mm")}
                        </span>
                      </span>
                      {item?.CheckIn?.CheckOutTime && (
                        <>
                          <span className="px-1">-</span>
                          <span>
                            <span>Out</span>
                            <span className="pl-1 font-medium text-danger">
                              {moment(item?.CheckIn?.CheckOutTime).format(
                                "HH:mm"
                              )}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end w-10 gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg bg-primary-light text-primary">
                    <ArrowRightIcon className="w-5" />
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
        {(!Lists || Lists.length === 0) && (
          <NoFound
            Title="Không có kết quả nào."
            Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
          />
        )}
      </div>
    </Page>
  );
}

export default InvoiceProcessings;

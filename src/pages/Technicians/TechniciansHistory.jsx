import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Segmented,
  Subnavbar,
  Tab,
  Tabs,
  useStore,
} from "framework7-react";
import React, { useState } from "react";
import { useQuery } from "react-query";
import StaffsAPI from "../../api/Staffs.api";
import moment from "moment";
import StringHelpers from "../../helpers/StringHelpers";
import PromHelpers from "../../helpers/PromHelpers";
import AssetsHelpers from "../../helpers/AssetsHelpers";
import { DatePickerWrap } from "../../partials/forms";
import PickerDiaryAdd from "./components/PickerDiaryAdd";
import NoFound from "../../components/NoFound";
import Dom7 from "dom7";
import ArrayHelpers from "../../helpers/ArrayHelpers";

function TechniciansHistory({ memberid }) {
  const Auth = useStore("Auth");
  const [active, setActive] = useState("#dich-vu");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Technicians-ServiceHistory"],
    queryFn: async () => {
      let { data } = await StaffsAPI.getServiceHistory({
        Token: Auth?.token,
        MemberID: memberid,
      });
      const newData = [];
      for (let item of data) {
        for (let service of item.Services) {
          if (service.Status === "done")
            newData.push({
              ...service,
              ProdTitle: item.OrderItem.ProdTitle,
            });
        }
      }
      return ArrayHelpers.groupbyDDHHMM(newData);
    },
    enabled: Boolean(Auth && Auth?.ID),
  });

  const {
    data: Orders,
    isLoading: OrdersLoading,
    refetch: OrdersRefetch,
  } = useQuery({
    queryKey: ["Technicians-OrderHistory"],
    queryFn: async () => {
      let { data } = await StaffsAPI.getOrdersHistory({
        MemberID: memberid,
      });
      return ArrayHelpers.groupbyDDHHMM(data?.items, "CreateDate");
    },
    enabled: Boolean(active === "#da-mua"),
  });

  const {
    data: Available,
    isLoading: AvailableLoading,
    refetch: AvailableRefetch,
  } = useQuery({
    queryKey: ["Technicians-HistoryAvailable"],
    queryFn: async () => {
      let { data } = await StaffsAPI.getAvailableHistory({
        Token: Auth?.token,
        MemberID: memberid,
      });
      const newData = [];
      for (let item of data) {
        if (item.TabIndex < 2) {
          let nearestDate = null;
          item.Services &&
            item.Services.filter((service) => service.Status === "done").map(
              ({ BookDate }) => {
                if (!nearestDate) {
                  nearestDate = BookDate;
                }

                let diff = moment(BookDate).diff(
                  moment(nearestDate),
                  "minutes"
                );

                if (diff > 0) {
                  nearestDate = BookDate;
                }
              }
            );

          item.Services =
            item.Services &&
            item.Services.filter((service) => service.Status !== "done");

          item.LastSession = nearestDate;
          newData.push(item);
        }
      }
      return newData;
    },
    enabled: Boolean(active === "#buoi-con"),
  });

  const loadRefresh = (done) => {
    if (active === "#dich-vu") {
      refetch().then(() => done());
    }
    if (active === "#da-mua") {
      OrdersRefetch().then(() => done());
    }
    if (active === "#buoi-con") {
      AvailableRefetch().then(() => done());
    }
  };

  return (
    <Page
      name="Technicians-profile"
      noToolbar
      // ptr
      // onPtrRefresh={loadRefresh}
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
        <NavTitle>Lịch sử khách hàng</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
        <Subnavbar>
          <Segmented strong>
            <Button
              tabLink="#dich-vu"
              active={active === "#dich-vu"}
              onClick={() => setActive("#dich-vu")}
            >
              Sử dụng DV
            </Button>
            <Button
              tabLink="#da-mua"
              active={active === "#da-mua"}
              onClick={() => {
                setActive("#da-mua");
              }}
            >
              SP/DV đã mua
            </Button>
            <Button
              tabLink="#buoi-con"
              active={active === "#buoi-con"}
              onClick={() => setActive("#buoi-con")}
            >
              Buổi còn
            </Button>
          </Segmented>
        </Subnavbar>
      </Navbar>
      <Tabs animated>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          className="p-4 overflow-auto"
          id="dich-vu"
          tabActive
        >
          {isLoading && (
            <div className="timeline">
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div className="pb-4 timeline-item" key={index}>
                    <div className="timeline-item-date">
                      <span className="font-semibold">
                        <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      </span>
                    </div>
                    <div className="timeline-item-divider"></div>
                    <div className="w-full timeline-item-content">
                      <div className="p-3 bg-white rounded">
                        <div className="mb-3 text-xs font-semibold text-muted">
                          <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-full h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-9/12 h-2 mt-2 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          
          {!isLoading && (
            <>
              {data && data.length > 0 && (
                <div className="timeline">
                  {data &&
                    data.map((item, index) => (
                      <div className="pb-4 timeline-item" key={index}>
                        <div className="timeline-item-date">
                          <span className="font-semibold">
                            {moment(item.dayFull).format("DD")}
                          </span>
                          <small className="pl-[2px]">
                            {moment(item.dayFull).format("MMM")}
                          </small>
                        </div>
                        <div className="timeline-item-divider"></div>
                        <div className="w-full timeline-item-content">
                          <div className="grid grid-cols-1 gap-2">
                            {item.items &&
                              item.items.map((sub, i) => (
                                <div
                                  className="relative p-3 bg-white rounded"
                                  key={i}
                                >
                                  <div className="text-xs font-semibold text-primary">
                                    {moment(sub.BookDate).format("HH:mm A")}
                                  </div>
                                  <div className="mt-2 font-semibold">
                                    {sub.ProdTitle} ({sub.Title})
                                  </div>
                                  <div className="mt-2">
                                    Nhân viên{" "}
                                    {sub.Staffs &&
                                      sub.Staffs.map(
                                        (staff) => staff.FullName
                                      ).join(", ")}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {(!data || data.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </Tab>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          id="da-mua"
          className="h-full p-4 overflow-auto"
        >
          {OrdersLoading && (
            <div className="timeline">
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div className="pb-4 timeline-item" key={index}>
                    <div className="timeline-item-date">
                      <span className="font-semibold">
                        <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      </span>
                    </div>
                    <div className="timeline-item-divider"></div>
                    <div className="w-full timeline-item-content">
                      <div className="p-3 bg-white rounded">
                        <div className="mb-3 text-xs font-semibold text-muted">
                          <div className="w-[50px] h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-full h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-9/12 h-2 mt-2 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!OrdersLoading && (
            <>
              {Orders && Orders.length > 0 && (
                <div className="timeline">
                  {Orders &&
                    Orders.map((item, index) => (
                      <div className="pb-4 timeline-item" key={index}>
                        <div className="timeline-item-date">
                          <span className="font-semibold">
                            {moment(item.dayFull).format("DD")}
                          </span>
                          <small className="pl-[2px]">
                            {moment(item.dayFull).format("MMM")}
                          </small>
                        </div>
                        <div className="timeline-item-divider"></div>
                        <div className="w-full timeline-item-content">
                          <div className="bg-white rounded">
                            {item.items &&
                              item.items.map((sub, i) => (
                                <div
                                  className="p-3 border-b last:border-0"
                                  key={i}
                                >
                                  <div className="mb-1 font-medium">
                                    {sub.Title}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted">SL</span>
                                    <span className="pl-2">x{sub.Qty}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {(!Orders || Orders.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </Tab>
        <Tab
          onTabShow={(el) => Dom7(el).scrollTop(0)}
          id="buoi-con"
          className="p-4 overflow-auto"
        >
          {AvailableLoading && (
            <>
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div
                    className="p-4 mb-4 bg-white rounded last:mb-0"
                    key={index}
                  >
                    <div className="pb-3 mb-3 border-b">
                      <div className="w-full h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="w-9/12 h-2.5 mt-2 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-1/5 h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="w-2/5 h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!AvailableLoading && (
            <>
              {Available &&
                Available.length > 0 &&
                Available.map((item, index) => (
                  <div
                    className="p-4 mb-4 bg-white rounded last:mb-0"
                    key={index}
                  >
                    <div className="pb-3 mb-3 border-b">
                      <div className="font-semibold">
                        {item.OrderItem.ProdTitle} ({item.Title}) (
                        {item.TabIndex === 1 ? (
                          "Thẻ bảo hành"
                        ) : (
                          <span>
                            Còn
                            <b className="px-1.5 text-primary">
                              {item.Services.length}
                            </b>
                            buổi
                          </span>
                        )}
                        )
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Buổi gần nhất</span>
                      <span className="font-medium text-success">
                        {item.LastSession
                          ? moment(item.LastSession).format("HH:mm DD-MM-YYYY")
                          : "Thẻ mới chưa thực hiện"}
                      </span>
                    </div>
                  </div>
                ))}
              {(!Available || Available.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </Tab>
      </Tabs>
    </Page>
  );
}

export default TechniciansHistory;

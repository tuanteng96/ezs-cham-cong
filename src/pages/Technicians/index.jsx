import React, { useState } from "react";
import {
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Tab,
  Tabs,
  useStore,
} from "framework7-react";
import {
  AdjustmentsVerticalIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import StaffsAPI from "../../api/Staffs.api";
import { useQuery } from "react-query";
import moment from "moment";
import { DatePickerWrap } from "../../partials/forms";
import { PickerActionFilter } from "../../components";
import NoFound from "../../components/NoFound";
import { TechniciansBookItem, TechniciansServiceItem } from "./components";
import ConfigsAPI from "@/api/Configs.api";

function Technicians({ f7router, f7route }) {
  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  let Stocks = useStore("Stocks");

  const [Type, setType] = useState(f7route.query?.Type || "dv");
  const [filters, setFilters] = useState({
    Key: "",
    From: new Date(),
    To: new Date(),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Technicians", filters],
    queryFn: async () => {
      var bodyFormData = new FormData();
      bodyFormData.append("cmd", "member_sevice");
      bodyFormData.append("IsManager", 1);
      bodyFormData.append("IsService", 1);
      bodyFormData.append("MemberIDs", "");
      bodyFormData.append(
        "srv_status",
        "book,wait_book,wait,doing,done,cancel"
      );
      bodyFormData.append("srv_from", moment(filters.From).format("l"));
      bodyFormData.append("srv_to", moment(filters.To).format("l"));
      bodyFormData.append("key", filters.Key);
      bodyFormData.append("ps", 1000);

      let { data } = await StaffsAPI.getServices({
        Filters: bodyFormData,
        Token: Auth?.token,
        StockID: CrStocks?.ID || "",
      });

      let RsRooms = await ConfigsAPI.getValue("room");
      let Rooms = [];
      if (
        RsRooms &&
        RsRooms?.data?.data &&
        RsRooms?.data?.data.length > 0 &&
        RsRooms?.data?.data[0].Value
      ) {
        Rooms = JSON.parse(RsRooms?.data?.data[0].Value);
      }

      return {
        ...data,
        data: data?.data
          ? data.data.map((item) => {
              let obj = { ...item, RoomTitle: "" };
              if (obj?.RoomID) {
                for (let i = 0; i < Rooms.length; i++) {
                  if (Rooms[i].ListRooms && Rooms[i].ListRooms.length > 0) {
                    for (let k = 0; k < Rooms[i].ListRooms.length; k++) {
                      if (
                        Rooms[i].ListRooms[k].Children &&
                        Rooms[i].ListRooms[k].Children.length > 0
                      ) {
                        let index = Rooms[i].ListRooms[k].Children.findIndex(
                          (p) => p.ID === obj?.RoomID
                        );
                        if (index > -1) {
                          obj.RoomTitle =
                            Rooms[i].ListRooms[k].Children[index].label;
                          break;
                        }
                      }
                    }
                  }
                }
              }
              return obj;
            })
          : [],
      };
    },
    enabled: Boolean(Auth && Auth?.ID),
  });

  return (
    <Page
      name="Technicians"
      ptr
      onPtrRefresh={(done) => refetch().then(() => done())}
    >
      <Navbar innerClass="!px-0" className="text-white" outline={false}>
        <NavLeft className="h-full">
          <PickerActionFilter
            options={[
              { Title: "Dịch vụ " + `(${data?.data?.length})`, value: "dv" },
              { Title: "Đặt lịch " + `(${data?.mBook?.length})`, value: "dl" },
            ]}
            option={Type}
            onChange={(val) => setType(val?.value)}
          >
            {({ open }) => (
              <div
                className="flex items-center justify-center w-12 h-full"
                onClick={open}
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </div>
            )}
          </PickerActionFilter>
        </NavLeft>
        <NavTitle>
          {isLoading && "Đang tải ..."}
          {!isLoading && (
            <>
              {Type === "dv"
                ? `Dịch vụ (${data?.data?.length || 0})`
                : `Đặt lịch (${data?.mBook?.length || 0})`}
            </>
          )}
        </NavTitle>
        <NavRight className="h-full">
          <DatePickerWrap
            value={filters.From}
            format="DD/MM/YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                From: val,
                To: val,
              }));
            }}
            label="Chọn ngày"
          >
            {({ open }) => (
              <div
                className="flex items-center justify-center w-12 h-full"
                onClick={open}
              >
                <CalendarDaysIcon className="w-6" />
              </div>
            )}
          </DatePickerWrap>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {Type === "dv" && (
        <div className="p-4">
          {isLoading && (
            <>
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div
                    className="p-4 mb-4 bg-white rounded last:mb-0"
                    key={index}
                  >
                    <div className="relative pb-3 mb-3 border-b">
                      <div className="w-full h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="w-9/12 h-2.5 mt-2 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="mb-2 w-2/5 h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-4/5 h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <div className="mb-2 w-2/5 h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-4/5 h-2.5 bg-gray-300 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
          {!isLoading && (
            <>
              {data?.data &&
                data?.data.map((item, index) => (
                  <TechniciansServiceItem key={index} item={item} />
                ))}
              {(!data?.data || data?.data?.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </div>
      )}
      {Type === "dl" && (
        <div className="p-4">
          {!isLoading && (
            <>
              {data?.mBook &&
                data?.mBook.map((item, index) => (
                  <TechniciansBookItem key={index} item={item} />
                ))}
              {(!data?.mBook || data?.mBook?.length === 0) && (
                <NoFound
                  Title="Không có kết quả nào."
                  Desc="Rất tiếc ... Không tìm thấy dữ liệu nào."
                />
              )}
            </>
          )}
        </div>
      )}
    </Page>
  );
}

export default Technicians;

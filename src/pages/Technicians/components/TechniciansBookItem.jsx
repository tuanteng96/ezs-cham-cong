import clsx from "clsx";
import {
  Actions,
  ActionsButton,
  ActionsGroup,
  ActionsLabel,
  f7,
} from "framework7-react";
import moment from "moment";
import React, { useState } from "react";

function TechniciansBookItem({ item }) {
  const [visible, setVisible] = useState(false);

  const close = () => setVisible(false);

  const getStatusClass = (Status, item) => {
    const isAuto =
      item?.Desc && item.Desc.toUpperCase().indexOf("TỰ ĐỘNG ĐẶT LỊCH");

    if (Status === "XAC_NHAN") {
      if (isAuto !== "" && isAuto > -1)
        return {
          Color: "primary-2",
          Text: "Xác nhận",
        };
      return {
        Color: "primary",
        Text: "Xác nhận",
      };
    }
    if (Status === "CHUA_XAC_NHAN") {
      return {
        Color: "warning",
        Text: "Chưa xác nhận",
      };
    }
    if (Status === "KHACH_KHONG_DEN") {
      return {
        Color: "danger",
        Text: "Khách không đến",
      };
    }
    if (Status === "KHACH_DEN") {
      return {
        Color: "info",
        Text: "Khách đến",
      };
    }
    if (Status === "TU_CHOI") {
      return {
        Color: "danger",
        Text: "Khách huỷ lịch",
      };
    }
    if (Status === "doing") {
      return {
        Color: "success",
        Text: "Đang thực hiện",
      };
    }
    if (Status === "done") {
      return {
        Color: "secondary",
        Text: "Hoàn thành",
      };
    }
    return {
      Color: "warning",
      Text: "Chưa xác định",
    };
  };

  return (
    <div
      className="p-4 mb-4 bg-white rounded last:mb-0"
      onClick={() => setVisible(true)}
    >
      <div className="relative pb-3 mb-3 border-b">
        <div className="font-semibold">
          {item.RootTitles} {item.AtHome && " - Tại nhà"}
        </div>
        <div className="flex items-center mt-2 text-xs font-medium rounded">
          <div
            className={clsx(
              "w-1.5 h-1.5 rounded-full mr-1.5",
              `bg-${getStatusClass(item.Status, item).Color}`
            )}
          ></div>
          <span
            className={clsx(`text-${getStatusClass(item.Status, item).Color}`)}
          >
            {getStatusClass(item.Status, item).Text}
          </span>
          <span className="pl-1"> - Tại {item.Stock.Title}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="mb-px font-light text-muted">Thời gian</div>
          <div className="font-medium">
            {moment(item.BookDate).format("HH:mm DD/MM/YYYY")}
          </div>
        </div>
        <div>
          <div className="mb-px font-light text-muted">Khách hàng</div>
          <div className="font-medium">
            {item?.FullName || item?.Member?.FullName}
          </div>
        </div>
        {item?.RoomTitle && (
          <div className="col-span-2">
            <div className="mb-px font-light text-muted">Buồng / Phòng</div>
            <div className="font-medium">{item.RoomTitle}</div>
          </div>
        )}
        {item?.Desc && (
          <div className="col-span-2">
            <div className="mb-px font-light text-muted">Chi chú</div>
            <div className="font-medium">{item?.Desc}</div>
          </div>
        )}
      </div>
      <Actions opened={visible} onActionsClosed={close}>
        <ActionsGroup>
          <ActionsLabel>{item.RootTitles}</ActionsLabel>
          <ActionsButton
            className="text-primary"
            onClick={() =>
              f7.views.main.router.navigate(
                "/technicians/profile/" + item.MemberID + "/" + item?.ID + "/"
              )
            }
          >
            Thông tin khách hàng
          </ActionsButton>
          <ActionsButton
            className="text-primary"
            onClick={() =>
              f7.views.main.router.navigate(
                "/technicians/history/" + item.MemberID + "/"
              )
            }
          >
            Lịch sử khách hàng
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton color="red">Đóng</ActionsButton>
        </ActionsGroup>
      </Actions>
    </div>
  );
}

export default TechniciansBookItem;

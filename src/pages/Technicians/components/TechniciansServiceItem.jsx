import {
  Actions,
  ActionsButton,
  ActionsGroup,
  ActionsLabel,
  f7,
} from "framework7-react";
import moment from "moment";
import React, { useState } from "react";

function TechniciansServiceItem({ item }) {
  const [visible, setVisible] = useState(false);

  const close = () => setVisible(false);

  const checkStatus = (status) => {
    switch (status) {
      case "done":
        return (
          <div className="flex items-center mt-2 text-xs font-medium rounded text-success">
            <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></div>
            Đã hoàn thành
          </div>
        );
      case "doing":
        return (
          <div className="flex items-center mt-2 text-xs font-medium rounded text-warning">
            <div className="w-1.5 h-1.5 rounded-full bg-warning mr-1.5"></div>
            Đang thực hiện
          </div>
        );
      default:
        return (
          <div className="flex items-center mt-2 text-xs font-medium rounded text-primary">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></div>
            Chưa thực hiện
          </div>
        );
    }
  };

  return (
    <div
      className="p-4 mb-4 bg-white rounded last:mb-0"
      onClick={() => setVisible(true)}
    >
      <div className="relative pb-3 mb-3 border-b">
        <div className="font-semibold">
          {item.Title} ({item.RootMinutes}p/Ca)
        </div>
        {checkStatus(item.Status)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="mb-px font-light text-muted">Thời gian</div>
          <div className="font-medium">
            {moment(item.BookDate).format("HH:mm DD/MM/YYYY")}
          </div>
        </div>
        <div>
          <div className="mb-px font-light text-muted">Khách hàng</div>
          <div className="font-medium">{item.member.FullName}</div>
        </div>
      </div>
      <Actions opened={visible} onActionsClosed={close}>
        <ActionsGroup>
          <ActionsLabel>{item.Title}</ActionsLabel>
          <ActionsButton
            className="text-primary"
            onClick={() =>
              f7.views.main.router.navigate(
                "/technicians/profile/" + item.member.ID + "/" + item.ID + "/?type=Os"
              )
            }
          >
            Thông tin khách hàng
          </ActionsButton>
          <ActionsButton
            className="text-primary"
            onClick={() =>
              f7.views.main.router.navigate(
                "/technicians/service/" +
                  item.member.ID +
                  "/" +
                  item.ID +
                  "/" +
                  item.OrderItemID +
                  "/?type=Os"
              )
            }
          >
            Thông tin dịch vụ
          </ActionsButton>
          <ActionsButton
            className="text-primary"
            onClick={() =>
              f7.views.main.router.navigate(
                "/technicians/history/" + item.member.ID + "/?type=Os"
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

export default TechniciansServiceItem;

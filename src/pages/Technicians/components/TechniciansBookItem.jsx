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

  return (
    <div
      className="p-4 mb-4 bg-white rounded last:mb-0"
      onClick={() => setVisible(true)}
    >
      <div className="relative pb-3 mb-3 border-b">
        <div className="font-semibold">
          {item.RootTitles} {item.AtHome && " - Tại nhà"}
        </div>
        <div className="flex items-center mt-2 text-xs font-medium rounded text-success">
          <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></div>
          {item.Stock.Title}
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
        {item.Desc && (
          <div className="col-span-2">
            <div className="mb-px font-light text-muted">
              Chi chú
            </div>
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

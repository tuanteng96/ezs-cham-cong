import {
  Actions,
  ActionsButton,
  ActionsGroup,
  ActionsLabel,
  f7,
} from "framework7-react";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import NotificationsAPI from "../../../api/Notifications.api";

function NotificationPicker({ children, item, f7router }) {
  const [visible, setVisible] = useState(false);

  const queryClient = useQueryClient();

  const close = () => {
    setVisible(false);
  };

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      return NotificationsAPI.delete(body);
    },
  });

  const onDelete = () => {
    f7.dialog.confirm("Xác nhận xoá thông báo này ?", () => {
      f7.dialog.preloader("Đang thực hiện...");
      var bodyFormData = new FormData();
      bodyFormData.append("ID", item.ID);

      deleteMutation.mutate(bodyFormData, {
        onSuccess: () => {
          queryClient.invalidateQueries(["NotificationsAdmin"]).then(() => {
            f7.dialog.close();
          });
        },
      });
    });
  };

  return (
    <>
      {children({
        open: () => setVisible(true),
        close: close,
      })}
      <Actions opened={visible} onActionsClosed={() => setVisible(false)}>
        <ActionsGroup>
          <ActionsLabel>{item.Title}</ActionsLabel>
          <ActionsButton
            onClick={() => f7router.navigate(`/admin/notifications/edit/${item.ID}/`)}
          >
            Xem chi tiết
          </ActionsButton>
          <ActionsButton color="red" onClick={onDelete}>
            Xoá thông báo
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </>
  );
}

export default NotificationPicker;

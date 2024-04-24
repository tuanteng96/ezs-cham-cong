import {
  Actions,
  ActionsButton,
  ActionsGroup,
  ActionsLabel,
  f7,
} from "framework7-react";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import ArticleAPI from "../../../api/Article.api";

function ArticlePicker({ children, item, f7router }) {
  const [visible, setVisible] = useState(false);

  const queryClient = useQueryClient();

  const close = () => {
    setVisible(false);
  };

  const deleteMutation = useMutation({
    mutationFn: (body) => ArticleAPI.delete(body),
  });

  const onDelete = () => {
    const dataPost = {
      delete: [item.ID],
    };
    f7.dialog.confirm(
      "Xác nhận xoá bài viết ?",
      () => {
        f7.dialog.preloader("Đang thực hiện ...");
        deleteMutation.mutate(dataPost, {
          onSuccess: () => {
            queryClient
              .invalidateQueries({ queryKey: ["Articles"] })
              .then(() => {
                toast.success("Xoá thành công.");
                f7.dialog.close();
              });
          },
        });
      },
      () => {
        setVisible(true);
      }
    );
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
            onClick={() => f7router.navigate(`/admin/article/${item.ID}/`)}
          >
            Chỉnh sửa bài viết
          </ActionsButton>
          <ActionsButton color="red" onClick={onDelete}>
            Xoá
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </>
  );
}

export default ArticlePicker;

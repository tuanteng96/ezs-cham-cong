import store from "@/js/store";
import { f7 } from "framework7-react";
import { toast } from "react-toastify";

const AlertHelpers = {
  CheckInOut: ({ data, dataCheckInOut, Sync = false }) => {
    f7.dialog.close();
    if (Sync) {
      if (!data?.list || data?.list?.length === 0) {
        f7.dialog
          .create({
            title: "Thông báo",
            content: `Đồng không thành công do mạng không ổn định. Thực hiện đồng bộ chấm công sau 10 phút.`,
            buttons: [
              {
                text: "Xác nhận",
                close: true,
              },
            ],
          })
          .open();
      } else {
        store.dispatch("setCrsInOut", {
          ...dataCheckInOut.list[0],
          success: true,
        });
        toast.success("Đồng bộ dữ liệu thành công.", {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 2000,
        });
      }
    } else {
      if (!data?.list || data?.list?.length === 0) {
        f7.dialog
          .create({
            title: "Thông báo",
            content: `Chấm công không thành công do mạng không ổn định. Thời gian chấm công <span class="${
              data?.body?.CheckOut
                ? "text-danger font-medium px-px"
                : "text-success font-medium px-px"
            }">${
              data?.body?.CheckOut
                ? `ra về lúc ${moment(
                    data?.body?.CheckOut,
                    "YYYY-MM-DD HH:mm"
                  ).format("HH:mm")}`
                : `vào làm lúc ${moment(
                    data?.body?.CheckIn,
                    "YYYY-MM-DD HH:mm"
                  ).format("HH:mm")}`
            }</span> đã được ghi nhận. <br /> <span class='text-danger'>Bạn cần thực hiện đồng bộ chấm công sau 10 phút.</span>`,
            buttons: [
              {
                text: "Xác nhận",
                close: true,
              },
            ],
          })
          .open();
      } else {
        toast.success("Chấm công thành công.", {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 2000,
        });
      }
    }
  },
};

export default AlertHelpers;

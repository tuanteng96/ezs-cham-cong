import {
  BellAlertIcon,
  ChevronLeftIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React from "react";
import PromHelpers from "../../helpers/PromHelpers";
import ArrayHelpers from "../../helpers/ArrayHelpers";
import NoFound from "../../components/NoFound";
import moment from "moment";
import clsx from "clsx";
import { useMutation, useQueryClient } from "react-query";
import { NotificationPicker } from "./components";
import AuthAPI from "../../api/Auth.api";

function Notifications({ f7router }) {
  let Notifications = useStore("Notifications");

  const queryClient = useQueryClient();
  
  let NotificationsGroup = ArrayHelpers.groupbyDDHHMM(
    Notifications,
    "CreateDate"
  );

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      return AuthAPI.deleteNotification(body);
    },
  });

  const onDeleteAll = () => {
    f7.dialog.confirm("Bạn muốn xoá hết tất cả thông báo ?", () => {
      f7.dialog.preloader("Đang thực hiện...");
      var bodyFormData = new FormData();
      bodyFormData.append("ids", Notifications.map((x) => x.ID).join(","));
      deleteMutation.mutate(bodyFormData, {
        onSuccess: () => {
          queryClient.invalidateQueries(["Notifications"]).then(() => {
            f7.dialog.close();
          });
        },
      });
    });
  };

  return (
    <Page
      className="bg-white"
      name="Notifications"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) =>
        queryClient.invalidateQueries(["Notifications"]).then(() => done())
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
        <NavTitle>Thông báo</NavTitle>
        {Notifications && Notifications.length > 0 && (
          <NavRight className="h-full">
            <Link
              noLinkClass
              className="!text-white h-full flex item-center justify-center w-12"
              onClick={onDeleteAll}
            >
              <TrashIcon className="w-5" />
            </Link>
          </NavRight>
        )}

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {NotificationsGroup && NotificationsGroup.length > 0 && (
        <div className="p-4">
          {NotificationsGroup.map((group, index) => (
            <div className="mb-4 last:mb-0" key={index}>
              <div className="uppercase text-[#7E8299] font-bold text-[12px] mb-3">
                {moment(group.dayFull).format("dddd, [Ngày] DD [T]M yyyy")}
              </div>
              <div>
                {group.items &&
                  group.items.map((item, i) => (
                    <NotificationPicker item={item} f7router={f7router} key={i}>
                      {({ open }) => (
                        <div className="flex mb-3 last:mb-0" onClick={open}>
                          <div className="bg-[#FFF4DE] w-11 h-11 rounded-full flex items-center justify-center">
                            <BellAlertIcon className="w-6 text-app" />
                          </div>
                          <div className="flex-1 pl-3">
                            <div
                              className={clsx(
                                "line-clamp-1 font-medium text-[15px]",
                                item.IsReaded && "text-[#3f4254]"
                              )}
                            >
                              {item.Title}
                            </div>
                            <div
                              className={clsx(
                                "line-clamp-2",
                                item.IsReaded && "font-light text-[#7E8299]"
                              )}
                            >
                              {item.Body}
                            </div>
                            <div className="text-[13px] mt-px text-muted">
                              {moment(item.CreateDate).startOf("day").fromNow()}
                            </div>
                          </div>
                        </div>
                      )}
                    </NotificationPicker>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {(!NotificationsGroup || NotificationsGroup.length === 0) && (
        <NoFound Title="Không có thông báo" />
      )}
    </Page>
  );
}

export default Notifications;

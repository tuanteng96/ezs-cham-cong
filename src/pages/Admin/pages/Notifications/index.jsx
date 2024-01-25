import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
} from "framework7-react";
import React, { useRef } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  BellAlertIcon,
  ChevronLeftIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import AdminAPI from "../../../../api/Admin.api";
import { useInfiniteQuery } from "react-query";
import ArrayHelpers from "../../../../helpers/ArrayHelpers";
import { NotificationPicker } from "../../components";

function NotificationAdmin({ f7router }) {
  const allowInfinite = useRef(true);

  const resultNotificationsQuery = useInfiniteQuery({
    queryKey: ["NotificationsAdmin"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await AdminAPI.listNotifications({
        Pi: pageParam,
        Ps: 15,
      });
      return data?.data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.Pi === lastPage.PCount ? undefined : lastPage.Pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    resultNotificationsQuery?.data?.pages,
    "list"
  );

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    resultNotificationsQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      className="bg-white"
      name="Notifications"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => resultNotificationsQuery.refetch().then(done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={resultNotificationsQuery.isLoading}
      onInfinite={loadMore}
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
        <NavTitle>Danh sách thông báo</NavTitle>
        <NavRight className="h-full">
          <Link
            href="/admin/notifications/add/"
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <PlusIcon className="w-6" />
          </Link>
        </NavRight>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      {Lists &&
        Lists.map((item, index) => (
          <NotificationPicker item={item} f7router={f7router} key={index}>
            {({ open }) => (
              <div className="flex p-4 border-b last:border-0" onClick={open}>
                <div className="bg-[#FFF4DE] w-11 h-11 rounded-full flex items-center justify-center">
                  <BellAlertIcon className="w-6 text-app" />
                </div>
                <div className="flex-1 pl-4">
                  <div className="text-[15px] font-medium mb-1">
                    {item.Title}
                  </div>
                  <div className="text-[13px]">
                    {item.IsSent ? (
                      <span className="text-success">Đã gửi</span>
                    ) : (
                      <span className="text-warning">Đang thực hiện</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </NotificationPicker>
        ))}
    </Page>
  );
}

export default NotificationAdmin;

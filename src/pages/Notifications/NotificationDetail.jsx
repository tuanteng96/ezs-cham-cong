import React from "react";
import PromHelpers from "../../helpers/PromHelpers";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  f7,
} from "framework7-react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "react-query";
import AuthAPI from "../../api/Auth.api";
import AssetsHelpers from "../../helpers/AssetsHelpers";

function NotificationDetail({ f7route }) {
  const queryClient = useQueryClient();
  const readMutation = useMutation({
    mutationFn: async (body) => {
      return AuthAPI.readNotification(body);
    },
  });

  let { data, refetch } = useQuery({
    queryKey: ["NotificationsDetail", f7route.params.id],
    queryFn: async () => {
      let { data } = await AuthAPI.detailNotification(f7route.params.id);
      return data?.data ? data?.data[0] : null;
    },
    onSuccess: (data) => {
      f7.dialog.close();
      if (!data?.IsReaded) {
        if (window.PlatformId === "IOS") {
          PromHelpers.SET_BADGE();
        }

        if (!data?.Title.includes("(dự kiến)")) {
          const dataPost = new FormData();
          dataPost.append("ids", data?.ID);
          readMutation.mutate(dataPost, {
            onSuccess: () => {
              queryClient.invalidateQueries(["Notifications"]);
            },
          });
        }
      }
    },
    enabled: Boolean(f7route.params.id),
  });

  const formatHtmlString = (htmlString) => {
    const oembedRegex = /<oembed[^>]*>/g;
    const oembedMatch = htmlString.match(oembedRegex);
    if (oembedMatch) {
      const oembedUrl = oembedMatch[0].match(/url="([^"]*)"/)[1];
      const iframeElement = `<iframe class="!w-full min-h-[180px]" src="${oembedUrl}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      htmlString = htmlString.replace(oembedRegex, iframeElement);
    }
    return htmlString
  };

  return (
    <Page
      className="bg-white"
      name="NotificationsDetail"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) =>
        refetch().then(() => done())
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
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="p-4">
        <div className="mb-4 text-base font-semibold">{data?.Title}</div>
        <div className="font-light leading-6">
          {data?.Thumbnail && (
            <div>
              <img
                className="w-full rounded-lg"
                src={AssetsHelpers.toAbsoluteUrl(data?.Thumbnail, "")}
                alt={data?.Title}
              />
            </div>
          )}
          {data?.Body && <div className="mt-4">{data?.Body}</div>}
          {data?.Content && (
            <div
              className="mt-4 reset-content"
              dangerouslySetInnerHTML={{ __html: formatHtmlString(data?.Content) }}
            ></div>
          )}
        </div>
      </div>
    </Page>
  );
}

export default NotificationDetail;

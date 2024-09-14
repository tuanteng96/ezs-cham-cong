import React, { useRef } from "react";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Subnavbar,
} from "framework7-react";
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  PhotoIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ArticleAPI from "../../../../api/Article.api";
import { useInfiniteQuery } from "react-query";
import ArrayHelpers from "../../../../helpers/ArrayHelpers";
import PromHelpers from "../../../../helpers/PromHelpers";
import { ArticlePicker } from "../../components";
import NoFound from "../../../../components/NoFound";
import { GridGallery } from "../../../../components";

function Article({ f7router }) {
  const allowInfinite = useRef(true);
  const articleQuery = useInfiniteQuery({
    queryKey: ["Articles"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await ArticleAPI.get({
        filter: {
          key: "",
          cateid: 835,
        },
        pi: pageParam,
        ps: 10,
      });
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    articleQuery?.data?.pages,
    "list"
  );

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    articleQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page
      name="Article"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => articleQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={articleQuery.isLoading}
      onInfinite={loadMore}
      style={{
        "--f7-subnavbar-height": "55px",
      }}
    >
      <Navbar innerClass="!px-0" className="text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Viết bài blogs</NavTitle>
        <NavRight className="h-full">
          <Link
            href="/admin/article/add/"
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <PlusIcon className="w-7" />
          </Link>
        </NavRight>
        <Subnavbar
          className="after:hidden border-b-[2px]"
          style={{
            "--f7-subnavbar-height": "55px",
          }}
        >
          <div
            className="flex items-center justify-between w-full h-full px-2"
            onClick={() => f7router.navigate(`/admin/article/add/`)}
          >
            <div className="relative mr-3 overflow-hidden bg-gray-100 rounded-full w-9 h-9">
              <svg
                className="absolute text-gray-400 w-11 h-11 -left-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-[15px] text-[#999] bg-[#efeff3] flex-1 h-9 rounded-3xl px-5 flex items-center">
              Bắt đầu viết bài ?
            </div>
            <div className="ml-4 text-success">
              <PhotoIcon className="w-6" />
            </div>
          </div>
        </Subnavbar>
      </Navbar>
      {articleQuery.isLoading && (
        <div>
          {Array(2)
            .fill()
            .map((_, index) => (
              <div
                className="flex flex-col p-4 mb-1.5 bg-white last:mb-0 animate-pulse"
                key={index}
              >
                <div className="flex">
                  <div className="w-16 aspect-square">
                    <div className="flex items-center justify-center w-full h-16 bg-gray-300 rounded-full dark:bg-gray-700">
                      <svg
                        className="w-6 h-6 text-gray-200 dark:text-gray-600"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 18"
                      >
                        <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 px-4 pt-1 text-base font-semibold">
                    <div className="w-full h-3 mb-2 bg-gray-200 rounded-full"></div>
                    <div className="w-2/4 h-3 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex items-baseline justify-end w-12">
                    <EllipsisHorizontalIcon className="w-7" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full h-2 mb-2 bg-gray-200 rounded-full"></div>
                  <div className="w-full h-2 mb-2 bg-gray-200 rounded-full"></div>
                  <div className="w-2/4 h-2 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
        </div>
      )}
      {!articleQuery.isLoading && (
        <>
          {Lists &&
            Lists.length > 0 &&
            Lists.map((item, index) => (
              <div
                className="flex flex-col p-4 mb-2.5 bg-white last:mb-0"
                key={index}
              >
                <div className="mb-3">
                  <GridGallery photos={[...item.PhotoList]} />
                </div>
                <div className="flex">
                  <div className="flex-1 pr-4 text-base font-semibold">
                    {item.Title}
                  </div>
                  <ArticlePicker item={item} f7router={f7router}>
                    {({ open }) => (
                      <div
                        className="flex items-baseline justify-end w-12"
                        onClick={open}
                      >
                        <EllipsisHorizontalIcon className="w-7" />
                      </div>
                    )}
                  </ArticlePicker>
                </div>
                <div className="mt-2">
                  <div
                    className="text-gray-700 line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: item.Desc,
                    }}
                  />
                </div>
              </div>
            ))}
          {(!Lists || Lists.length === 0) && (
            <NoFound
              Title="Không có kết quả nào."
              Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
            />
          )}
        </>
      )}
    </Page>
  );
}

export default Article;

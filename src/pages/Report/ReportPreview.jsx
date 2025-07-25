import React from "react";
import {
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import PromHelpers from "../../helpers/PromHelpers";
import IframeComm from "react-iframe-comm";

function ReportPreview({ f7router }) {
  const Auth = useStore("Auth");
  const StockRights = useStore("StockRights");
  const RightTree = useStore("RightTree");
  const Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  return (
    <Page
      name="report-preview"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
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
        <NavTitle>Báo cáo tổng quan</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <IframeComm
        attributes={{
          src: `${Brand?.Domain}/Admin/Reports/index.html`,
          width: "100%",
          height: "100%",
          frameBorder: 0,
        }}
        postMessageData={JSON.stringify({
          Info: {
            ...Auth?.Info,
            CrStockID: CrStocks?.ID,
            Stocks: StockRights || Auth?.Info?.StockRights,
            rightsSum: Auth?.Info?.rightsSum,
            rightTree: RightTree || Auth?.Info?.rightTree,
            token: Auth?.token,
          },
          token: Auth?.token,
          isApp: true,
        })}
        handleReady={() => {
          if (f7.views.main.router.url === "/report-preview/") {
            f7.dialog.close();
          }
        }}
      />
    </Page>
  );
}

ReportPreview.propTypes = {};

export default ReportPreview;

import React from "react";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Popover,
  f7,
  useStore,
} from "framework7-react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  ChevronLeftIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

function PosInvoiceNew(props) {
  return (
    <Page
      noSwipeback
      className="bg-[var(--f7-page-bg-color)]"
      name="Pos-new-invoice"
      onPageBeforeIn={() => {
        PromHelpers.STATUS_BAR_COLOR("light");
      }}
      noToolbar
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
        <NavTitle>Tạo hoá đơn mới</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="p-4">
        <div className="p-4 bg-white rounded-xl">
          <div className="flex items-center gap-3 pb-3 mb-3 border-b last:pb-0 last:mb-0 last:border-0">
            <div className="w-9 h-9 bg-[#f1f1f1] rounded-full text-[#5b6067] flex items-center justify-center">
              <UserPlusIcon className="w-5" />
            </div>
            <div className="text-[15px]">Khách lẻ / Khách vãng lai</div>
          </div>
          <div className="flex items-center gap-3 pb-3 mb-3 border-b last:pb-0 last:mb-0 last:border-0">
            <div className="w-9 h-9 bg-[#f1f1f1] rounded-full text-[#5b6067] flex items-center justify-center">
              <UsersIcon className="w-5" />
            </div>
            <div>Chọn khách hàng</div>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default PosInvoiceNew;

import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  useStore,
} from "framework7-react";
import React from "react";
import PromHelpers from "../../helpers/PromHelpers";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";
import store from "../../js/store";
import AssetsHelpers from "@/helpers/AssetsHelpers";

function Account({ f7router }) {
  const Auth = useStore("Auth");

  const logout = () => {
    store.dispatch("logout", () => f7router.navigate("/login/"));
  };

  const renderMemberGroups = () => {
    if (Auth?.ID === 1) {
      return "Administrator";
    } else if (Auth?.GroupTitles.length > 0) {
      return Auth.GroupTitles.join(", ");
    } else {
      return "Nhân viên";
    }
  };

  return (
    <Page onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}>
      <Navbar innerClass="text-white !px-0" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Thông tin cá nhân</NavTitle>
        <NavRight className="h-full">
          <div
            className="flex items-center justify-center w-12 h-full"
            onClick={logout}
          >
            <PowerIcon className="w-5" />
          </div>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="p-4">
        <div className="flex items-center p-4 mb-4 bg-white last:mb-0 rounded-xl">
          <div className="h-12 w-14">
            {Auth?.Avatar ? (
              <div className="w-12 h-full overflow-hidden rounded-full">
                <img
                  src={AssetsHelpers.toAbsoluteUrl(Auth?.Avatar)}
                  alt={Auth?.FullName}
                />
              </div>
            ) : (
              <div className="relative w-12 h-full overflow-hidden bg-gray-100 rounded-full">
                <svg
                  className="absolute text-gray-400 w-14 h-14 -bottom-2 left-2/4 -translate-x-2/4"
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
            )}
          </div>
          <div className="flex-1 pl-2">
            <div className="text-base font-medium">{Auth?.FullName}</div>
            <div className="capitalize text-muted">{renderMemberGroups()}</div>
          </div>
        </div>
        <div className="mb-4 last:mb-0">
          <div className="mb-1.5 font-medium text-muted">Thông tin</div>
          <div className="py-2 bg-white rounded">
            <div className="px-4 py-2">
              <div className="text-muted">Họ và tên</div>
              <div className="mt-px font-medium">{Auth?.FullName}</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-muted">Nhóm</div>
              <div className="mt-px font-medium capitalize">
                {renderMemberGroups()}
              </div>
            </div>
            <div className="px-4 py-2">
              <div className="text-muted">Cơ sở</div>
              <div className="mt-px font-medium capitalize">
                {Auth?.StockInfo?.Title || "Chưa có"}
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 last:mb-0">
          <div className="mb-1.5 font-medium text-muted">Tài khoản</div>
          <div className="bg-white rounded">
            <Link
              noLinkClass
              href="/account/change-password/"
              className="relative flex items-center p-4 border-b"
            >
              <div className="flex items-center">
                <LockClosedIcon className="w-5" />
                <span className="pt-1.5 pl-2.5">Đổi mật khẩu</span>
              </div>
              <ChevronRightIcon className="absolute w-5 right-4 top-2/4 -translate-y-2/4 text-muted" />
            </Link>
            <div
              className="relative p-4 border-b last:border-none text-danger"
              onClick={logout}
            >
              <div className="flex items-center">
                <PowerIcon className="w-5" />
                <span className="pt-1 pl-2.5">Đăng xuất</span>
              </div>
              <ChevronRightIcon className="absolute w-5 right-4 top-2/4 -translate-y-2/4 text-muted" />
            </div>
            <div className="relative p-4 border-b last:border-none text-muted">
              <div className="flex items-center justify-between">
                <span>Phiên bản ứng dụng</span>
                <span className="uppercase">
                  {window?.VERISON || "Developer"}
                </span>
              </div>
            </div>
            {/* <div className="relative p-4 border-b last:border-none text-danger">
                <div className="flex items-center">
                  <TrashIcon className="w-5" />
                  <span className="pt-1 pl-2.5">Xoá tài khoản</span>
                </div>
                <ChevronRightIcon className="absolute w-5 right-4 top-2/4 -translate-y-2/4 text-muted" />
              </div> */}
          </div>
        </div>
      </div>
    </Page>
  );
}

export default Account;

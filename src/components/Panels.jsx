import { ChevronRightIcon, PowerIcon } from "@heroicons/react/24/outline";
import { Link, Panel, f7, f7ready, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import {
  Menu,
  MenuItem,
  Sidebar,
  SubMenu,
  sidebarClasses,
} from "react-pro-sidebar";
import store from "../js/store";
import Dom7 from "dom7";
import clsx from "clsx";
import { RolesHelpers } from "../helpers/RolesHelpers";

function CSubMenu({ children, defaultOpen, ...props }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

  const handleMenuToggle = () => {
    setOpen(!open);
  };

  return (
    <SubMenu
      {...props}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={handleMenuToggle}
    >
      {children}
    </SubMenu>
  );
}

function Panels(props) {
  let Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  const [pathname, setPathname] = useState("");

  const { notification, report, cong_ca } = RolesHelpers.useRoles({
    nameRoles: ["notification", "report", "cong_ca"],
    auth: Auth,
    CrStocks,
  });

  const [Menus, setMenus] = useState([]);

  useEffect(() => {
    f7ready((f7) => {
      f7.views.main.on("routeChange", (newRoute) => {
        setPathname(newRoute.url);
      });
    });
  }, []);

  useEffect(() => {
    setMenus([
      {
        Title: "Trang chủ",
        Link: "/home/",
        ActiveLink: ["/", "/home/"],
        active: true,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: true,
      },
      {
        Title: "Quản lý thông báo",
        ActiveLink: ["/admin/notifications/", "/admin/notifications/add/"],
        active: true,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        SubMenu: [
          {
            Title: "Tạo mới",
            Link: "/admin/notifications/add/",
            active: false,
          },
          {
            Title: "Danh sách",
            Link: "/admin/notifications/",
            active: false,
          },
        ],
        hasRight: notification?.hasRight || false,
      },
      {
        Title: "Chấm công",
        ActiveLink: ["/timekeeping/", "/take-break/"],
        SubMenu: [
          {
            Title: "Bảng công",
            Link: "/timekeeping/",
            active: false,
          },
          {
            Title: "Xin nghỉ",
            Link: "/take-break/",
            active: false,
          },
        ],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: true,
      },
      {
        Title: "Kỹ thuật viên",
        ActiveLink: ["/technicians/", "/technicians/?Type=dl"],
        SubMenu: [
          {
            Title: "Dịch vụ",
            Link: "/technicians/",
            active: false,
          },
          {
            Title: "Đặt lịch",
            Link: "/technicians/?Type=dl",
            active: false,
          },
        ],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: true,
      },
      {
        Title: "Thông báo",
        Link: "/notifications/",
        ActiveLink: ["/notifications/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: true,
      },
      {
        Title: "Bảng lương",
        Link: "/statistical/",
        ActiveLink: ["/statistical/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: true,
      },
      {
        Title: "Báo cáo",
        Link: "/report/",
        ActiveLink: ["/report/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: report?.hasRight || false,
      },
      {
        Title: "Tiện ích",
        ActiveLink: ["/admin/utility/", "/admin/utility/timekeeping-setting/"],
        SubMenu: [
          {
            Title: "Cài đặt Công ca - Wifi",
            Link: "/admin/utility/timekeeping-setting/",
            active: false,
            hasRight: cong_ca?.hasRight || false,
          },
        ],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: cong_ca?.hasRight || false,
      },
      {
        Title: "Thông tin cá nhân",
        Link: "/account/",
        ActiveLink: ["/account/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: true,
      },
    ]);
  }, [Auth, CrStocks]);

  const logout = () => {
    store.dispatch("logout", () => {
      f7.views.main.router.navigate("/login/");
    });
  };

  const onPanelOpen = () => {
    setMenus((prevState) =>
      prevState.map((x) => ({
        ...x,
        active:
          pathname === "/"
            ? x.Link === "/home/"
            : x.ActiveLink.includes(pathname),
        SubMenu: x.SubMenu
          ? x.SubMenu.map((s) => ({
              ...s,
              active: pathname === s.Link,
            }))
          : null,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
      }))
    );
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
    <Panel
      floating
      swipeOnlyClose
      containerEl="#panel-page"
      id="panel-app"
      onPanelOpen={onPanelOpen}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 bg-white border-b">
          <div className="w-11 h-11">
            <div className="relative h-full overflow-hidden bg-gray-100 w-11 rounded-xl">
              <svg
                className="absolute w-12 h-12 text-gray-400 -bottom-2 left-2/4 -translate-x-2/4"
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
          </div>
          <div className="flex-1 pl-3">
            <div className="font-medium">{Auth?.FullName}</div>
            <div className="capitalize text-muted">{renderMemberGroups()}</div>
          </div>
        </div>
        <div className="overflow-auto grow bg-[#f7f9fa]">
          <Sidebar
            width="var(--f7-panel-width)"
            className="!border-0"
            rootStyles={{
              [`.${sidebarClasses.container}`]: {
                backgroundColor: "#f7f9fa",
              },
            }}
          >
            <Menu
              renderExpandIcon={({ open }) => (
                <ChevronRightIcon
                  className={clsx("w-4 transition", open && "rotate-90")}
                />
              )}
              menuItemStyles={{
                button: ({ level, active, open }) => {
                  if (level === 0) {
                    return {
                      color: active ? "var(--ezs-theme-color)" : undefined,
                      background: active ? "#f3f3f3" : undefined,
                    };
                  }
                  if (level === 1) {
                    return {
                      color: active ? "#fff" : undefined,
                      background: active ? "var(--ezs-theme-color)" : undefined,
                    };
                  }
                },
              }}
            >
              {Menus &&
                Menus.filter((x) => x.hasRight).map((menu, index) =>
                  menu?.SubMenu ? (
                    <CSubMenu
                      label={menu.Title}
                      className="font-medium border-b"
                      key={menu.Id}
                      active={menu.active}
                      defaultOpen={menu.active}
                    >
                      {menu.SubMenu.map((sub, i) => (
                        <MenuItem
                          className="font-normal border-t"
                          component={<Link href={sub.Link} />}
                          key={i}
                          onClick={() => f7.panel.close(Dom7("#panel-app"))}
                          active={sub.active}
                        >
                          {sub.Title}
                        </MenuItem>
                      ))}
                    </CSubMenu>
                  ) : (
                    <MenuItem
                      onClick={() => f7.panel.close(Dom7("#panel-app"))}
                      component={<Link href={menu.Link} />}
                      className="font-medium border-b"
                      active={menu.active}
                      key={index}
                    >
                      {menu.Title}
                    </MenuItem>
                  )
                )}
            </Menu>
          </Sidebar>
        </div>
        <div className="flex items-center justify-between h-[50px] px-5 border-t">
          <div
            className="flex items-center h-full text-danger"
            onClick={logout}
          >
            <PowerIcon className="w-5" />
            <span className="pl-2">Đăng xuất</span>
          </div>
          <div className="text-sm uppercase text-muted">
            {window?.VERISON || "Developer"}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default Panels;

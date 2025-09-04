import {
  BellIcon,
  ChevronRightIcon,
  EllipsisHorizontalCircleIcon,
  HomeIcon,
  PencilSquareIcon,
  PowerIcon,
  PresentationChartBarIcon,
  TvIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Link, Panel, f7, f7ready, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
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
import AssetsHelpers from "@/helpers/AssetsHelpers";

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
      rootStyles={{
        [".ps-menu-icon"]: {
          width: "auto",
          minWidth: "auto",
        },
      }}
    >
      {children}
    </SubMenu>
  );
}

function Panels(props) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let Stocks = useStore("Stocks");
  const CrStocks = useStore("CrStocks");
  const [pathname, setPathname] = useState("");

  const actionsToPopover = useRef(null);
  const buttonToPopoverWrapper = useRef(null);

  const {
    notification,
    report,
    cong_ca,
    article,
    pos_mng,
    printConfig,
    usrmng,
  } = RolesHelpers.useRoles({
    nameRoles: [
      "notification",
      "report",
      "cong_ca",
      "article",
      "pos_mng",
      "printConfig",
      "usrmng",
    ],
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
        Icon: <HomeIcon className="w-5" />,
      },
      {
        Title: "Thu ngân",
        Link: "/admin/pos/clients/",
        ActiveLink: [
          "/admin/pos/calendar/",
          "/admin/pos/clients/",
          "/admin/pos/orders/",
          "/admin/pos/processings/",
          "/admin/pos/invoice-processings/",
        ],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        Icon: <TvIcon className="w-5" />,
        hasRight: pos_mng?.hasRight || false,
      },
      {
        Title: "Quản lý nhân viên",
        ActiveLink: ["/admin/members/", "/admin/timekeepings/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: usrmng?.hasRight || cong_ca?.hasRight || false,
        Icon: <UserGroupIcon className="w-5" />,
        SubMenu: [
          {
            Title: "Danh sách nhân viên",
            Link: "/admin/members/",
            active: false,
            hasRight: usrmng?.hasRight,
          },
          {
            Title: "Quản lý chấm công",
            Link: "/admin/timekeepings/",
            active: false,
            hasRight: cong_ca?.hasRight,
          },
        ],
      },
      {
        Title: "Quản lý lớp",
        ActiveLink: ["/osclass/", "/courses/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: true,
        Icon: <Squares2X2Icon className="w-5" />,
        SubMenu: [
          {
            Title: "Quản lý lớp tập",
            Link: "/osclass/",
            active: false,
            hasRight: Brand?.Global?.Admin?.lop_hoc_pt,
          },
          {
            Title: "Quản lý đào tạo",
            Link: "/courses/",
            active: false,
            hasRight: true,
          },
        ],
      },
      {
        Title: "Báo cáo",
        ActiveLink: ["/report/", "/report-preview/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: report?.hasRight || true,
        Icon: <PresentationChartBarIcon className="w-5" />,
        SubMenu: [
          {
            Title: "Tổng quan",
            Link: "/report-preview/",
            active: false,
            hasRight: true,
          },
          {
            Title: "Chi tiết",
            Link: "/report/",
            active: false,
            hasRight: true,
          },
        ],
      },
      {
        Title: "Gửi tin nhắn APP",
        Link: "/admin/notifications/add/",
        ActiveLink: ["/admin/notifications/", "/admin/notifications/add/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        Icon: <BellIcon className="w-5" />,
        hasRight: notification?.hasRight || false,
      },
      {
        Title: "Viết bài blogs",
        Link: "/admin/article/",
        Icon: <PencilSquareIcon className="w-5" />,
        ActiveLink: ["/admin/article/", "/admin/banner/"],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: article?.hasRight || false,
      },
      {
        Title: "Tiện ích",
        Icon: <EllipsisHorizontalCircleIcon className="w-5" />,
        ActiveLink: ["/admin/utility/", "/admin/utility/printerip-setting/"],
        SubMenu: [
          {
            Title: "Cài đặt IP máy in",
            Link: "/admin/utility/printerip-setting/",
            active: false,
            hasRight: printConfig?.hasRight || false,
          },
        ],
        active: false,
        Id: f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
        hasRight: cong_ca?.hasRight || printConfig?.hasRight || false,
      },
    ]);
  }, [Auth, CrStocks, Brand]);

  useEffect(() => {
    return () => {
      if (actionsToPopover.current) {
        actionsToPopover.current.destroy();
      }
    };
  }, []);

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
          pathname === "/" || pathname === ""
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

  const splitName = (name) => {
    if (!name) return "";
    let newName = name.split(" ");
    if (newName.length > 3) {
      let nameStr = [];
      for (const [i, value] of newName.entries()) {
        if (i === 0 || i === newName.length - 1) {
          nameStr.push(`${value} `);
        } else if (i === newName.length - 2) {
          nameStr.push(`${value.charAt(0)} `);
        } else {
          nameStr.push(`${value.charAt(0)}.`);
        }
      }

      return nameStr.join("");
    } else {
      return name;
    }
  };

  const openChooseStocks = () => {
    let newButtons = Stocks
      ? Stocks.map((x) => ({
          text: x.Title,
          close: false,
          disabled: CrStocks?.ID === x.ID,
          onClick: (actions, e) => {
            store.dispatch("setCrStocks", x).then(() => actions.close());
          },
        }))
      : [];
    if (newButtons && newButtons.length > 4) {
      f7.views.main.router.navigate(`/stocks/`);
    } else {
      actionsToPopover.current = f7.actions.create({
        buttons: [
          ...newButtons,
          {
            text: "Đóng",
            color: "red",
          },
        ],
        targetEl:
          buttonToPopoverWrapper.current.querySelector(".button-to-popover"),
      });

      if (newButtons && newButtons.length > 0) {
        actionsToPopover.current.open();
      }
    }
    setTimeout(() => {
      f7.panel.close("#panel-app");
    }, 10);
  };
  window.f7panel = f7.panel;
  return (
    <Panel
      floating
      swipeOnlyClose
      containerEl="#panel-page"
      id="panel-app"
      onPanelOpen={onPanelOpen}
      // onPanelClosed={() => {
      //   f7.panel.destroy();
      // }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 bg-white border-b">
          <Link
            onClick={() => f7.panel.close("#panel-app")}
            href="/account/"
            noLinkClass
            className="w-11 h-11"
          >
            {Auth?.Avatar ? (
              <div className="flex items-center w-full h-full overflow-hidden bg-gray-100 rounded-xl">
                <img
                  src={AssetsHelpers.toAbsoluteUrl(Auth?.Avatar)}
                  alt={Auth?.FullName}
                  onError={(e) =>
                    (e.target.src = AssetsHelpers.toAbsoluteUrlCore(
                      "/AppCore/images/blank.png",
                      ""
                    ))
                  }
                />
              </div>
            ) : (
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
            )}
          </Link>
          <div className="flex-1 pl-3" ref={buttonToPopoverWrapper}>
            <div className="font-medium">{splitName(Auth?.FullName)}</div>
            <Link
              noLinkClass
              className="flex text-primary"
              onClick={openChooseStocks}
            >
              <div className="truncate max-w-[150px]">{CrStocks?.Title}</div>
              <ChevronDownIcon className="w-4 ml-1" />
            </Link>
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
                      icon={menu.Icon}
                    >
                      {menu.SubMenu.filter((x) => x.hasRight).map((sub, i) => (
                        <MenuItem
                          className="font-normal border-t"
                          component={<Link href={sub.Link} />}
                          key={i}
                          onClick={() => f7.panel.close("#panel-app")}
                          active={sub.active}
                        >
                          {sub.Title}
                        </MenuItem>
                      ))}
                    </CSubMenu>
                  ) : (
                    <MenuItem
                      onClick={() => {
                        if (
                          Brand?.Domain === "https://app.facewashfox.com" &&
                          menu.Link === "/admin/pos/clients/"
                        ) {
                          f7.dialog.alert(
                            "Thương hiệu không hỗ trợ trên APP."
                          );
                        } else {
                          f7.panel.close("#panel-app");
                        }
                      }}
                      component={
                        <Link
                          href={
                            Brand?.Domain === "https://app.facewashfox.com" &&
                            menu.Link === "/admin/pos/clients/"
                              ? ""
                              : menu.Link
                          }
                        />
                      }
                      className="font-medium border-b"
                      active={menu.active}
                      key={index}
                    >
                      <div className="flex items-center">
                        {menu.Icon && <div className="mr-2">{menu.Icon}</div>}
                        <span>{menu.Title}</span>
                      </div>
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

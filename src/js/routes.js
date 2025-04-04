import { f7 } from "framework7-react";
import NotFoundPage from "../pages/404.jsx";

import BrandPage from "../pages/Brand/index.jsx";
import LoginPage from "../pages/Login/index.jsx";
import Timekeeping from "../pages/Timekeeping/index.jsx";
import Account from "../pages/Account/index.jsx";

import Technicians from "../pages/Technicians/index.jsx";
import TechniciansProfile from "../pages/Technicians/TechniciansProfile.jsx";
import TechniciansService from "../pages/Technicians/TechniciansService.jsx";
import TechniciansHistory from "../pages/Technicians/TechniciansHistory.jsx";

import Statistical from "../pages/Statistical/index.jsx";
import StatisticalDay from "@/pages/Statistical/StatisticalDay.jsx";

import ChangePasswordPage from "../pages/Account/ChangePassword.jsx";
import HomePage from "../pages/Home/index.jsx";
import TakeBreakPage from "../pages/TakeBreak/index.jsx";
import ReportPage from "../pages/Report/index.jsx";
import ReportPreviewPage from "../pages/Report/ReportPreview.jsx";
import NotificationsPage from "../pages/Notifications/index.jsx";
import NotificationDetailPage from "../pages/Notifications/NotificationDetail.jsx";

import NotificationAdminPage from "../pages/Admin/pages/Notifications/index.jsx";
import NotificationAddAdminPage from "../pages/Admin/pages/Notifications/Add.jsx";
import NotificationEditAdminPage from "../pages/Admin/pages/Notifications/Edit.jsx";

import ProcessingsPage from "../pages/Admin/pages/Processings/index.jsx";
import ArticlePage from "../pages/Admin/pages/Article/index.jsx";
import ArticleAddAdminPage from "../pages/Admin/pages/Article/Add.jsx";
import PosAdminPage from "@/pages/Admin/pages/Pos/index.jsx";
import PosClientManagePage from "@/pages/Admin/pages/Pos/PosClientManage.jsx";
import PosAddProdPage from "@/pages/Admin/pages/Pos/PosAddProd.jsx";
import PosClientDiaryPage from "@/pages/Admin/pages/Pos/PosClientDiary.jsx";
import PosClientServicesPage from "@/pages/Admin/pages/Pos/PosClientServices.jsx";
import PosClientBooksPage from "@/pages/Admin/pages/Pos/PosClientBooks.jsx";
import PosClientWalletPage from "@/pages/Admin/pages/Pos/PosClientWallet.jsx";
import PosClientDebtPage from "@/pages/Admin/pages/Pos/PosClientDebt.jsx";
import PosClientCardPage from "@/pages/Admin/pages/Pos/PosClientCard.jsx";
import PosCreateOldCardPage from "@/pages/Admin/pages/Pos/PosCreateOldCard.jsx";
import PosClientOrderPage from "@/pages/Admin/pages/Pos/PosClientOrder.jsx";
import PosClientPointsPage from "@/pages/Admin/pages/Pos/PosClientPoints.jsx";
import ClientBirthDayPage from "@/pages/Admin/pages/Clients/ClientBirthDay.jsx";

import ClientsAdminPage from "@/pages/Admin/pages/Clients/index.jsx";
import AddEditClientsPage from "@/pages/Admin/pages/Clients/AddEditClients.jsx";

import InvoiceProcessingsPage from "@/pages/Admin/pages/InvoiceProcessings/index.jsx";

import OrderViewAdminPage from "@/pages/Admin/pages/Orders/OrderView.jsx";
import OrdersAdminPage from "@/pages/Admin/pages/Orders/index.jsx";
import OrderBonusSalesCommissionPage from "@/pages/Admin/pages/Orders/OrderBonusSalesCommission.jsx";
import OrderBonusSalesCommissionAutoPage from "@/pages/Admin/pages/Orders/OrderBonusSalesCommissionAuto.jsx";
import OrderSplitPaymentsPage from "@/pages/Admin/pages/Orders/OrderSplitPayments.jsx";
import OrderReturnPage from "@/pages/Admin/pages/Orders/OrderReturn.jsx";

import PrinterIPSettingsPage from "@/pages/Admin/pages/Utility/PrinterIPSettings.jsx";

import PosLocksCalendarPage from "@/pages/Admin/pages/Pos/PosLocksCalendar.jsx";
import PosRoomsCalendarPage from "@/pages/Admin/pages/Pos/PosRoomsCalendar.jsx";
import PosSettingsCalendarPage from "@/pages/Admin/pages/Pos/PosSettingsCalendar.jsx";
import PosCareSchedulePage from "@/pages/Admin/pages/Pos/PosCareSchedule.jsx";
import AddEditCalendarPage from "@/pages/Admin/pages/Pos/AddEditCalendar.jsx";
import EditOsCalendarPage from "@/pages/Admin/pages/Pos/EditOsCalendar.jsx";
import EditOsMaterialsPage from "@/pages/Admin/pages/Pos/EditOsMaterials.jsx";

import PrinterOrderPage from "@/pages/Admin/pages/Printers/PrinterOrder.jsx";
import PrinterServicePage from "@/pages/Admin/pages/Printers/PrinterService.jsx";

import TimekeepingsPage from "@/pages/Admin/pages/Timekeepings/index.jsx";
import TimekeepingsShiftPage from "@/pages/Admin/pages/Timekeepings/TimekeepingsShift.jsx";
import TimekeepingsWifiLocaitonPage from "@/pages/Admin/pages/Timekeepings/TimekeepingsWifiLocaiton.jsx";
import TimekeepingsMonthlyPage from "@/pages/Admin/pages/Timekeepings/TimekeepingsMonthly.jsx";
import TimekeepingsTakePage from "@/pages/Admin/pages/Timekeepings/TimekeepingsTake.jsx";
import TimekeepingsWorkPage from "@/pages/Admin/pages/Timekeepings/TimekeepingsWork.jsx";
import TimekeepingsUserPage from "@/pages/Admin/pages/Timekeepings/TimekeepingsUser.jsx";
import TimekeepingsPunishmentPage from "@/pages/Admin/pages/Timekeepings/TimekeepingsPunishment.jsx";

import StocksPage from "../pages/Stocks/index.jsx";

import CoursesPage from "../pages/Courses/index.jsx";
import AttendancePage from "../pages/Courses/Attendance.jsx";
import StudentPage from "../pages/Courses/Student.jsx";

import OsClassPage from "@/pages/OsClass/index.jsx";
import OsClassViewPage from "@/pages/OsClass/OsClassView.jsx";

import DebugPage from "@/pages/Debug/index.jsx";

var routes = [
  {
    path: "/",
    redirect: ({ resolve }) => {
      if (!f7.store.state.Brand && !f7.store.state.Auth) {
        resolve({
          url: "/brand/",
        });
      } else if (f7.store.state.Brand && !f7.store.state.Auth) {
        resolve({
          url: "/login/",
        });
      } else {
        resolve({
          url: "/home/",
        });
      }
    },
  },
  {
    path: "/home/",
    component: HomePage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/brand/",
    component: BrandPage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/login/",
    component: LoginPage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/timekeeping/",
    component: Timekeeping,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/take-break/",
    component: TakeBreakPage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/report/",
    //component: ReportPage,
    async: function ({ router, to, resolve }) {
      // App instance
      var app = router.app;
      if (router.url !== "/report/") {
        app.dialog.preloader("Đang tải báo cáo...");
      }

      resolve({
        component: ReportPage,
      });
    },
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/report-preview/",
    //component: ReportPage,
    async: function ({ router, to, resolve }) {
      // App instance
      var app = router.app;
      if (router.url !== "/report-preview/") {
        app.dialog.preloader("Đang tải báo cáo...");
      }

      resolve({
        component: ReportPreviewPage,
      });
    },
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/notifications/",
    component: NotificationsPage,
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "view/:id/",
        //component: NotificationDetailPage,
        async: function ({ router, to, resolve }) {
          // App instance
          var app = router.app;
          app.dialog.preloader("Đang tải...");

          resolve({
            component: NotificationDetailPage,
          });
        },
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/admin/",
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "processings/",
        component: ProcessingsPage,
        options: {
          transition: "f7-cover",
        },
        routes: [],
      },
      {
        path: "notifications/",
        component: NotificationAdminPage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "add/",
            component: NotificationAddAdminPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "edit/:id/",
            component: NotificationEditAdminPage,
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "utility/",
        component: PrinterIPSettingsPage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "printerip-setting/",
            component: PrinterIPSettingsPage,
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "article/",
        component: ArticlePage,
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "article/:id/",
        //component: ArticleAddAdminPage,
        options: {
          transition: "f7-cover-v",
        },
        async: function ({ router, to, resolve }) {
          var app = router.app;
          var isAddMode = to.params.id === "add";
          if (!isAddMode) {
            app.dialog.preloader("Đang tải ...");
          }
          resolve({
            component: ArticleAddAdminPage,
          });
        },
      },
      {
        path: "pos/calendar",
        component: PosAdminPage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "locks",
            component: PosLocksCalendarPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "rooms",
            component: PosRoomsCalendarPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "care-schedule",
            component: PosCareSchedulePage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "setting",
            component: PosSettingsCalendarPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "add",
            component: AddEditCalendarPage,
            options: {
              transition: "f7-cover-v",
            },
          },
          {
            path: "os",
            component: EditOsCalendarPage,
            options: {
              transition: "f7-cover-v",
            },
            routes: [
              {
                path: "materials/:id",
                component: EditOsMaterialsPage,
                options: {
                  transition: "f7-cover",
                },
              },
            ],
            // beforeEnter: function ({ resolve, reject }) {
            //   var router = this;
            //   router.app.dialog.password(
            //     "Đúng mật khẩu thì vào anh Ngọc nhé :)))",
            //     (password) => {
            //       if (password === "020202") {
            //         resolve();
            //       } else {
            //         reject();
            //       }
            //     }
            //   );
            // },
          },
        ],
      },
      {
        path: "pos/clients",
        component: ClientsAdminPage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "birthday",
            component: ClientBirthDayPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: ":id",
            component: AddEditClientsPage,
            options: {
              transition: "f7-cover-v",
            },
          },
          {
            path: "edit/:id",
            component: AddEditClientsPage,
            options: {
              transition: "f7-cover-v",
            },
          },
        ],
      },
      {
        path: "pos/orders",
        component: OrdersAdminPage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "/view/:id",
            component: OrderViewAdminPage,
            options: {
              transition: "f7-cover",
            },
            routes: [
              {
                path: "/bonus-sales-commission",
                component: OrderBonusSalesCommissionPage,
                options: {
                  transition: "f7-cover-v",
                },
              },
              {
                path: "/bonus-sales-commission-auto",
                component: OrderBonusSalesCommissionAutoPage,
                options: {
                  transition: "f7-cover-v",
                },
              },
              {
                path: "/split-payments",
                component: OrderSplitPaymentsPage,
                options: {
                  transition: "f7-cover-v",
                },
              },
              {
                path: "/return",
                component: OrderReturnPage,
                options: {
                  transition: "f7-cover",
                },
              },
            ],
          },
        ],
      },
      {
        path: "pos/invoice-processings",
        component: InvoiceProcessingsPage,
        options: {
          transition: "f7-cover",
        },
        routes: [],
      },
      {
        path: "pos/manage/:id",
        component: PosClientManagePage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "/diary",
            component: PosClientDiaryPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/services",
            component: PosClientServicesPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/books",
            component: PosClientBooksPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/wallet",
            component: PosClientWalletPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/debt",
            component: PosClientDebtPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/card",
            component: PosClientCardPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/points",
            component: PosClientPointsPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/order",
            component: PosClientOrderPage,
            options: {
              transition: "f7-cover",
            },
          },

          {
            path: "/create-old-card",
            component: PosCreateOldCardPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/add-prods",
            component: PosAddProdPage,
            options: {
              transition: "f7-cover-v",
            },
          },
        ],
      },
      {
        path: "printers/",
        routes: [
          {
            path: "/order/:id",
            component: PrinterOrderPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/service/:id",
            component: PrinterServicePage,
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "timekeepings/",
        component: TimekeepingsPage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "/shift",
            component: TimekeepingsShiftPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/wifi-location",
            component: TimekeepingsWifiLocaitonPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/monthly",
            component: TimekeepingsMonthlyPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/take-break",
            component: TimekeepingsTakePage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/work",
            component: TimekeepingsWorkPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/punishment",
            component: TimekeepingsPunishmentPage,
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/:MemberID",
            component: TimekeepingsUserPage,
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/account/",
    component: Account,
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "change-password/",
        component: ChangePasswordPage,
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/courses/",
    component: CoursesPage,
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "attendance/:id",
        component: AttendancePage,
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "student/:id",
        component: StudentPage,
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/osclass/",
    component: OsClassPage,
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: ":id",
        component: OsClassViewPage,
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/technicians/",
    component: Technicians,
    options: {
      transition: "f7-cover",
    },

    routes: [
      {
        path: "profile/:memberid/:id/",
        component: TechniciansProfile,
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "service/:memberid/:id/:itemid",
        component: TechniciansService,
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "history/:memberid/",
        component: TechniciansHistory,
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/statistical/",
    component: Statistical,
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "day",
        component: StatisticalDay,
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/stocks/",
    component: StocksPage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/debug/",
    component: DebugPage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;

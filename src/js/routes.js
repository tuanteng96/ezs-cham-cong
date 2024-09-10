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

import ArticlePage from "../pages/Admin/pages/Article/index.jsx";
import ArticleAddAdminPage from "../pages/Admin/pages/Article/Add.jsx";

import TimekeepingSettingsPage from "../pages/Admin/pages/Utility/TimekeepingSettings.jsx";

import StocksPage from "../pages/Stocks/index.jsx";

import CoursesPage from "../pages/Courses/index.jsx";
import AttendancePage from "../pages/Courses/Attendance.jsx";
import StudentPage from "../pages/Courses/Student.jsx"

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
        component: TimekeepingSettingsPage,
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "timekeeping-setting/",
            component: TimekeepingSettingsPage,
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
  },
  {
    path: "/stocks/",
    component: StocksPage,
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

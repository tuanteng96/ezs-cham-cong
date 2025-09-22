import { data } from "dom7";
import http from "../helpers/http";

const AdminAPI = {
  listNotifications: ({ Pi = 1, Ps = 20 }) =>
    http.get(`/api/v3/noticalendar?cmd=get&Pi=${Pi}&Ps=${Ps}`),
  updateLatLngWifi: (body) =>
    http.post(`/api/v3/cate25@UpdateLatLng`, JSON.stringify(body)),
  listProcessings: ({ StockID, Token }) =>
    http.get(
      `/api/v3/usertask?cmd=list&stockid=${StockID}&loadId=2&from=&to=&token=${Token}&force=1`
    ),
  invoiceProcessings: ({
    MemberCheckInID,
    Token,
    pi = 1,
    ps = 15,
    StockID = "",
  }) =>
    http.get(
      `/services/preview.aspx?cmd=search_member&key=&typeSearch=sell&ps=${ps}&pi=${pi}&searchId=4&__MemberCheckin=${MemberCheckInID}&__MemberMoney=0&__MyNoti=0&__AllNoti=0&__Birth=0&__MBirth=0&__Cate=false&__HasOrderService=0&__MemberGroups=false&__StaffID=0&__StockID=${StockID}&__Source=&__Tags=`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  ClientBirthDay: ({ StockID = "", Token = "", force = false }) =>
    http.get(
      `/api/v3/MBirth@get?stockid=${StockID}${force ? "&force=1" : ""}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  ClientBirthDayCount: ({ Token }) =>
    http.get(`/api/v3/MBirth@sum`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  doPayedProcess: ({ bodyFormData, Token, StockID }) =>
    http.post(
      `/api/v3/usertask?cmd=doSmsPayed&stockid=${StockID}`,
      bodyFormData,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  doNotiProcess: ({ bodyFormData, Token }) =>
    http.post(`/api/v3/usertask?cmd=doNoti`, bodyFormData, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  doContactProcess: ({ bodyFormData, Token }) =>
    http.post(`/api/v3/usertask?cmd=doRead`, bodyFormData, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  doQrProcess: ({ data, Token }) =>
    http.post(`/api/v3/order23@SetPayCallback`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  doCancelBookProcess: ({ data, Token }) =>
    http.post(
      `/api/v3/mbookadmin?cmd=CancelDateAdminView`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  doBookProcess: ({ data, Token }) =>
    http.post(`/admin/smart.aspx?reply_noti=1`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  calendarBookings: ({
    From,
    To,
    status,
    UserIDs,
    StatusAtHome,
    StatusBook,
    MemberIDs,
    StatusMember,
    StockID,
    Token,
  }) =>
    http.get(
      `api/v3/mbookadmin?cmd=getbooks&memberid=${
        MemberIDs || ""
      }&from=${From}&to=${To}&stockid=${StockID || 0}&status=${
        status || ""
      }&UserServiceIDs=${UserIDs || ""}&StatusMember=${
        StatusMember || ""
      }&StatusBook=${StatusBook || ""}&StatusAtHome=${StatusAtHome || ""}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  listMembersBooking: ({ StockID = 0, Key = "", All = "", Token }) =>
    http.get(
      `/api/gl/select2?cmd=user&roles=DV&crstockid=${StockID}&q=${Key}&All=${All}&includeSource=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectClient: ({ Key = "", CurrentStockID, MemberID, Token }) =>
    http.get(
      `/api/gl/select2?cmd=member&q=${Key}&CurrentStockID=${CurrentStockID}&member=${MemberID}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectServiceProtocol: ({ Key = "", CurrentStockID, Token }) =>
    http.get(
      `/api/gl/select2?cmd=prod&onstock=${CurrentStockID}&only_root=1&_type=query&q=${Key}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectMembers: ({ Key = "", CurrentStockID, Token }) =>
    http.get(
      `/api/gl/select2?cmd=user&crstockid=${CurrentStockID}&q=${Key}&all=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectMembersServices: ({ Key = "", CurrentStockID, Token }) =>
    http.get(
      `/api/gl/select2?cmd=user&roles=DV&crstockid=${CurrentStockID}&q=${Key}&all=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectMaterials: ({ Key = "", Token, Catenames = "nvl" }) =>
    http.get(
      `/api/gl/select2?cmd=prod&cate_name=${Catenames}&includeSource=1&term=a&_type=query&q=${Key}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectMaterialsFromCard: ({ Key = "", Token }) =>
    http.get(
      `/api/gl/select2?cmd=prod&cate_name=dich_vu&includeSource=1&combo=1&_type=query&q=${Key}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectServicesTransfer: ({ Key = "", Token }) =>
    http.get(
      `/api/gl/select2?cmd=prod&service_1=1&ignore_all=1&includeSource=1&_type=query&q=${Key}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectServicesOsClass: ({ data, Token }) =>
    http.post(`/api/v3/OS25@Min`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  selectMembersCharge: ({ Key, Token }) =>
    http.get(
      `/api/gl/select2?cmd=user&rightSegs=pos_mng%7CReadApp%7Cpos_mng&_type=query&q=${Key}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectProductCardClient: ({ Key = "", Token }) =>
    http.get(
      `/api/gl/select2?cmd=prod&cate_name=san_pham&ignore_all=1&q=&ignore_emptystock=1&q=${Key}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectServiceCardClient: ({ Key = "", Token }) =>
    http.get(
      `/api/gl/select2?cmd=prod&takes=service&_type=query&ignore_all=1&ignore_emptystock=1&q=${Key}&includeSource=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectMoneyCardClient: ({ Key = "", Token }) =>
    http.get(
      `/api/gl/select2?cmd=prod&cate_name=the_tien&_type=query&ignore_all=1&ignore_emptystock=1&q=${Key}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  selectCashClassify: ({ Token }) =>
    http.get(`/api/gl/select2?cmd=cash_customtype&_type=query`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  selectCashMethod: ({ Token }) =>
    http.get(`/api/gl/select2?cmd=methods&_type=query`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  createOldCardClient: ({ data, Token }) =>
    http.post(`/api/v3/Import24@MemberDones`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  createMemberBooking: ({ data, Token, StockID }) =>
    http.post(
      `/api/v3/member23?cmd=add&stockid=${StockID}`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  addBookings: ({ data, Token, CrStockID }) =>
    http.post(
      `/api/v3/mbookadmin?cmd=AdminBooking&CurrentStockID=${CrStockID}`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  checkinMember: ({ CheckIn, Token }) =>
    http.post(`/services/preview.aspx?cmd=checkin`, CheckIn, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  listMembers: ({ data, Token }) =>
    http.post(`/api/v3/User24@Get`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  userInfoId: ({ data, Token }) =>
    http.post(`/api/v3/user24@info`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  addEditMembers: ({ data, Token }) =>
    http.post(`/admin/smart.aspx?user_add=1`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  updateMembers: ({ data, Token, StockID }) =>
    http.post(
      `/api/v3/User24@Updates?stockid=${StockID}`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  suggestMemberUsename: ({ data, Token, StockID }) =>
    http.post(`/admin/smart.aspx?user_sugg=1&stockid=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  listClients: ({
    Key = "",
    Token,
    pi = 1,
    ps = 15,
    StockID = "",
    CrStockID = "",
    isAdmin = false,
  }) =>
    http.get(
      `/services/preview.aspx?cmd=search_member&key=${encodeURIComponent(
        Key
      )}&typeSearch=sell&ps=${ps}&pi=${pi}&searchId=3&select=ID,FullName,MobilePhone,HomeAddress,ByStockID,Present,Source,AppInfo,BirthDate,TeleNote,Jobs,ReceiveInformation,Present,Photo,CreateDate&includes=GroupNames&isAdmin=${isAdmin}&__MemberCheckin=&__MemberMoney=0&__MyNoti=0&__AllNoti=0&__Birth=0&__MBirth=0&__Cate=false&__HasOrderService=0&__MemberGroups=false&__StaffID=0&__StockID=${StockID}&__Source=&__Tags=&from=top&stockid=${CrStockID}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsId: ({ Key = "", Token, pi = 1, ps = 15 }) =>
    http.get(
      `/services/preview.aspx?cmd=search_member&key=${encodeURIComponent(
        Key
      )}&typeSearch=sell&pi=${pi}&ps=${ps}&isAdmin=true`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsPresentId: ({ MemberID, Token }) =>
    http.get(
      `/api/v3/PresentClient@get?Member=${MemberID}&_Member=${MemberID}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsPresentAppId: ({ MemberID, Token }) =>
    http.get(
      `/api/v3/PresentClient@get?Member=${MemberID}&_Member=${MemberID}&from=app`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsGetTokenId: ({ Token, MemberID }) =>
    http.get(`/api/v3/qcode?cmd=create&mid=${MemberID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsOrderId: ({ data, Token }) =>
    http.post(`/api/v3/common?cmd=OrderCheckIn&get=1&payed=1`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsOrderReturnId: ({ data, Token, StockID = "" }) =>
    http.post(
      `/services/preview.aspx?cmd=Order_Return&stockid=${StockID}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsViewOrderId: ({ OrderID, Token }) =>
    http.get(`/api/v3/order23@get?orderid=${OrderID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsViewOrderReturnId: ({ OrderID, Token }) =>
    http.get(
      `/api/v3/order?cmd=detail&orderid=${OrderID}&includes=bonus,mm,items,order_return,aff,checkin,RemainPay,Return,mm_fixed,aff_fixed,user_return,payed,HOAN_TIEN,oiMethods`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsViewOrderPaymentId: ({ OrderID, Token }) =>
    http.get(`/api/v3/order?cmd=payment&orderid=${OrderID}&mid=0`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsViewOrderBonusId: ({ data, Token }) =>
    http.post(`/api/v3/orderbonus?cmd=calc`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsViewOrderChangeBonusId: ({ data, Token, StockID }) =>
    http.post(
      `/api/v3/orderbonus?cmd=calc&stockid=${StockID}`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsViewCodOrderId: ({ data, Token }) =>
    http.post(`/api/v3/shipcode@getorder`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsViewServiceUserOrder: ({ ProdID, Token }) =>
    http.get(
      `/api/v3/OrderService25@CountUse?OrderItemID=${ProdID}&ispending=-1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsViewServiceUserTransfer: ({
    MemberID,
    OrderItemID,
    ProdServiceID,
    Token,
  }) =>
    http.get(
      `/api/v3/OrderService25@CountUse?MemberID=${MemberID}&OrderItemID=${OrderItemID}&ProdServiceID=${ProdServiceID}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientsPaymentOrderId: ({ data, OrderID, Token }) =>
    http.post(`/api/v3/order?cmd=payment&orderid=${OrderID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsEndPayOrderId: ({ data, Token }) =>
    http.post(`/api/v3/OrderEndPayd@payall`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsUpdateCodOrderId: ({ data, Token }) =>
    http.post(`/api/v3/shipcode@update`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsChangeMemberOrderId: ({ data, Token }) =>
    http.post(`/api/v3/orderadmin@changeMember`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientGiftOrderId: ({ data, Token }) =>
    http.get(
      `/api/v3/orderAdmin?cmd=Order_gift23&OrderID=${data?.OrderID}&desc=${data?.desc}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientDebtLockOrderId: ({ data, Token }) =>
    http.get(
      `/api/v3/orderAdmin?cmd=Order_endpay&OrderID=${data?.OrderID}&desc=${data?.desc}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientCancelOrderId: ({ data, Token }) =>
    http.post(`/services/preview.aspx?cmd=ORDER_CANCEL`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientDeleteOrderId: ({ data, Token }) =>
    http.post(`/services/preview.aspx?cmd=delete_order`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientFinishOrderId: ({ data, Token }) =>
    http.post(`/services/preview.aspx?cmd=ORDER_FN`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientDeleteAccumulateOrderId: ({ data, Token }) =>
    http.post(`/api/v3/common?cmd=deleteTAKE_MM`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientUpdateAffOrderId: ({ data, Token }) =>
    http.post(`/api/v3/order?cmd=setaff`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientCancelGiftOrderId: ({ data, Token }) =>
    http.post(`/api/v3/orderadmin@orderUndo`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientChangeDateOrderId: ({ data, Token }) =>
    http.post(`/api/v3/orderAdmin@date`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsServiceUseId: ({ ID, Token }) =>
    http.get(`/api/v5/pos27@GetForService?id=${ID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsOrderUpdateId: ({ data, Token }) =>
    http.post(`/api/v3/common?cmd=OrderCheckIn`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsUpdateDiscountOrderId: ({ data, Token }) =>
    http.post(`/api/v3/common?cmd=priceorder_OrderAdd20`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsUpdateGuestOrderId: ({ data, Token }) =>
    http.post(`/api/v3/MemberCheckIn@GuestCount`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsOrderGetVouchers: ({ MemberID, Token }) =>
    http.post(`/app/index.aspx?cmd=voucherandaff&mid=${MemberID}&a=2`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsOrderUseVoucherMinigame: ({ data, Token }) =>
    http.post(`/api/v3/contact25@edit`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientCareDiaryId: ({ MemberID, Token }) =>
    http.get(`/api/v3/membercare?cmd=get&mid=${MemberID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientCareHistoryDiaryId: ({ data, Token }) =>
    http.post(`/api/v3/tele23@list_tele`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientCareHisProdDiaryId: ({ MemberID, Token }) =>
    http.get(`/api/v3/member23?cmd=da_mua&memberid=${MemberID}&ps=500`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientCareHisServiceDiaryId: ({ MemberID, Token }) =>
    http.get(
      `/services/preview.aspx?a=1&token=${Token}&cmd=loadOrderService&MemberID=${MemberID}&IsMember=0&fromOrderAdd=0`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientAddEditNoteDiaryId: ({ data, Token }) =>
    http.post("/api/v3/membernoti?cmd=add", data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientDeleteNoteDiaryId: ({ data, Token }) =>
    http.post("/api/v3/MemberCare?cmd=deleteNoti", data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientWalletId: ({ data, Token }) =>
    http.post("/services/preview.aspx?cmd=list_money", data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientAddEditWalletId: ({ data, Token, StockID }) =>
    http.post(`/services/preview.aspx?cmd=add_money&stockid=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),

  clientBooksId: ({ MemberID, StockID, Token, From, To }) =>
    http.get(
      `/api/v3/mbookAdmin?cmd=getbooks&memberid=${MemberID}&stockid=${StockID}&from=${From}&to=${To}&skip_status=1&allstocks_by_rights=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientDebtId: ({ data, MemberID, Token }) =>
    http.post(
      `/api/v3/r23/cong-no/danh-sach/@memberid=${MemberID}`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientResetDebtId: ({ MemberID, Token }) =>
    http.get(`/api/v3/member23@ResetMemberPresent?MemberID=${MemberID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientPointsId: ({ data, Token }) =>
    http.post(`/api/v3/MemberPoint27@Get`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientDeletePointsId: ({ data, Token }) =>
    http.post(`/api/v3/MemberPoint27@delete`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientEditPointsId: ({ data, Token }) =>
    http.post(`/api/v3/MemberPoint27@edit`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientExchangePointsId: ({ data, Token }) =>
    http.post(`/api/v3/MemberPoint27@convert`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientCardId: ({ MemberID, Token }) =>
    http.get(`/api/v3/moneycard?cmd=get&memberid=${MemberID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientCardUnlockId: ({ ID, Token }) =>
    http.get(`/api/v3/moneycard?cmd=lock&id=${ID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientEditCardId: ({ data, Token }) =>
    http.post("/api/v3/moneycard?cmd=adminEdit", JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientViewCardId: ({ ID, Token }) =>
    http.get(`/api/v3/moneycard?cmd=detail&id_the_tien=${ID}&token=${Token}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientEditDateCardId: ({ data, Token }) =>
    http.post("/api/v3/moneycard?cmd=update_date", JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientDoNoti: ({ data, Token }) =>
    http.post("/api/v3/usertask?cmd=doNoti", data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsCheckIn: ({ data, Token }) =>
    http.post(`/services/preview.aspx?cmd=checkin`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsResetPwd: ({ data, Token }) =>
    http.post(`/services/preview.aspx?cmd=setpwd_member`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsDeleteDevice: ({ data, Token }) =>
    http.post(`/api/v3/member23@ResetDevice`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsChangeServicesItem: ({ data, Token, cmd, StockID = "" }) =>
    http.post(`/services/preview.aspx?cmd=${cmd}&StockID=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsChangeServicesRegimen: ({ data, Token }) =>
    http.post(`/api/v3/OrderService?cmd=caidat_phacdo`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsTransfServicesItem: ({ data, Token }) =>
    http.post(`/api/v3/OrderService@DoConvert`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsTransfFeeServicesItem: ({ data, Token }) =>
    http.post(`admin/smart.aspx?orderarr=1`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsGetServicesItemEnd: ({ data, Token, StockID = "" }) =>
    http.post(`/api/v3/OrderService?cmd=ended&StockID=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsGetImagesServicesItem: ({ OsID, Token }) =>
    http.get(`/api/v3/orderservice?cmd=attachment&osid=${OsID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsUploadImagesServicesItem: ({ OsID, Token, data }) =>
    http.post(`/api/v3/orderservice?cmd=attachment&osid=${OsID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsResetOsServicesItem: ({ Token, data }) =>
    http.post(`/api/v3/orderservice?cmd=reset_book`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsGetMaterialsOsServicesItem: ({ Token, OsID }) =>
    http.get(`/services/preview.aspx?cmd=cus_serviceItem&ID=${OsID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsAddMaterialsOsServicesItem: ({ Token, OsID, data }) =>
    http.post(`/services/preview.aspx?cmd=cus_serviceItem&ID=${OsID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsGetMaterialsProdCard: ({ Token, ProdID }) =>
    http.get(`/admin/smart.aspx?ServiceItem=1&ProdID=${ProdID}`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsGetRefunItemEnd: ({ data, Token, StockID = "" }) =>
    http.get(
      `/api/v3/refun?cmd=getvalues&oiid=${data?.OrderItemID}&value=${data?.Value}&mid=${data?.MemberID}&StockID=${StockID}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  clientChangeDateBonusOrderId: ({ data, Token, Type = "" }) =>
    http.post(`/api/v3/SysAdminTools@${Type}`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientAddEditTIP: ({ data, Token }) =>
    http.post(`/api/v3/MemberTip@Tip`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  listOrders: ({
    Key = "",
    Token,
    pi = 1,
    ps = 15,
    ForMember = "",
    StockID = 0,
    From = "",
    To = "",
  }) =>
    http.get(
      `/services/preview.aspx?cmd=search_order&key=${encodeURIComponent(
        Key
      )}&typeSearch=sell&ps=${ps}&pi=${pi}&searchId=4&isAdmin=true&IsOnlineNewOrder=0&From=${From}&To=${To}&StaffID=0&StockID=${StockID}&zero=0&searchForMember=${ForMember}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  listOrdersSum: ({
    Key = "",
    Token,
    pi = 1,
    ps = 15,
    ForMember = "",
    StockID = 0,
    From = "",
    To = "",
  }) =>
    http.get(
      `/services/preview.aspx?cmd=search_order&key=${encodeURIComponent(
        Key
      )}&typeSearch=sell&ps=${ps}&pi=${pi}&searchId=4&isAdmin=true&IsOnlineNewOrder=0&From=${From}&To=${To}&StaffID=0&StockID=${StockID}&zero=0&searchForMember=${ForMember}&sum=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  memberChangePhone: (body) =>
    http.post(`/services/preview.aspx?cmd=chang_phone`, body),
  memberDataAdd: () => http.get("/api/v3/member23?cmd=dataForAdd"),
  getProvinces: ({ Key = "" }) =>
    http.get(`/api/gl/select2?cmd=region_province&q=${Key}&_type=query`),
  getDistricts: ({ Key = "", Pid = "" }) =>
    http.get(
      `/api/gl/select2?cmd=region_district&pid=${Pid}&_type=query&q=${Key}`
    ),
  addEditClients: ({ data, Token = "" }) =>
    http.post(`/api/v3/member23@AddMember`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  addOrderCheckIn: ({ data, Token = "", StockID }) =>
    http.post(`/api/v3/common?cmd=OrderCheckIn&stockid=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsCheckIn: ({ data, Token = "", StockID }) =>
    http.post(`/services/preview.aspx?cmd=checkin&stockid=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsCheckOut: ({ data, Token = "", StockID }) =>
    http.post(`/services/preview.aspx?cmd=checkout&stockid=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsCheckOutMc: ({ data, Token = "" }) =>
    http.post(`/api/v3/MemberCheckIn@InCheckIn`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsCheckOutUpdateMc: ({ data, Token = "" }) =>
    http.post(`/api/v3/MemberCheckIn@InCheckInUpdate`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  clientsSignature: ({ data, Token = "" }) =>
    http.post(`/api/v3/MemberCheckIn@ResendIpad`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getCheckIn: ({ data, Token = "", StockID }) =>
    http.post(`/services/preview.aspx?cmd=getcheck&stockid=${StockID}`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getCheckInRecently: ({ data, Token = "" }) =>
    http.post(`/api/v3/MemberCheckIn@Recent`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  changeTagsTelesales: ({ data, Token }) =>
    http.post(`/api/v3/pagetele24@savemember`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getPrinterOrderId: ({ OrderID, Token }) =>
    http.get(
      `/runtime/Cser/printers/printOrderDHSize80.aspx?orderid=${OrderID}&json=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  getPrinterServiceId: ({ OsID, Token, ModeCard }) =>
    http.get(
      `/runtime/Cser/printers/PrintServiceK80.aspx?osid=${OsID}${
        ModeCard ? "&printParams=in_the" : ""
      }&json=1`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  memberAff: ({ data, Token }) =>
    http.post(`/api/v3/member23@MemberByAffMemberID`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getTimekeepingsMonthly: ({ data, Token }) =>
    http.post(`/api/v3/UserSalary24@get`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getTimekeepingsTakeBreak: ({ data, Token }) =>
    http.post(
      `/api/v3/userwork23@workoffList?stockid=${data?.filter?.StockID || ""}`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  actionTimekeepingsTakeBreak: ({ data, Token }) =>
    http.post(`/api/v3/userwork23@workoffEdit`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getTimekeepingsWork: ({ data, Token }) =>
    http.post(`/api/v3/WorkTrack@UserDaily`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getTimekeepingsSheet: ({ data, Token }) =>
    http.post(`/api/v3/userwork23@workList`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  resetPwdMember: ({ data, Token }) =>
    http.post(`/api/v3/User24@ResetPwd`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  saveMachineCode: ({ data, Token }) =>
    http.post(`/api/v3/user24@devices`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  saveTypeShift: ({ data, Token }) =>
    http.post(`/api/v3/user24@WorkTimeSetting`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  actionInOutTimeKeeping: ({ data, Token }) =>
    http.post(`/api/v3/worktrack@adminedit`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getCareSchedule: ({ data, Token }) =>
    http.post(`/api/v3/OSNR@afterservice`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getClassSchedule: ({ data, Token }) =>
    http.post(`/api/v3/OSC@ClassList`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getClassListSchedule: ({ data, Token }) =>
    http.post(`/api/v3/OSC@ClassMemberList`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  addEditClassSchedule: ({ data, Token }) =>
    http.post(`/api/v3/OSC@ClassMemberEDIT`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  deleteClassSchedule: ({ data, Token }) =>
    http.post(`/api/v3/OSC@ClassMemberDelete`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  updateOsClassSchedule: ({ data, Token }) =>
    http.post(`/api/v3/OS25@UpdateList`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  updateRatingMembers: ({ data, Token }) =>
    http.post("/api/v3/userrate@save", JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getGroupRoles: ({ Token }) =>
    http.get("/api/v3/User24@GetGroups", {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getOrderItemInfo24: ({ data, Token }) =>
    http.post(`/api/v3/OrderItem24@info`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  listCashs: ({ params, Token }) =>
    http.get(`/api/v3/cash`, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
      params,
    }),
  addEditCashs: ({ data, Token }) =>
    http.post(`/api/v3/cash?cmd=save`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  deleteCashs: ({ data, Token }) =>
    http.post(`/api/v3/cash?cmd=delete`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  withSourceCashs: ({ data, Token }) =>
    http.post(`/api/v3/cash?cmd=get_with_source`, data, {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    })
};

export default AdminAPI;

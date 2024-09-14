import http from "../helpers/http"

const AdminAPI = {
    listNotifications: ({
        Pi = 1,
        Ps = 20
    }) => http.get(`/api/v3/noticalendar?cmd=get&Pi=${Pi}&Ps=${Ps}`),
    updateLatLngWifi: (body) => http.post(`/api/v3/cate25@UpdateLatLng`, JSON.stringify(body)),
    listProcessings: ({
        StockID,
        Token
    }) => http.get(`/api/v3/usertask?cmd=list&stockid=${StockID}&loadId=2&from=&to=&token=${Token}`),
    doPayedProcess: ({
        bodyFormData,
        Token,
        StockID,
    }) => http.post(`/api/v3/usertask?cmd=doSmsPayed&stockid=${StockID}`, bodyFormData, {
        headers: {
            Authorization: `Bearer ${Token}`
        }

    }),
    doNotiProcess: ({
        bodyFormData,
        Token
    }) => http.post(`/api/v3/usertask?cmd=doNoti`, bodyFormData, {
        headers: {
            Authorization: `Bearer ${Token}`
        }

    }),
    doContactProcess: ({
        bodyFormData,
        Token
    }) => http.post(`/api/v3/usertask?cmd=doRead`, bodyFormData, {
        headers: {
            Authorization: `Bearer ${Token}`
        }

    }),
    doQrProcess: ({
        data,
        Token
    }) => http.post(`/api/v3/order23@SetPayCallback`, JSON.stringify(data), {
        headers: {
            Authorization: `Bearer ${Token}`
        }

    }),
    doCancelBookProcess: ({
        data,
        Token
    }) => http.post(`/api/v3/mbookadmin?cmd=CancelDateAdminView`, JSON.stringify(data), {
        headers: {
            Authorization: `Bearer ${Token}`
        }

    }),
    doBookProcess: ({
        data,
        Token
    }) => http.post(`/admin/smart.aspx?reply_noti=1`, data, {
        headers: {
            Authorization: `Bearer ${Token}`
        }

    }),
}

export default AdminAPI
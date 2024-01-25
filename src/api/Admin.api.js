import http from "../helpers/http"

const AdminAPI = {
    listNotifications: ({
        Pi = 1,
        Ps = 20
    }) => http.get(`/api/v3/noticalendar?cmd=get&Pi=${Pi}&Ps=${Ps}`),
    updateLatLngWifi: (body) => http.post(`/api/v3/cate25@UpdateLatLng`, JSON.stringify(body))
}

export default AdminAPI
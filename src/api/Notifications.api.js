import http from "../helpers/http";

const NotificationsAPI = {
    getMembersSend: () => http.get(`/api/gl/select2?cmd=group_and_member&ignore_member=1`),
    getUsersSend: () => http.get(`/api/gl/select2?cmd=group_and_user&&term=&_type=query&q=`),
    send: body =>
        http.post('/api/v3/noticalendar?cmd=savejson', JSON.stringify(body)),
    getId: body => http.post(`/api/v3/noticalendar?cmd=getids`, body),
    delete: body => http.post('/api/v3/noticalendar?cmd=delete', body),
    getId: body => http.post(`/api/v3/noticalendar?cmd=getids`, body)
}

export default NotificationsAPI;
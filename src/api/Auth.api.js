import http from "../helpers/http"

const AuthAPI = {
    login: ({
        USN,
        PWD,
        DeviceID
    }) => http.get(`/app/index.aspx?cmd=authen&USN=${USN}&PWD=${encodeURIComponent(PWD)}&deviceid=${DeviceID}&v=2`),
    checkToken: ({
        Token,
        WorkTrackStockID = ""
    }) => http.get(`/app/index.aspx?cmd=authen&token=${Token}&WorkTrackStockID=${WorkTrackStockID}`),
    changePassword: ({
        Token,
        data
    }) => http.post(`/app/index.aspx?cmd=chgpwd&token=${Token}`, data),
    sendTokenFirebase: ({
        Type,
        ID,
        bodyFormData
    }) => http.post(`/api/v3/apptoken?cmd=call&accid=${ID}&acctype=${Type}&senderIndex=2`, bodyFormData),
    removeTokenFirebase: ({
        Type,
        ID,
        Token
    }) => http.get(`/api/v3/apptoken?cmd=call&token=${Token}&accid=${ID}&acctype=${Type}&senderIndex=2&logout=1`, bodyFormData),
    otpVerify: ({Value, Token}) => http.get(`/admin/otp.aspx?cmd=valid&secure=${Value}&token=${Token}`),
    listNotifications: (UserId) => http.get(`/api/v3/noti2?cmd=nextoffset&acctype=U&accid=${UserId}&offset=0&next=200`),
    deleteNotification: (body) => http.post(`api/v3/noti2/?cmd=clear2`, body),
    detailNotification: (id) => http.get(`/api/v3/noticlient?cmd=detail&ids=${id}`),
    readNotification: (body) => http.post(`/api/v3/noti2/?cmd=readed2`, body)
}

export default AuthAPI
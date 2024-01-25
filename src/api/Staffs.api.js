import http from "../helpers/http";

const StaffsAPI = {
    getServices: ({
        Token,
        Filters,
        StockID
    }) => http.post(`/app/index.aspx?cmd=member_sevice&token=${Token}&IsUser=1&StockID=${StockID}`, Filters),
    getDiarys: ({
        Token,
        Filters,
        StockID
    }) => http.post(`/app/index.aspx?cmd=noti&token=${Token}&IsUser=1&StockID=${StockID}`, Filters),
    addDiarys: ({
        Token,
        StockID,
        data
    }) => http.post(`/app/index.aspx?cmd=service_note&token=${Token}&IsUser=1&StockID=${StockID}`, data),
    getAttachments: data => http.post(`/api/v3/orderservice@osAttachments`, JSON.stringify(data)),
    getStaffService: ({
        Token,
        StockID,
        data
    }) => http.post(`/app/index.aspx?cmd=get_staff_service&token=${Token}&IsUser=1&StockID=${StockID}`, data),
    getServiceSchedule: ({
        Token,
        StockID,
        data
    }) => http.post(`/app/index.aspx?cmd=booklist&token=${Token}&IsUser=1&StockID=${StockID}`, data),
    getServiceHistory: ({
        Token,
        MemberID
    }) => http.get(`/services/preview.aspx?a=1&token=${Token}&cmd=loadOrderService&MemberID=${MemberID}&IsMember=0&fromOrderAdd=0`),
    getOrdersHistory: ({
        MemberID
    }) => http.get(`/api/v3/member23?cmd=da_mua&memberid=${MemberID}&ps=1000`),
    getAvailableHistory: ({
        Token,
        MemberID
    }) => http.get(`/services/preview.aspx?a=1&token=${Token}&cmd=loadOrderService&MemberID=${MemberID}&IsMember=0&fromOrderAdd=0`),
    getImagesOs: (osid) => http.get(`/api/v3/orderservice?cmd=attachment&osid=${osid}`),
    deleteImagesOs: ({
        OsID,
        data
    }) => http.post(`/api/v3/orderservice?cmd=attachment&osid=${OsID}`, data),
    updateImageOs: ({
        ID,
        data
    }) => http.post(`/api/v3/orderservice?cmd=attachment&osid=${ID}`, data),
    updateDescOs: ({
        ID,
        data
    }) => http.post(`/api/v3/orderservice?cmd=desc&osid=${ID}`, data),
    doneOs: ({
        Token,
        StockID,
        data
    }) => http.post(`/app/index.aspx?cmd=staff_done_service&token=${Token}&IsUser=1&StockID=${StockID}`, data)
}

export default StaffsAPI;
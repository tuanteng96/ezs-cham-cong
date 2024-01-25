import http from "../helpers/http";

const WorkTrackAPI = {
    CheckInOut: (body) => http.post(`/api/v3/worktrack@inout`, JSON.stringify(body)),
    UpdateInfoInOut: (body) => http.post(`/api/v3/worktrack@updateInfo`, JSON.stringify(body)),
    List: (body) => http.post(`/api/v3/worktrack@FromTo`, JSON.stringify(body)),
    addTakeBreak: body => http.post(`/api/v3/userwork23@workoffs`, JSON.stringify(body)),
    listTakeBreak: body => http.post(`/api/v3/userwork23@workList`, JSON.stringify(body)),
}

export default WorkTrackAPI;
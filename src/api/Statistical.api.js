import http from "../helpers/http";

const StatisticalAPI = {
    getUserSalary: ({
        userid,
        mon
    }) => http.get(`/api/v3/usersalary?cmd=salary&userid=${userid}&mon=${mon}`)
}

export default StatisticalAPI;
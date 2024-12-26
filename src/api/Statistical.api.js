import http from "../helpers/http";

const StatisticalAPI = {
  getUserSalary: ({ userid, mon }) =>
    http.get(`/api/v3/usersalary?cmd=salary&userid=${userid}&mon=${mon}`),
  getUserSalaryDay: (data) =>
    http.post(`/api/v3/UserSalary24@GetDate`, JSON.stringify(data)),
};

export default StatisticalAPI;

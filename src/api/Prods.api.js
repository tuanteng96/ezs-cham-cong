import http from "../helpers/http";

const ProdsAPI = {
  getServicesRoots: ({
    MemberID = "",
    ps = 50,
    pi = 1,
    Key = "",
    StockID = "",
    Token,
  }) =>
    http.get(
      `/api/v3/mbook?cmd=getroot&memberid=${MemberID}&ps=${ps}&pi=${pi}&Key=${Key}&stockid=${StockID}`,
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  getProds: ({ data, Token }) =>
    http.post(`/api/v3/prod24@getCache`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  getProdsStocks: ({ data, Token, StockID }) =>
    http.post(
      `/api/v3/prod23@GetStocks?stockid=${StockID}`,
      JSON.stringify(data),
      {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      }
    ),
  getProdsCategories: () => http.get(`/api/v3/prod24@CategoryList`),
};

export default ProdsAPI;

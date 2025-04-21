import http from "../helpers/http";

const ClassOsAPI = {
  getListMembers: ({ data, Token }) =>
    http.post(`/api/v3/OSC@ClassMemberList`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  addEditClassMember: ({ data, Token }) =>
    http.post(`/api/v3/OSC@ClassMemberEDIT`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  updateOsClassMember: ({ data, Token }) =>
    http.post(`/api/v3/OS25@UpdateList`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  addEditPointOsMember: ({ data, Token }) =>
    http.post(`/api/v3/MemberPoint27@Edit`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
  deletePointOsMember: ({ data, Token }) =>
    http.post(`/api/v3/MemberPoint27@Deletes`, JSON.stringify(data), {
      headers: {
        Authorization: `Bearer ${Token}`,
      },
    }),
};

export default ClassOsAPI;

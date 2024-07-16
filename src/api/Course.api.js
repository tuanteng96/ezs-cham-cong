import http from "../helpers/http";


const CourseAPI = {
  list: (body) => http.post(`/api/v3/course@list`, JSON.stringify(body)),
  addEditCourse: (body) => http.post(`/api/v3/course@edit`, JSON.stringify(body)),
  deleteCourse: (body) => http.post(`/api/v3/course@delete`, JSON.stringify(body)),
  listStudentCourse: (body) => http.post(`/api/v3/course@listMember`, JSON.stringify(body)),
  addEditStudentCourse: (body) => http.post(`/api/v3/course@editmember`, JSON.stringify(body)),
  deleteStudentCourse: (body) => http.post(`/api/v3/course@deleteMember`, JSON.stringify(body)),
  studentCheck: (body) => http.post('/api/v3/course@listCheck', JSON.stringify(body)),
  studentEditCheck: (body) => http.post('/api/v3/course@EditCheck', JSON.stringify(body)),
  studentDeleteCheck: (body) => http.post('/api/v3/course@deleteCheck', JSON.stringify(body))
}

export default CourseAPI

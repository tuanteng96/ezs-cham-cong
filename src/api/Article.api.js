import http from "../helpers/http"

const ArticleAPI = {
    get: (body) => http.post(`/api/v3/Article25@get`, JSON.stringify(body)),
    addEdit: (body) => http.post(`/api/v3/Article25@edit`, JSON.stringify(body)),
    delete: (body) => http.post(`/api/v3/Article25@delete`, JSON.stringify(body)),
}

export default ArticleAPI
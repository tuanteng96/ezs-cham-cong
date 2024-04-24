import http from "../helpers/http";

const MoresAPI = {
    getNow: () => http.get(`/api/v3/servertime@now`),
    upload: ({
        File,
        Token
    }) => http.post(`/api/v3/file?cmd=upload&token=${Token}`, File),
    uploadProgress: ({
        File,
        Token,
        progressCallBack = null
    }) => http.post(`/api/v3/file?cmd=upload&token=${Token}`, File, {
        onUploadProgress: ev =>
            progressCallBack &&
            progressCallBack(Math.round((ev.loaded * 100) / ev.total))
    })
}

export default MoresAPI;
import http from "../helpers/http";

const MoresAPI = {
    getNow: () => http.get(`/api/v3/servertime@now`),
    upload: ({
        File,
        Token
    }) => http.post(`/api/v3/file?cmd=upload&token=${Token}`, File),
    uploadMultiple: ({
        Files,
        Token
    }) => http.post(`/api/v3/file25@uploads?token=${Token}`, Files),
    uploadProgress: ({
        File,
        Token,
        progressCallBack = null
    }) => http.post(`/api/v3/file?cmd=upload&token=${Token}`, File, {
        onUploadProgress: ev =>
            progressCallBack &&
            progressCallBack(Math.round((ev.loaded * 100) / ev.total))
    }),
    base64toImage: ({
        data,
        Token,
        progressCallBack = null
    }) => http.post(`/api/v3/file?cmd=base64`, data, {
        headers: {
            Authorization: `Bearer ${Token}`,
        },
        onUploadProgress: ev =>
            progressCallBack &&
            progressCallBack(Math.round((ev.loaded * 100) / ev.total))
    })
}

export default MoresAPI;
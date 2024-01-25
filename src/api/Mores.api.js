import http from "../helpers/http";

const MoresAPI = {
    getNow: () => http.get(`/api/v3/servertime@now`),
    upload: ({
        File,
        Token
    }) => http.post(`/api/v3/file?cmd=upload&token=${Token}`, File)
}

export default MoresAPI;
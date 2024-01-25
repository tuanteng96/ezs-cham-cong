import http from "../helpers/http";

const ConfigsAPI = {
    getValue: (names) => http.get(`/api/v3/config?cmd=getnames&names=${names}&ignore_root=1`)
}

export default ConfigsAPI;
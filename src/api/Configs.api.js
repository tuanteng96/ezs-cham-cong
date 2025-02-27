import http from "../helpers/http";

const ConfigsAPI = {
    getValue: (names) => http.get(`/api/v3/config?cmd=getnames&names=${names}&ignore_root=1`),
    setValue: ({
        name,
        data
    }) => http.post(`/api/v3/ConfigJson@save?name=${name}`, JSON.stringify(data)),
    updateLatLng: body =>
        http.post(`/api/v3/cate25@UpdateLatLng`, JSON.stringify(body)),
}

export default ConfigsAPI;
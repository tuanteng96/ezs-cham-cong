import StoreHelper from "./StoreHelper";

const CHOOSE_FILE_SERVER = (_opt) => {
    if (typeof APP21.prom !== 'undefined') {
        var opt = {
            maxwidth: 5000,
            maxheight: 5000,
            ext: 'png',
            pref: 'IMG',
            server: `${StoreHelper.getDomain()}/api/v3/file?cmd=upload&autn=AAAA&token=${StoreHelper.getToken()}`
        };
        opt = Object.assign(opt, _opt);

        var cameraOpt = {
            maxwidth: 5000,
            maxheight: 5000,
            ext: 'png',
            pref: 'IMG',
        }

        for (var k in cameraOpt) {
            if (opt[k]) cameraOpt[k] = opt[k];
        }
        return new Promise((resolve, reject) => {
            APP21.prom('CAMERA', cameraOpt).then(s => {
                // console.log(s)
                APP21.prom('POST_TO_SERVER', JSON.stringify({
                    server: opt.server,
                    path: s.data,
                    token: StoreHelper.getToken(),
                })).then(s1 => {
                    var rs = JSON.parse(s1.data);
                    resolve(rs);
                }).catch(f1 => {
                    reject({
                        title: 'POST_TO_SERVER FAIL',
                        error: f1
                    })
                });
            }).catch(e => {
                reject({
                    title: 'CAMERA FAIL',
                    error: e
                })
            })
        })
    }
}

const CALL_PHONE = (phone) => {
    if (typeof APP21.prom !== 'undefined') {
        APP21.prom('TEL', phone);
    }
}

const OPEN_LINK = (link) => {
    if (typeof APP21.prom !== 'undefined') {
        APP21.prom('BROWSER', link);
    }
}

const SET_BADGE = (count) => {
    if (typeof APP21.prom !== 'undefined') {
        APP21.prom('SET_BADGE', count);
    }
}

const REMOVE_BADGE = (count) => {
    if (typeof APP21.prom !== 'undefined') {
        APP21.prom('REMOVE_BADGE', count);
    }
}

const OPEN_QRCODE = () => {
    if (typeof APP21.prom !== 'undefined') {
        return APP21.prom('OPEN_QRCODE');
    }
}

const GET_LOCATION = () => {
    if (typeof APP21.prom !== 'undefined') {
        return APP21.prom('GET_LOCATION');
    }
}

const GET_DEVICE = () => {
    if (typeof APP21.prom !== 'undefined') {
        return APP21.prom('GET_INFO');
    }
}

const SEND_TOKEN_FIREBASE = () => {
    if (typeof APP21.prom !== 'undefined') {
        return new Promise((resolve, reject) => {

            APP21.prom('KEY', JSON.stringify({
                key: 'FirebaseNotiToken'
            })).then(({
                data
            }) => {
                resolve({
                    token: data
                });
            }).catch(({
                error
            }) => {
                resolve({
                    error: error
                })
            })
        });
    } else {
        return new Promise((resolve, reject) => {
            resolve({
                error: "Yêu cầu nâng cấp lên phiên bản mới nhất."
            });
        });
    }
}

const CLOSE_APP = () => {
    if (typeof APP21.prom !== 'undefined') {
        return APP21.prom('FINISH_ACTIVITY');
    }
}

const RELOAD_APP = () => {
    if (typeof APP21.prom !== 'undefined') {
        return APP21.prom(window.PlatformId === "ANDROID" ? 'FINISH_ACTIVITY' : 'REBOOT');
    }
};

/**
 * ##_STATUS_BAR_COLOR
 * @param {string} color (`light` ? light : dark)
 */
const STATUS_BAR_COLOR = (color) => {
    if (typeof APP21.prom !== 'undefined') {
        return APP21.prom('STATUS_BAR_COLOR', color);
    }
}

const ON_PAGE_INIT = (args) => {
    if (typeof APP21.prom !== 'undefined') {
        return APP21.prom('ON_PAGE_INIT', args);
    }
}

const GET_NETWORK_TYPE = () => {
    if (typeof APP21.prom !== 'undefined') {
        return new Promise((resolve, reject) => {
            APP21.prom('GET_NETWORK_TYPE').then(({data}) => {
                resolve({
                    data: {
                        BSSID: data.BSSID,
                        SSID: window.PlatformId === "ANDROID" ? data.SSID.slice(1,-1) : data.SSID
                    }
                })
            }).catch(() => {
                if(import.meta.env.DEV) {
                    resolve({
                        data: {
                            BSSID: "",
                            SSID: "Hung Bien_5G"
                        }
                    })
                }
                else {
                    reject("Vui lòng kết nối WIFI")
                }
            })
        })
    }
}

const PromHelpers = {
    CHOOSE_FILE_SERVER,
    CALL_PHONE,
    OPEN_LINK,
    SET_BADGE,
    REMOVE_BADGE,
    OPEN_QRCODE,
    SEND_TOKEN_FIREBASE,
    CLOSE_APP,
    STATUS_BAR_COLOR,
    GET_LOCATION,
    GET_DEVICE,
    ON_PAGE_INIT,
    RELOAD_APP,
    GET_NETWORK_TYPE
}
export default PromHelpers;
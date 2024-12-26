/*
 App21.js
 */

/**
 * gửi yêu cầu tới app IOS || app Android
 */
function app_request(cmd, value) {
    if (window['ANDROID'])
        ANDROID.Do(cmd, value);
    else
        window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.IOS.postMessage({
            "cmd": cmd,
            "value": value
        })
}

window.Queues = null

function b64DecodeUnicode(str) {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

var app21 = /** @class */ (function () {
    function _21() {}

    var queueId = 1;
    
    // if(window.Queues && window.Queues.length > 0) {
    //     var queue = window.Queues
    // }
    // else {
    //     var queue = []
    //     window.Queues = queue
    // }
    var queue =  [
        //[id, resolve, reject],...
    ];

    var callback = new function () {
        var x = {};

        this.call = function (name, fnO) {

            if (!x[name]) x[name] = [];
            if (typeof fnO === 'function') x[name].push(fnO);
            else x[name].forEach(function (fn) {
                fn(fnO);
            });

        }
        return this;
    }



    function App21Result(jsonResult, _paramsSeperate) {
        
        try {
            /*
             * AND,IOS => {success: true|false, error:'', data:, sub_cmd, sub_cmd_id}
             * */

            var parseStr = jsonResult;

            var BASE64 = 'BASE64:';
            if (jsonResult && jsonResult.indexOf(BASE64) === 0) {
                parseStr = jsonResult.substr(BASE64.length);
                //parseStr = atob(parseStr);
                parseStr = b64DecodeUnicode(parseStr);
                /*
                 !!!NOTI: jsonResult -> parseStr
                 (AND) sử dụng android.util.Base64.encodeToString(data,android.util.Base64.NO_WRAP);
                 một số ký tự sẽ bị thay thế cụ thể: 
                 =  \u003d
                 &  \u0026
                 <  \u003c
                 >  \u003e
                 */
            }


            var rs = JSON.parse(parseStr);
            app21.parse(parseStr);
            var callbackId = rs.sub_cmd_id;
            var result = rs;
            if (_paramsSeperate) result.params = _paramsSeperate;
            
            var i = -1;
            queue.every(function (x, index) {
                if (x[0] === callbackId) {
                    i = index;

                    if (rs.success) {

                        x[1](result); //resolve
                        app21.resolve(rs);
                    } else {
                        x[2](result); //reject
                        app21.reject(result);
                    }

                    return false;
                }
                return true;
            });
            if (i < 0) return;
            queue.splice(i, 1);
        } catch (e) {
            //nothing handler
            app21.catch('' + e);
        }


    }
    _21.getQueue = function(){
        return queue;  
    }
    _21.prom = function (sub_cmd, params) {
        
        if (!window.App21Result) window.App21Result = App21Result;

        return new Promise((resolve, reject) => {
            try {
                if (queueId >= Number.MAX_SAFE_INTEGER) queueId = 0;
                var id = queueId++;
                queue.push([id, resolve, reject])

                if (window.ANDROID) {
                    //and

                    app_request("call", JSON.stringify({
                        sub_cmd: sub_cmd,
                        sub_cmd_id: id,
                        params: params
                    }));
                } else if (window.webkit && window.webkit.messageHandlers) {
                    //ios
                    
                    app_request("call", JSON.stringify({
                        sub_cmd: sub_cmd,
                        sub_cmd_id: id,
                        params: params
                    }));
                } else {

                    App21Result(JSON.stringify({
                        sub_cmd: sub_cmd,
                        sub_cmd_id: id,
                        success: false,
                        error: 'NO_AND_IOS',
                        data: null
                    }));
                }
            } catch (e) {

                reject(e);
            }


            //test delay
            //setTimeout(() => {
            //    App21Result(cmd, params ? true : false, params ? "{\"success\": true}" : "Loi", id);
            //}, Math.round(Math.random() * 10000));

            //app21.promo() => Do=> App => App21Result => [resolve, reject]

        });
    };

    _21.parse = function (a) {
        callback.call('parse', a);
    };
    _21.catch = function (a) {
        callback.call('catch', a);
    };
    _21.resolve = function (a) {
        callback.call('resolve', a);
    };
    _21.reject = function (a) {
        callback.call('reject', a);
    };

    /*BUILTIN*/
    _21.PHOTO_TO_SERVER = function (_opt) {
        var opt = {
            maxwidth: 5000,
            maxheight: 5000,
            ext: 'png',
            pref: 'IMG',
            server: (window.SERVER || '') + '/api/v3/file?cmd=upload&autn=AAAA'
        };
        opt = Object.assign(opt, _opt);
        var t = this;

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
            t.prom('CAMERA', cameraOpt).then(s => {

                app21.prom('POST_TO_SERVER', JSON.stringify({
                    server: opt.server,
                    path: s.data
                    // token: 'neu_co',
                })).then(s1 => {

                    var rs = JSON.parse(s1.data);
                    //console.log('app_camera->CAMERA->POST_TO_SERVER->OK', rs.data);
                    // vm.$emit('success', rs.data);
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
    return _21;
}());

window.app21 = app21
window.APP21 = window.app21 || {};
/*
doc:
1. Sử dụng:
app21.prom("sub_cmd", 0).then(x => console.log('aaa',x)).catch(z => console.log('aaa Error:', z))

2. Danh sách "sub_cmd"


- REBOOT
--- params: miliSeconds 
to: delay -> reboot

- CAMARA(!)
---params: no_param

- LOCATION(!)
- CONTACT(!)
- CALL(!)
- FILES(!)
(!) Yêu cầu quyền
app21.PHOTO_TO_SERVER().then(rs=>{ })

 */
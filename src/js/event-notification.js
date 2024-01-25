;
(function () {
    var clicked = [];

    function ready() {
        return new Promise((rs) => {
            function fn() {
                if (window.APP_READY) {
                    rs();
                } else {
                    setTimeout(fn, 100);
                }
            }
            fn();
        })
    }

    function bodySendEvent(name, data) {
        ready().then(() => {
            _bodySendEvent(name, data);
        })

    }

    function _bodySendEvent(name, data) {
        var e = new Event("noti_click." + name);
        e.data = data;
        document.body.dispatchEvent(e);
        //$log.innerHTML = name;
    }

    //[noti_click.go_noti]
    function goNoti(noti_id) {
        bodySendEvent('go_noti', {
            id: noti_id
        });
    }

    //
    function notiClickParser(_o, fn, clickAgaint) {
        
        var o = {
            NOTI_ID: 0,
            click_action: null
        };

        

        if (_o) o = Object.assign(o, _o);

        var isClick = false;

        if (o.NOTI_ID) {
            //
            var canClick = clickAgaint || clicked.indexOf(o.NOTI_ID) === -1;
            if (o.click_action && canClick) {
                //chuỗi gồm nhiều tp, ngăn cách bằng dấu ":"
                var segs = o.click_action.split(':');
                try {

                    if (!segs[0]) {
                        goNoti(o.NOTI_ID)
                        return;
                    }
                    var f = eval(segs[0] || 'goNoti');
                    segs.splice(0, 1);
                    if (typeof f === "function") {
                        isClick = true;
                        clicked.push(o.NOTI_ID);
                        f.apply(this, segs);
                    }

                } catch (e) {
                    //
                    //LogJ(e.toString());
                }
            } else {
                if (clicked.indexOf(o.NOTI_ID) === -1 && !clickAgaint && !o.click_action) {
                    //noti
                    goNoti(o.NOTI_ID);
                }
            }

        } else {
            goNoti();
        }
        fn && fn(isClick);
    }
    window.notiClickParser = notiClickParser;

    function isObjectEmpty(o) {
        if (o === null || !o || typeof o !== 'object') return true;
        for (var k in o) {
            return false;
        }
        return true;
    }

    /*
     * AppResume,AppPause
     * Android Activity lifecycle  see: https://developer.android.com/guide/components/activities/activity-lifecycle
     * IOS: không như And, ios sử dụng "NotificationCenter.default.addObserver" - lúc khở tạo (loadView) để bắt sự kiện:
     * "didBecomeActiveNotification" vs "didEnterBackgroundNotification"
     */
    function AppResume() {
        document.dispatchEvent(new Event("onAppResume"));
        document.dispatchEvent(new Event("onAppForceOut"));
        
        //  app => foreground
        
        app21.prom('NOTI_DATA').then(function (s) {
            var d = s.data;
            if (!isObjectEmpty(d)) {

                window.HAS_NOTI = true;
                notiClickParser(d);
            }
            app21.prom('NOTI_DATA', '{"reset":true}');
        })
    }

    function AppPause() {
        document.dispatchEvent(new Event("onAppPause"));
        document.dispatchEvent(new Event("onAppForceIn"));
    }

    AppResume();
    window.AppResume = AppResume;
    window.AppPause = AppPause;

})();
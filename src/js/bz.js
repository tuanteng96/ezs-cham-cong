"use strict";

function BZ(_opt) {

    var opt = {
        Server: 'https://msg.ezs.vn',
        user: 'a',
        group: '',// domain__groupName
        ReceiveMessage: function (sender, data) {
            //console.log([sender, data]);
        },
        onConnected: function () { },
        onDisConnected: function () { },
        tryConnectTimeOut:100
    };

    opt = Object.assign(opt, _opt);
    
    var Server = opt.Server;
    var connection = null;
    var callbackReceives = [];
    var ready = false;

    var CountDown = 0;
    var IsDisConnected = 0;
    var Delay = 50;

    var _ReceiveMessageCallback = [];

    function _signalR() {
        if (!window.signalR) {
            var s = document.createElement('script');
            s.src = Server + '/lib/aspnet/signalr/dist/browser/signalr.js';
            s.crossOrigin = true;
            s.onload = function () {
                _signalR();
            };
            document.body.appendChild(s);
            return;
        }
        CountDown = 0;

        connection = new signalR.HubConnectionBuilder().withUrl(Server + "/bz", {
            //skipNegotiation: true
        }).build();

        connection.onclose(async () => {
            await start();
            opt.onDisConnected();
        });

        

        connection.on('ReceiveMessage', function (sender,data) {
            // $('body').trigger('bz.ezs.receive', [data]);
            var e = { detail: { sender: sender, data: data } };
            document.body.dispatchEvent(new CustomEvent('bz.ezs.receive', e )); // function(e){ e.sender, e.data }

            _ReceiveMessageCallback.forEach(function (fn) {
                try {
                    fn(e)
                } catch (e) {

                }
            })

            opt.ReceiveMessage(sender, data);
            callbackReceives.forEach(function (fn) {
                try {
                    fn(sender, data);
                } catch (e) {
                    //
                }
            });

        });
        start();
    }

    this.receiveEventName =  'bz.ezs.receive';
    this.sendEventName =  'bz.ezs.send';


    document.body.addEventListener("bz.ezs.send", function (e, data) {
        _send(data);
    });

   

    function _send(data) {
        if (!ready) {
            return;
        }
        connection.invoke('SendMessage', opt.user, data, opt.group);
    }

    function _receive(fn) {
        if (typeof fn === 'function') {
            callbackReceives.push(fn);
        } 
    }
    this.send = _send;
    this.receive = _receive;

    function tryConnect() {
        CountDown--;
        if (CountDown <= 0) {
            CountDown = 0;
            start();
        } else {
            setTimeout(() => tryConnect(), opt.tryConnectTimeOut);
        }
    }

    function _state() {
        if (connection && connection.connection && connection.connection.connectionState === 1) {
            ready = true;

        } else {
            setTimeout(_state, 100);
        }
    }

    async function start() {
        try {
            await connection.start().then(function () {
                opt.group && _joinGroup(opt.group);
                opt.onConnected();
            });

            _state();
            IsDisConnected = 0;

        } catch (err) {
            console.log(err);
            IsDisConnected = 1;
            CountDown = Delay;
            setTimeout(() => tryConnect(), 1000);
        }
    };

    function _joinGroup(groupName) {
        connection.invoke('JoinGroup', opt.group);
    }
    function _leaveGroup(groupName) {
        connection.invoke('LeaveGroup',  opt.group);
    }

    this.start = function () {
        _signalR();
    };

    this.getConnection = () => {
        return connection;
    }
    this.regReceive = (fn) => {
        _ReceiveMessageCallback.push(fn);
    }

    this.joinGroup = _joinGroup;
    this.leaveGroup = _leaveGroup;
}

window.BZ = BZ
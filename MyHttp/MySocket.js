'use strict';

const Net = require('net');
const Assert = require('assert');
const TLS = require('tls');

const { LOG, WARN, ERROR } = require('../MyUtil');


//==========MySocket==========
class MySocket extends Net.Socket {
    id="";
    constructor() {
        Assert(false, "please use decorate!");
    }

    toString() {
        return `${this.remoteAddress}:${this.remotePort}`;
    }

    _onClose(hasErr) {
        WARN(this.toString(), "-----closed!-----");
        this._myServer.socketCount--;
        this._myServer.notifyStatusChange();
        this._myServer = null;
    }

}

module.exports = MySocket;

//防止循环引用bug
const IMyServer = require('./IMyServer');

/**@type {IMyServer} */
MySocket.prototype._myServer = null;

MySocket._decorate =
    /**
    * @param {Net.Socket} sock 
    * @param {IMyServer} server
    */
    function (server) {
        Assert(!(this instanceof MySocket || this instanceof MySockets));
        Assert(this instanceof Net.Socket);

        if (!(this instanceof TLS.TLSSocket)) {
            Object.setPrototypeOf(this, MySocket.prototype);
            WARN(this.toString(), "+++connected!+++");
            this.once("close", this._onClose);

            this._myServer = server;
            this._myServer.socketCount++;
            this._myServer.notifyStatusChange();
        } else {
            Object.setPrototypeOf(this, MySockets.prototype);
            //在server.onconnection decorate了一次，secureConnection 却不见了 事件反而还在，莫名其妙
            this._myServer = server;
        }
    }

MySocket.decorate =
    /**@param{IMyServer}server */
    function (sock, server) {
        MySocket._decorate.call(sock, server);
    }

class MySockets extends TLS.TLSSocket { }
Object.defineProperties(MySockets.prototype, Object.getOwnPropertyDescriptors(MySocket.prototype));

MySocket.MySockets = MySockets;




'use strict';
const Net = require('net');
const Assert = require('assert');
const IMyServer = require('./IMyServer');
const { LOG, WARN, ERROR } = require('../MyUtil');

//==========MySocket==========
class MySocket extends Net.Socket {

    constructor() {
        Assert(false, "please use decorate!");
    }
    /**@type {IMyServer} */
    _myServer = null;
    /**@param{IMyServer}server */
    static _decorate(server) {
        Assert(!(this instanceof MySocket));
        Assert(this instanceof Net.Socket);
        Object.setPrototypeOf(this, MySocket.prototype);
        WARN(this.toString(), "+++connected!+++");
        this.once("close", this._onClose);
        this._myServer = server;
        this._myServer.socketCount++;
        this._myServer.notifyStatusChange();
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

    /**
     * @param {Net.Socket} sock 
     * @param {IMyServer} server
     */
    static decorate(sock, server) {
        MySocket._decorate.call(sock, server);
    }
}
module.exports = MySocket;
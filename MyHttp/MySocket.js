'use strict';
const Net = require('net');
const Assert = require('assert');

const { LOG, WARN, ERROR } = require('../MyUtil');

//==========MySocket==========
class MySocket extends Net.Socket {
    constructor() {
        Assert(false, "please use decorate!");
    }
    static _decorate() {
        Assert(!(this instanceof MySocket));
        Assert(this instanceof Net.Socket);
        Object.setPrototypeOf(this, MySocket.prototype);
        WARN(this.toString(), "+++connected!+++");
        this.once("close", this._onClose);
    }

    toString() {
        return `${this.remoteAddress}:${this.remotePort}`;
    }

    _onClose(hasErr) {
        WARN(this.toString(), "-----closed!-----");
    }

    /**
     * @param {Net.Socket} sock 
     */
    static decorate(sock) {
        MySocket._decorate.call(sock);
    }
}
module.exports = MySocket;
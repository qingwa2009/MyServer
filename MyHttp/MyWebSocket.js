'use strict';
const Assert = require('assert');
const Crypto = require('crypto');
const MySocket = require('./MySocket');
const MyHttpRequest = require('./MyHttpRequest');
const HttpConst = require('./HttpConst');

const { LOG, WARN, ERROR } = require('../MyUtil');

//==========MyWebSocket==========
class MyWebSocket extends MySocket {
    static READY_STATE_CONNECTING = 0;
    static READY_STATE_OPEN = 1;
    static READY_STATE_CLOSING = 2;
    static READY_STATE_CLOSED = 3;

    static BINARY_TYPE_BLOB = 'blob';
    static BINARY_TYPE_BUFFER = 'arraybuffer';

    static VERSION = 13;
    static MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

    readyState = MyWebSocket.READY_STATE_CONNECTING;
    binaryType = MyWebSocket.BINARY_TYPE_BLOB;
    protocol = '';

    constructor() {
        Assert(false, "please use decorate!");
    }

    static _decorate(protocol) {
        Assert(!(this instanceof MyWebSocket));
        Assert(this instanceof MySocket);
        Object.setPrototypeOf(this, MyWebSocket.prototype);
        WARN(this.toString(), "upgraded!");
        this.protocol = protocol;
        this.readyState = MyWebSocket.READY_STATE_OPEN;
        this.on('data', this._OnData.bind(this));
    }

    /**
     * @param {string | Buffer} data 
     */
    send(data) {

    }
    /**
     * @param {number} code default 1005
     * @param {string} reason 
     */
    close(code = 1005, reason = '') {

    }

    /**
     * @param {Buffer} buf
     */
    _OnData(buf) {
        console.log(buf);
    }

    toString() {
        return `${Object.getPrototypeOf(MyWebSocket.prototype).toString.call(this)} websocket`;
    }

    /**
     * @param {MySocket} sock 
     * @param {string} protocol
     */
    static decorate(sock, protocol) {
        MyWebSocket._decorate.call(sock, protocol);
    }
}
module.exports = MyWebSocket;

MyWebSocket.handshake =
    /**
    * @param {MyHttpRequest} req 
    * @param {MySocket} sock 
    * @param {Buffer} head 
    * @returns {MyWebSocket}
    */
    function (req, sock, head) {
        const key = req.headers[HttpConst.HEADER["Sec-WebSocket-Key"]];
        let protocol = req.headers[HttpConst.HEADER["Sec-WebSocket-Protocol"]];

        if (!key) {
            WARN(sock.toString(), "has no Sec-WebSocket-Key!");
            sock.end();
            return;
        }

        if (!protocol) {
            WARN(sock.toString(), "has no protocol!");
            sock.end();
            return;
        }
        //取第一个协议
        protocol = protocol.split(",")[0];

        sock.write(HttpConst.HEAD["101Switching-Protocols"]);
        sock.write(HttpConst.HEAD["UpgradeWebSocket"]);
        sock.write(HttpConst.HEAD["ConnectionUpgrade"]);
        sock.write(`${HttpConst.HEADER["Sec-WebSocket-Version"]}: ${MyWebSocket.VERSION}\r\n`);
        sock.write(`${HttpConst.HEADER["Sec-WebSocket-Protocol"]}: ${protocol}\r\n`);
        sock.write(`${HttpConst.HEADER["Sec-WebSocket-Accept"]}: ${MyWebSocket.calcAcceptKey(key)}\r\n`);
        sock.write("\r\n");

        sock.pipe(sock, { end: false });
        MyWebSocket.decorate(sock, protocol);

        return sock;
    }

MyWebSocket.calcAcceptKey =
    /**
     * @param {string} key 
     */
    function (key) {
        const s = key + MyWebSocket.MAGIC_STRING;
        const hash = Crypto.createHash('sha1');
        hash.update(s);
        return hash.digest('base64');
    }
'use strict';
const Assert = require('assert');
const Crypto = require('crypto');
const Net = require('net');
const { StringDecoder } = require('string_decoder');
const MySocket = require('./MySocket');
const MyHttpRequest = require('./MyHttpRequest');
const IMyWebSocketHandler = require('./IMyWebSocketHandler');
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

    static OPCODE_CONTINUE = 0x0;
    static OPCODE_TEXT = 0x1;
    static OPCODE_BINARY = 0x2;
    static OPCODE_CLOSE = 0x8;
    static OPCODE_PING = 0x9;
    static OPCODE_PONG = 0xA;


    static WS_CLOSE_NORMAL = 1000
    static WS_CLOSE_GOING_AWAY = 1001
    static WS_CLOSE_PROTOCOL_ERR = 1002
    static WS_CLOSE_UNSUPPORTED_DATA = 1003
    static WS_CLOSE_NO_STATUS_RECV = 1005
    static WS_CLOSE_UNNORMAL = 1006
    static WS_CLOSE_INVALID_FRAME_PAYLOAD_DATA = 1007
    static WS_CLOSE_POLICY_VIOLATION = 1008
    static WS_CLOSE_MSG_TOO_BIG = 1009
    static WS_CLOSE_MISSING_EXTENSION = 1010
    static WS_CLOSE_INTERNAL_ERR = 1011
    static WS_CLOSE_SEVICE_RESTART = 1012
    static WS_CLOSE_TRY_AGAIN_LATER = 1013
    static WS_CLOSE_BAD_GATEWAY = 1014
    static WS_CLOSE_TLS_HANDSHAKE = 1015

    static LISTENER_MSG = 'msg';
    static LISTENER_CLIENTCLOSE = 'clientclose';

    wsReadyState = MyWebSocket.READY_STATE_CONNECTING;
    wsBinaryType = MyWebSocket.BINARY_TYPE_BLOB;
    wsProtocol = '';

    /**@type {number} 设置最大单帧内容长度，超出指定长度将自动关闭连接 默认Number.MAX_SAFE_INTEGER-1 9007199254740990*/
    maxFrameLength;

    constructor() {
        Assert(false, "please use decorate!");
    }

    _init() {
        this._currParse = this._parseFinOpcode;
        this._loadedLen = 0;
        this._payloadLen = 0;
        this._payloadLenBuf = Buffer.allocUnsafe(8);
        this._payloadLenBufOffset = 0;
        this._maskBuf = Buffer.allocUnsafe(4);
        this._maskBufOffset = 0;
        this._dataBufs = [];
        this._stringDecoder = new StringDecoder('utf8');
        this.closeCode = 0;
        this.closeReason = '';
        this.maxFrameLength = Number.MAX_SAFE_INTEGER - 1;
    }


    /**
     * @param {string} protocol 
     * @param {Buffer} head 
     */
    static _decorate(protocol, head) {
        Assert(!(this instanceof MyWebSocket || this instanceof MyWebSockets));
        Assert(this instanceof MySocket || this instanceof MySocket.MySockets);
        if (this instanceof MySocket) {
            Object.setPrototypeOf(this, MyWebSocket.prototype);
        } else {
            Object.setPrototypeOf(this, MyWebSockets.prototype);
        }

        WARN(this.toString(), "upgraded!");

        this._init();
        this.wsProtocol = protocol;
        this.wsReadyState = MyWebSocket.READY_STATE_OPEN;
        this.on('data', this._OnData.bind(this));
        this.on('close', this._OnClose.bind(this));
        this.on('error', err => this.wsReadyState = MyWebSocket.READY_STATE_CLOSING);
        if (head && head.byteLength) this._OnData(head);
    }



    /**
     * @param {string | Buffer} data 
     * @throws 'WebSocket is already in CLOSING or CLOSED state'
     */
    send(data = '') {
        if (this.wsReadyState !== MyWebSocket.READY_STATE_OPEN) {
            ERROR(this.toString(), 'Send failed: WebSocket is already in CLOSING or CLOSED state!');
            return;
        }

        let buf = data;
        let fop = 130;
        if (typeof data === "string") {
            buf = Buffer.from(data, 'utf8');
            fop = 129
        }
        const contentLen = buf.byteLength;
        let head;
        if (contentLen < 126) {
            head = Buffer.allocUnsafe(2);
            head[1] = contentLen;
        } else if (contentLen < 65536) {
            head = Buffer.allocUnsafe(4);
            head[1] = 126;
            head.writeUInt16BE(contentLen, 2);
        } else {
            head = Buffer.allocUnsafe(10);
            head[1] = 127;
            head.writeBigUInt64BE(BigInt(contentLen), 2);
        }
        head[0] = fop;
        this.write(head);
        this.write(buf);
    }

    sendPing() {
        if (this.wsReadyState !== MyWebSocket.READY_STATE_OPEN) {
            ERROR(this.toString(), 'Ping failed: WebSocket is already in CLOSING or CLOSED state!');
            return;
        }
        const buf = Buffer.allocUnsafe(2);
        buf[0] = 137;
        buf[1] = 0;
        this.write(buf);
    }

    /**
     * @param {Net.Socket} sock
     * @param {number} code 
     * @param {string} reason 最大不要超过123字节     发送时并不会对长度做检查
     */
    static close(sock, code, reason) {
        let buf;
        if (reason) {
            const reasonBuf = Buffer.from(reason);
            buf = Buffer.allocUnsafe(4 + reasonBuf.byteLength);
            buf[1] = 2 + reasonBuf.byteLength;
            reasonBuf.copy(buf, 4);
        } else {
            buf = Buffer.allocUnsafe(4);
            buf[1] = 2;
        }
        buf[0] = 136;
        buf.writeUInt16BE(code, 2);
        sock.end(buf);
    }

    /**
     * @param {number} code default 1000
     * @param {string} reason 最大不要超过123字节   发送时并不会对长度做检查
     */
    close(code = MyWebSocket.WS_CLOSE_NORMAL, reason = '') {
        if (this.wsReadyState !== MyWebSocket.READY_STATE_OPEN) return;
        this.wsReadyState = MyWebSocket.READY_STATE_CLOSING;
        this.closeCode = code;
        this.closeReason = reason;
        MyWebSocket.close(this, code, reason);
    }

    /**
     * @param {number} code 
     * @param {string} reason 最大不要超过123字节   发送时并不会对长度做检查
     */
    _closeForClientBadReq(code, reason) {
        this._currParse = null;
        this.close(code, reason);
    }

    _OnClose() {
        this.wsReadyState = MyWebSocket.READY_STATE_CLOSED;
        this.emit(MyWebSocket.LISTENER_CLIENTCLOSE, this, this.closeCode, this.closeReason);
    }




    /**
     * @param {Buffer} buf
     */
    _OnData(buf) {
        // console.log(buf);
        if (this._currParse)
            this._currParse(buf, 0, buf.byteLength);
    }


    /**解析fin opcode
     * @param {Buffer} buf 
     * @param {number} offset 
     * @param {number} buflen
     */
    _parseFinOpcode(buf, offset, buflen) {
        let b = buf[offset++];

        this._loadedLen = 0;
        this._payloadLen = 0;
        this._payloadLenBufOffset = 0;
        this._maskBufOffset = 0;

        this._fin = b >> 7;
        const op = b & 0x0F;
        if (op !== MyWebSocket.OPCODE_CONTINUE)//opcode==continue时不修改先前的opcode
            this._opcode = op;
        this._currParse = this._parsePayloadLen0;

        if (offset >= buflen) return;
        this._currParse(buf, offset, buflen);
    }
    /**解析payload len < 126
     * @param {Buffer} buf 
     * @param {number} offset 
     * @param {number} buflen
     */
    _parsePayloadLen0(buf, offset, buflen) {
        let b = buf[offset++];
        const mask = b >> 7;
        if (!mask) {
            this._closeForClientBadReq(MyWebSocket.WS_CLOSE_INVALID_FRAME_PAYLOAD_DATA, 'mask!=1');
            return;
        }

        let payloadLen = b & 0x7F;
        switch (payloadLen) {
            case 126:
                this._currParse = this._parsePayloadLen1;
                break;
            case 127:
                this._currParse = this._parsePayloadLen2;
                break;
            default:
                this._payloadLen = payloadLen;      //payload len < 126
                if (this._payloadLen > this.maxFrameLength) {
                    this._closeForClientBadReq(MyWebSocket.WS_CLOSE_MSG_TOO_BIG, `msg too big! max len ${this.maxFrameLength}`);
                    return;
                }
                this._currParse = this._parseMask;
                break;
        }

        if (offset >= buflen) return;
        this._currParse(buf, offset, buflen);
    }

    /**解析payload len < 65536
     * @param {Buffer} buf 
     * @param {number} offset 
     * @param {number} buflen
     */
    _parsePayloadLen1(buf, offset, buflen) {
        for (let i = 0; i < 2; i++) {
            let b = buf[offset++];
            this._payloadLenBuf[this._payloadLenBufOffset] = b;
            this._payloadLenBufOffset++;

            if (this._payloadLenBufOffset > 1) {
                this._payloadLen = this._payloadLenBuf.readUInt16BE(0);
                if (this._payloadLen > this.maxFrameLength) {
                    this._closeForClientBadReq(MyWebSocket.WS_CLOSE_MSG_TOO_BIG, `msg too big! max len ${this.maxFrameLength}`);
                    return;
                }
                this._currParse = this._parseMask;
                if (offset >= buflen) return;
                break;
            }
            if (offset >= buflen) return;
        }
        this._currParse(buf, offset, buflen);
    }

    /**解析payload len >= 65536
     * @param {Buffer} buf 
     * @param {number} offset 
     * @param {number} buflen
     */
    _parsePayloadLen2(buf, offset, buflen) {
        for (let i = 0; i < 8; i++) {
            let b = buf[offset++];
            this._payloadLenBuf[this._payloadLenBufOffset++] = b;

            if (this._payloadLenBufOffset > 7) {
                this._payloadLen = Number(this._payloadLenBuf.readBigUInt64BE(0));
                if (this._payloadLen > this.maxFrameLength) {
                    this._closeForClientBadReq(MyWebSocket.WS_CLOSE_MSG_TOO_BIG, `msg too big! max len ${this.maxFrameLength}`);
                    return;
                }
                this._currParse = this._parseMask;
                if (offset >= buflen) return;
                break;
            }
            if (offset >= buflen) return;
        }
        this._currParse(buf, offset, buflen);
    }

    /**解析mask
     * @param {Buffer} buf 
     * @param {number} offset 
     * @param {number} buflen
     */
    _parseMask(buf, offset, buflen) {
        for (let i = 0; i < 4; i++) {
            let b = buf[offset++];
            this._maskBuf[this._maskBufOffset++] = b;

            if (this._maskBufOffset > 3) {
                this._currParse = this._parseData;
                if (offset >= buflen && this._payloadLen > 0) return;
                break;
            }
            if (offset >= buflen) return;
        }
        this._currParse(buf, offset, buflen);
    }

    /**解析data
     * @param {Buffer} buf 
     * @param {number} offset 
     * @param {number} buflen
     */
    _parseData(buf, offset, buflen) {
        const haslen = buflen - offset;
        const remain = this._payloadLen - this._loadedLen;
        const additionalLen = haslen - remain;

        let len = additionalLen >= 0 ? remain : haslen;

        if (len > 0) {
            const tempBuf = Buffer.allocUnsafe(len);
            for (let i = 0; i < len; i++ , offset++ , this._loadedLen++) {
                tempBuf[i] = buf[offset] ^ this._maskBuf[this._loadedLen % 4];
            }
            this._dataBufs.push(tempBuf);
        }

        if (additionalLen >= 0) {
            this._currParse = this._parseFinOpcode;
            this._handleOneFrameRecved();
            //多收到的下一帧推回去       
            if (additionalLen > 0) {
                const addbuf = Buffer.from(buf.buffer, buflen - additionalLen, additionalLen);
                this.unshift(addbuf);
            }
        }
    }

    _handleOneFrameRecved() {
        switch (this._opcode) {
            case MyWebSocket.OPCODE_CONTINUE:
                break;
            case MyWebSocket.OPCODE_TEXT:
                this._handleText();
                break;
            case MyWebSocket.OPCODE_BINARY:
                this._handleBinary();
                break;
            case MyWebSocket.OPCODE_CLOSE:
                this._handleClose();
                break;
            case MyWebSocket.OPCODE_PING:
                this._handlePing();
                this._dataBufs = [];
                break;
            case MyWebSocket.OPCODE_PONG:
                this._handlePong();
                break
            default:
                this._closeForClientBadReq(MyWebSocket.WS_CLOSE_INVALID_FRAME_PAYLOAD_DATA, `unknown opcode: ${this._opcode}`);
                break;
        }
    }

    /**
     * @param {(ws : MyWebSocket, msg : string | Buffer)=>{}} cb 
     */
    onMessage(cb) {
        this.on(MyWebSocket.LISTENER_MSG, cb);
    }

    /**
     * @param {(ws : MyWebSocket, code: number, reason: string)=>{}} cb 
     */
    onceClientClose(cb) {
        this.on(MyWebSocket.LISTENER_CLIENTCLOSE, cb);
    }

    _handleText() {
        if (this._fin) {
            const msgs = [];
            const n = this._dataBufs.length;
            for (let i = 0; i < n; i++) {
                const buf = this._dataBufs[i];
                msgs.push(this._stringDecoder.write(buf));
            }
            this._stringDecoder.end();
            this._dataBufs = [];
            this.emit(MyWebSocket.LISTENER_MSG, this, msgs.join(''));
        }
    }

    _handleBinary() {
        if (this._fin) {
            const msgbuf = Buffer.concat(this._dataBufs);
            this._dataBufs = [];
            this.emit(MyWebSocket.LISTENER_MSG, this, msgbuf);
        }
    }

    _handleClose() {
        //服务器主动请求关闭后收到的关闭回复    
        if (this.wsReadyState === MyWebSocket.READY_STATE_CLOSING) {
            this.destroy();
            return;
        }

        //客户端请求关闭
        if (this._dataBufs.length > 0) {
            const msg = Buffer.concat(this._dataBufs);
            const closeCode = msg.readUInt16BE(0);
            const closeReason = this._stringDecoder.end(Buffer.from(msg.buffer, msg.byteOffset + 2, msg.byteLength - 2));
            this.close(closeCode, closeReason);
        } else {
            this.close();
        }

    }

    _handlePing() {
        let buf;
        if (this._dataBufs.length > 0) {
            const msg = Buffer.concat(this._dataBufs);
            const len = Math.min(125, msg.byteLength);
            buf = Buffer.allocUnsafe(2 + len);
            buf[1] = len;
            msg.copy(buf, 2, 0);
        } else {
            buf = Buffer.allocUnsafe(2);
            buf[1] = 0;
        }
        buf[0] = 138;
        this.write(buf);
        this._dataBufs = [];
    }

    _handlePong() {
        WARN(this.toString(), 'pong');
        this._dataBufs = [];
    }


    toString() {
        return `${Object.getPrototypeOf(MyWebSocket.prototype).toString.call(this)} websocket`;
    }

    /**
     * @param {MySocket} sock 
     * @param {string} protocol
     * @param {Buffer} head
     */
    static decorate(sock, protocol, head) {
        MyWebSocket._decorate.call(sock, protocol, head);
    }


}
module.exports = MyWebSocket;

/**
 * @param {MyHttpRequest} req 
 * @param {MySocket} sock 
 * @param {Buffer} head 
 * @param {IMyWebSocketHandler} wshandler 用于权限检查
 * @returns {Promise<boolean>} 握手成功返回true并添加进wshandler，否则返回false
 */
MyWebSocket.handshake =
    async function (req, sock, head, wshandler) {
        const key = req.headers[HttpConst.HEADER["Sec-WebSocket-Key"]];
        let protocol = req.headers[HttpConst.HEADER["Sec-WebSocket-Protocol"]];

        if (!key) {
            WARN(sock.toString(), "has no Sec-WebSocket-Key!");
            sock.end();
            return false;
        }

        if (!protocol) {
            WARN(sock.toString(), "has no protocol!");
            sock.end();
            return false;
        }

        try {
            await wshandler._privilegeCheck(sock, req);
        } catch (error) {
            WARN(sock.toString(), `privilegeCheck failed: ${error.message}`);
            sock.end();
            return false;
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

        MyWebSocket.decorate(sock, protocol, head);
        wshandler.add(sock);
        return true;
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


class MyWebSockets extends MySocket.MySockets { }
Object.defineProperties(MyWebSockets.prototype, Object.getOwnPropertyDescriptors(MyWebSocket.prototype));

MyWebSocket.MyWebSockets = MyWebSockets;
'user strict';
const Assert = require('assert');
const MyWebSocket = require('./MyWebSocket');
const { LOG, WARN, ERROR } = require('../MyUtil');
module.exports = class IMyWebSocketHandler {
    /**@type {Map<MyWebSocket , MyWebSocket>} */
    _websockets = new Map();
    /**
     * @param {MyWebSocket} ws 
     */
    add(ws) {
        this._websockets.set(ws, ws);
        ws.setKeepAlive(true);//打开KeepAlive
        ws.setTimeout(0);//不设置超时
        ws.once('close', hasErr => this.remove(ws));
        ws.once('error', err => this._onError(ws, err));
        ws.onMessage(this._onMessage.bind(this));
        ws.onClientClose(this._onClientClose.bind(this));
        this._setupWebSocket(ws);
    }
    /**
     * @param {MyWebSocket} ws 
     */
    remove(ws) {
        this._websockets.delete(ws);
    }

    removeAll() {
        this._websockets.clear()
    }

    count() {
        return this._websockets.size;
    }

    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        Assert(false, '必须重载该函数');
    }
    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        Assert(false, '必须重载该函数');
    }
    /**
     * @param {MyWebSocket} ws 
     * @param {number} code 
     * @param {string} reason
     */
    _onClientClose(ws, code, reason) {
        WARN(ws.toString(), 'client closed', code, reason);
    }
    /**
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        Assert(false, '必须重载该函数');
    }

}
'user strict';
const Assert = require('assert');
const MyWebSocket = require('./MyWebSocket');
const { LOG, WARN, ERROR } = require('../MyUtil');
module.exports = class IMyWebSocketHandler {
    _websockets = new Map();
    /**
     * @param {MyWebSocket} ws 
     */
    add(ws) {
        this._websockets.set(ws, ws);
        ws.once('close', hasErr => this.remove(ws));
        ws.onMessage(this._onMessage.bind(this));
        ws.onClientClose(this._onClientClose.bind(this));
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

}
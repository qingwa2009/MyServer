'user strict';
const MyWebSocket = require('./MyWebSocket');
module.exports = class IMyWebSocketHandler {
    _websockets = new Map();
    /**
     * @param {MyWebSocket} ws 
     */
    add(ws) {
        this._websockets.set(ws, ws);
        ws.once('close', hasErr => this.remove(ws));
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
}
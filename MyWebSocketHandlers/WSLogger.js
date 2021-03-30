'use strict';
const { IMyWebSocketHandler, MyWebSocket } = require('../MyHttp');
const { LOG, WARN, ERROR, IMyWebLogger } = require('../MyUtil');

class WSLogger extends IMyWebSocketHandler {

    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {

        ws.maxFrameLength = 256;
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        // console.log(msg);
        // ws.send(msg);
        // ws.close(1000, Array.from({ length: 10086 }, (_, i) => i));
        // ws.sendPing();
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        console.log(err);
    }

    //重载IMyWebLogger
    /**@param {string} msg */
    send(msg) {
        for (const ws of this._websockets.values()) {
            const tag = Object.getPrototypeOf(MyWebSocket.prototype).toString.call(ws);
            if (msg.includes(tag)) return;//过滤掉weblog socket的log信息
        }
        for (const ws of this._websockets.values()) {
            ws.send(msg);
        }
    }
}

module.exports = new WSLogger();
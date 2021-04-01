'use strict';
const { IMyWebSocketHandler, MyWebSocket, MyHttpRequest, MySocket } = require('../MyHttp');
const { LOG, WARN, ERROR } = require('../MyUtil');


class WSSamples extends IMyWebSocketHandler {

    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        ws.maxFrameLength = 1024 * 1204;
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        // console.log(msg);
        ws.send(msg);
        // ws.close(1000, Array.from({ length: 10086 }, (_, i) => i));
        // ws.sendPing();
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        WARN(err);
    }

    /**
     * 权限检查，通过返回true，否则返回false
     * @param {MySocket} sock
     * @param {MyHttpRequest} req
     * @returns {boolean} 
     * */
    _privilegeCheck(sock, req) {
        return true;
    }
}
module.exports = new WSSamples();
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
     * 权限检查，检查失败抛出异常
     * @param {MySocket} sock
     * @param {MyHttpRequest} req
     * @throws {Exception} 
     * */
    async _privilegeCheck(sock, req) {
        // await new Promise((res, rej) => {
        //     setTimeout(() => {
        //         Math.random() > 0.5 ? res() : rej(new Error('random reject error!'));
        //     }, 3000);
        // })
    }
}
module.exports = new WSSamples();
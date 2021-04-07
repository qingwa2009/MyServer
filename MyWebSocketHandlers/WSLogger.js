'use strict';
const { IMyWebSocketHandler, MyWebSocket, MyHttpRequest, MySocket } = require('../MyHttp');
const MyUtil = require('../MyUtil');
const { LOG, WARN, ERROR, IMyWebLogger, } = MyUtil;

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
        try {
            var json = JSON.parse(msg);
            const debug = json.debug;
            if (debug) {
                if (debug.log !== undefined) {
                    MyUtil.setEnableLog(!!debug.log);
                }
                if (debug.warn !== undefined) {
                    MyUtil.setEnableWarn(!!debug.warn);
                }
                if (debug.error !== undefined) {
                    MyUtil.setEnableError(!!debug.error);
                }
                if (debug.weblog !== undefined) {
                    MyUtil.setEnableWeblog(!!debug.weblog);
                }
            }
        } catch (error) {
            ws.close(MyWebSocket.WS_CLOSE_INVALID_FRAME_PAYLOAD_DATA, "msg must be json!");
        }
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

module.exports = new WSLogger();
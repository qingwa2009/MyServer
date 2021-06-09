'use strict';
const Assert = require('assert');
const { IMyWebSocketHandler, MyWebSocket, IMyServer, MyHttpRequest, MySocket } = require('../MyHttp');
const MyUtil = require('../MyUtil')
const { LOG, WARN, ERROR } = MyUtil;


class WSServerStatus extends IMyWebSocketHandler {
    /**@type {IMyServer[]} */
    servers = [];

    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        if (!this.servers.includes(ws._myServer)) {
            this.servers.push(ws._myServer);
            ws._myServer.onStatusChange(this._onServerStatusChange.bind(this, ws._myServer));
        }
        ws.maxFrameLength = 255;
    }

    _onServerStatusChange(server) {
        //server.status().then大部分数据都是共享的所以全部更新吧
        for (let i = 0; i < this.servers.length; i++) {
            const server = this.servers[i];
            server.status().then(
                status => {
                    for (const ws of this._websockets.values()) {
                        if (ws._myServer === server) {
                            ws.send(status);
                        }
                    }
                }
            ).catch(err => { });
        }
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        // console.log(msg);  
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
            // ws.close(MyWebSocket.WS_CLOSE_INVALID_FRAME_PAYLOAD_DATA, "msg must be json!");
        }
        this._onServerStatusChange(ws._myServer);
    }



    /**
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        WARN(err.stack || err);
    }

    /**
     * 权限检查，检查失败抛出异常
     * @param {MySocket} sock
     * @param {MyHttpRequest} req
     * @throws {Exception} 
     * */
    async _privilegeCheck(sock, req) {

    }
}
module.exports = new WSServerStatus();
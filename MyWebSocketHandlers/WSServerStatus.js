'use strict';
const Assert = require('assert');
const { IMyWebSocketHandler, MyWebSocket, IMyServer } = require('../MyHttp');
const { LOG, WARN, ERROR } = require('../MyUtil');


class WSServerStatus extends IMyWebSocketHandler {
    /**@type {IMyServer} */
    server = null;

    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        if (!this.server) {
            this.server = ws._myServer
            this.server.onStatusChange(this._onServerStatusChange.bind(this));
        }
        ws.maxFrameLength = 255;
    }

    _onServerStatusChange() {
        this.server.status().then(
            status => {
                for (const ws of this._websockets.values()) {
                    ws.send(status);
                }
            }
        ).catch(err => { });
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        // console.log(msg);
        this._onServerStatusChange();
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        WARN(err);
    }
}
module.exports = new WSServerStatus();
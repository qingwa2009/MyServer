'use strict';
const { IMyWebSocketHandler, MyWebSocket } = require('../MyHttp');
const { LOG, WARN, ERROR } = require('../MyUtil');

const P_ID = "id"
const P_ACT = "act"
const P_X = "x"
const P_y = "y"
const P_SELF = "self"

const ACT_ADD = "add"
const ACT_DEL = "del"
const ACT_MOV = "mov"


class WSMultiplayer extends IMyWebSocketHandler {
    id = 0;
    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        ws.maxFrameLength = 256;
        ws.id = this.id++;

        this.sendNewPlayerToAll(ws);
        this.sendAllToNewPlayer(ws);
    }

    /**
     * @param {MyWebSocket} ws 
     */
    remove(ws) {
        super.remove(ws);
        const msg = this.delPlayerMsg(ws);
        this.sendToAll(msg);
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        this.sendToAll(msg);//转发
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        ERROR(err);
    }

    addPlayerMsg(ws, isSelf = false) {
        const dic = {
            [P_ID]: ws.id,
            [P_ACT]: ACT_ADD
        };
        if (isSelf) dic[P_SELF] = true;
        return JSON.stringify(dic);
    }

    delPlayerMsg(ws) {
        return JSON.stringify({
            [P_ID]: ws.id,
            [P_ACT]: ACT_DEL
        });
    }

    sendNewPlayerToAll(ws) {
        const msg = this.addPlayerMsg(ws);
        for (const ws0 of this._websockets.values()) {
            if (ws === ws0) continue;
            ws0.send(msg);
        }
    }

    sendAllToNewPlayer(ws) {
        for (const ws0 of this._websockets.values()) {
            const msg = ws === ws0 ? this.addPlayerMsg(ws0, true) : this.delPlayerMsg(ws0);
            ws.send(msg);
        }
    }

    sendToAll(msg) {
        for (const ws of this._websockets.values()) {
            ws.send(msg);
        }
    }

}
module.exports = new WSMultiplayer();
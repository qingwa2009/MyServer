'use strict';
const { IMyWebSocketHandler, MyWebSocket } = require('../MyHttp');
class WSSamples extends IMyWebSocketHandler {
    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        console.log(msg);
        // ws.close(MyWebSocket.WS_CLOSE_MSG_TOO_BIG, '你是烧饼！');
    }
}
module.exports = new WSSamples();
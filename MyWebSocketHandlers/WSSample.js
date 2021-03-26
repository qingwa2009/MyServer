'use strict';
const { IMyWebSocketHandler, MyWebSocket } = require('../MyHttp');
class WSSamples extends IMyWebSocketHandler {
    add(ws) {
        super.add(ws);
    }
}
module.exports = new WSSamples();
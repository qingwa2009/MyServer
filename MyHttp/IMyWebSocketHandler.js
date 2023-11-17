'user strict';
const Assert = require('assert');
const MyWebSocket = require('./MyWebSocket');
const MyHttpRequest = require('./MyHttpRequest');
const MySocket = require('./MySocket');
const IMyServer = require('./IMyServer');
const { LOG, WARN, ERROR, uuidv4 } = require('../MyUtil');
module.exports = class IMyWebSocketHandler {
    /**@type {Map<MyWebSocket , MyWebSocket>} */
    _websockets = new Map();
    createID(){
        let id="";
        do{
            id = uuidv4();
        }while(this._websockets.has(id));
        return id;
    }
    /**
     * @param {MyWebSocket} ws 
     */
    add(ws) {        
        const id = this.createID();
        ws.id=id;
        this._websockets.set(id, ws);
        // ws.setKeepAlive(true);//打开KeepAlive
        ws.setTimeout(0);//不设置超时
        ws.once('close', hasErr => this.remove(ws));
        ws.once('error', err => this._onError(ws, err));
        ws.onMessage(this._onMessage.bind(this));
        ws.onceClientClose(this._onClientClose.bind(this));
        this._setupWebSocket(ws);
    }
    /**
     * @param {MyWebSocket} ws 
     */
    remove(ws) {
        this._websockets.delete(ws.id);
    }
    /**
     * @param {string} id 
     */
    removeByID(id){
        this._websockets.delete(id);
    }

    removeAll() {
        this._websockets.clear()
    }

    get count() {
        return this._websockets.size;
    }

    *eachWebSocket() {
        for (const ws of this._websockets.values()) {
            yield ws;
        }
    }

    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        Assert(false, '必须重载该函数');
    }
    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        Assert(false, '必须重载该函数');
    }
    /**
     * @param {MyWebSocket} ws 
     * @param {number} code 
     * @param {string} reason
     */
    _onClientClose(ws, code, reason) {
        WARN(ws.toString(), 'client closed', code, reason);
    }
    /**
     * client强行关闭时会有read ECONNRESET的错误，_onClientClose会收到1001 (WS_CLOSE_GOING_AWAY)
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        Assert(false, '必须重载该函数');
    }

    /**
     * 权限检查，检查失败抛出异常
     * @param {MySocket} sock
     * @param {MyHttpRequest} req
     * @throws {Exception} 
     * */
    async _privilegeCheck(sock, req) {
        Assert(false, '必须重载该函数');
    }

}
'use strict';
const FS = require('fs');
const Path = require('path');
const { IMyWebSocketHandler, MyWebSocket, MyHttpRequest, MySocket } = require('../../MyHttp');
const Application = require("../../Application");
const { LOG, WARN, ERROR } = require('../../MyUtil');

const SIG_TYPE_ERROR=0;
const SIG_TYPE_ID = 1;
const SIG_TYPE_DESCRIPTION=2;
const SIG_TYPE_CANDIDATE=3;
const TYPES_USERLIST='userlist';
const TYPES_ERROR='error';
    
class WSWebRTCSignalingServer extends IMyWebSocketHandler {
    /**@type {Map<string , {id:string, name:string}>} */
    users=new Map();
    
    /**
     * @param {string} id
     * @param {string} name 
     */
    addUser(id, name){       
        const user={id,name}; 
        this.users.set(id,user);
    }

    /**    
     * @param {string} id 
     */
    removeUser(id){
        this.users.delete(id);
        this.notifyUserlist();
    }

    getUserList(){
        return Array.from(this.users.values());
    }

    notifyUserlist(){
        const msg={
            type:TYPES_USERLIST,
            data:this.getUserList()
        };
        const str=JSON.stringify(msg);
        for (const ws of this.eachWebSocket()) {
            ws.send(str);
        }
    }

    /**    
     * @param {MyWebSocket} ws 
     */
    onCloseWs(ws){
        this.removeUser(ws.id);
    }

    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        // ws.maxFrameLength = 125;
        const name="";
        this.addUser(ws.id, name);
        const msg={
            type:SIG_TYPE_ID,
            data:ws.id
        };
        ws.send(JSON.stringify(msg));
        this.notifyUserlist();
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {string}errstr
     */
    respErr(ws, errstr){
        ws.send(JSON.stringify({type:TYPES_ERROR, data: errstr}));
    }
    /**
     * @param {MyWebSocket} ws 
     */
    respUserList(ws){
        const msg={
            type:TYPES_USERLIST, 
            data: this.getUserList()
        };
        ws.send(JSON.stringify(msg));
    }
    
    /**
     * @param {MyWebSocket} ws 
	 * @param {{type: number, from: string, to: string, data: object}} msg
     */
    _onMessage(ws, msg) {
        msg = JSON.parse(msg);
        switch (msg.type) {
            case TYPES_USERLIST:
                this.respUserList(ws);
                break;
            default:
                const target=this._websockets.get(msg.to);
                if(target){
                    target.send(JSON.stringify(msg));
                }else{
                    this.respErr(ws,"target not found!");
                }
                break;
        }
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {NodeJS.ErrnoException} err
     */
    _onError(ws, err) {
        WARN(err.stack || err);
    }
    /**
     * @param {MyWebSocket} ws 
     * @param {number} code 
     * @param {string} reason
     */
    _onClientClose(ws, code, reason) {
        super._onClientClose(ws, code, reason);
        this.onCloseWs(ws);
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
module.exports = new WSWebRTCSignalingServer();
'use strict';
const FS = require('fs');
const Path = require('path');
const { IMyWebSocketHandler, MyWebSocket, MyHttpRequest, MySocket } = require('../../MyHttp');
const Application = require("../../Application");
const { LOG, WARN, ERROR } = require('../../MyUtil');

const TYPES_MYID='myid';
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
        const str=JSON.stringify({type:TYPES_USERLIST,data:this.getUserList()});
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
     * @param {{type: string, id: string, target: string, data: object}}msg 
     */
    respUserList(ws, msg){
        ws.send(JSON.stringify({type:TYPES_USERLIST, data: this.getUserList()}));
    }
    /**
     * @param {MyWebSocket} ws 
     * @param {{type: string, id: string, target: string, data: object}}msg 
     */
     respRegister(ws, msg){
         const user=this.users.get(ws.id);
         user.name= msg.data.toString();
         ws.send(JSON.stringify({type:TYPES_MYID, id: msg.id, data:user}));
         this.notifyUserlist();
    }
    
    /**
     * @param {MyWebSocket} ws 
     * @param {{type: string, id: string, target: string, data: object}}msg 
     */
    _onMessage(ws, msg) {
        msg = JSON.parse(msg);
        const id = ws.id;
        msg.id=id;
        switch (msg.type) {
            case TYPES_MYID:
                this.respRegister(ws, msg);
                break;
            case TYPES_USERLIST:
                this.respUserList(ws, msg);
                break;
            default:
                const target=this._websockets.get(msg.target);
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
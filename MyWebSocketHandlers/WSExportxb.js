'use strict';
const FS = require('fs');
const Path = require('path');
const { IMyWebSocketHandler, MyWebSocket, MyHttpRequest, MySocket } = require('../MyHttp');
const { LOG, WARN, ERROR } = require('../MyUtil');

const watchFolder = "/upload/";
class WSExportxb extends IMyWebSocketHandler {
    /**@type {FS.FSWatcher} */
    watcher = null
    /**
     * 在添加WebSocket时对其进行设定
     * @param {MyWebSocket} ws 
     */
    _setupWebSocket(ws) {
        ws.maxFrameLength = 125;
        if (this.watcher === null) {
            const path = Path.join(ws._myServer.websiteSetting.root, watchFolder);
            this.watcher = FS.watch(path);
            this.watcher.on('change', () => this.notifyFolderChange());
        }
    }

    notifyFolderChange() {
        for (const ws of this.eachWebSocket()) {
            ws.send('更新列表');//没啥用，只是通知一下，懒得改前端了
        }
    }

    /**
     * @param {MyWebSocket} ws 
     * @param {string | Buffer} msg 
     */
    _onMessage(ws, msg) {
        // console.log(msg);
        // ws.send(msg);
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
     * 权限检查，通过返回true，否则返回false
     * @param {MySocket} sock
     * @param {MyHttpRequest} req
     * @returns {boolean} 
     * */
    _privilegeCheck(sock, req) {
        return true;
    }
}
module.exports = new WSExportxb();
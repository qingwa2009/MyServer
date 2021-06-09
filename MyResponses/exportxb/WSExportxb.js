'use strict';
const FS = require('fs');
const Path = require('path');
const { IMyWebSocketHandler, MyWebSocket, MyHttpRequest, MySocket } = require('../../MyHttp');
const Application = require("../../Application");
const { LOG, WARN, ERROR } = require('../../MyUtil');

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
            const path = Path.join(ws._myServer.websiteSetting.root, Application.xb_export_folder);

            try {
                FS.mkdirSync(path);
            } catch (error) {
                if (error.code !== "EEXIST")
                    console.log(error);
            }
            try {
                this.watcher = FS.watch(path);
                this.watcher.on('change', () => this.notifyFolderChange());
            } catch (error) {
                ERROR(`server error on wathing ${path}: ${error.toStrinig()}`);
            }
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
module.exports = new WSExportxb();
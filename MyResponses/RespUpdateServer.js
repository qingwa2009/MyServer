'use strict';
const Path = require('path');
const FS = require('fs');
const child_process = require('child_process');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        const logPath = `${Path.dirname(__dirname)}/updateServer.log`;
        //-------------------
        if (req.method !== HttpConst.METHOD.Post) {
            this.respFile(req, logPath, server, true, HttpConst.CONTENT_TYPE.GBK);
            return;
        }
        //权限验证，没写  
        //-------------------        
        const out = FS.openSync(logPath, 'w');
        const cp = child_process.fork(`${Path.dirname(__dirname)}/serverRestarter.js`, [], { cwd: __dirname, detached: true, stdio: ['ignore', out, out, 'ipc'] });
        cp.unref();
        process.exit(0);
    }
}

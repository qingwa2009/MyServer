'use strict';
const Path = require('path');
const child_process = require('child_process');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class RespUpdateServer extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        //-------------------
        //权限验证，没写  
        //-------------------
        const cp = child_process.spawn(`node ${Path.dirname(__dirname)}/serverRestarter.js`, [], { detached: true, stdio: 'inherit', shell: true });
        cp.unref();
        cp.on("exit", (code, signal) => {
            process.exit(0);
        })
    }
}

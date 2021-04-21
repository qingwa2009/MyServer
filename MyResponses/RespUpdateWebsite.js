'use strict';
const Path = require('path');
const child_process = require('child_process');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class RespUpdateWebsite extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        //-------------------
        //权限验证，没写  
        //-------------------

        child_process.execSync("chcp 65001");//命令行utf8编码
        child_process.execFile(Path.join(Path.dirname(server.websiteSetting.root), "updateWebsite.bat"), (err, stdout, stderr) => {
            if (err) {
                this.statusCode = 500;
                this.end(stderr || err.message);
                return;
            }
            this.statusCode = 200;
            this.end(stdout);
        });
    }



}

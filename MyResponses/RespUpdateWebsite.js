'use strict';
const Path = require('path');
const child_process = require('child_process');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

var isUpdating = false;

module.exports = class RespUpdateWebsite extends MyHttpResponse {

    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        //-------------------
        //权限验证，没写  
        //-------------------
        if (isUpdating) {
            this.respString(req, 200, "is already updating!");
            return;
        }

        isUpdating = true;
        server.fm.releaseAllFileReading();
        setTimeout(() => {
            // child_process.execSync("chcp 65001");//命令行utf8编码 但是cd不进中文目录orz        
            child_process.execFile(Path.join(Path.dirname(server.websiteSetting.root), "updateWebsite.bat"), [], { encoding: Buffer }, (err, stdout, stderr) => {
                this.setHeader(HttpConst.HEADER["Content-Type"], HttpConst.CONTENT_TYPE.GBK);
                if (err) {
                    this.statusCode = 500;
                    this.end(stderr || err.message);
                    return;
                }
                this.statusCode = 200;
                this.end(stdout);
                isUpdating = false;
            });
        }, 3000);
    }



}

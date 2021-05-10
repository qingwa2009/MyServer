'use strict';
const Path = require('path');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

const UPLOAD_ROOT = "/upload/";

module.exports = class RespExportXBUpload extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        // req.socket.setTimeout(1000);
        if (!this.checkIsMethod(req, HttpConst.METHOD.Post)) return;
        if (!this.checkContentLen(req)) return;

        let fileName = req.headers['file-name'];
        if (!fileName) {
            this.respError(req, 400, `header must contain: file-name!`);
            return;
        }
        fileName = decodeURI(fileName);
        fileName = fileName.replace(/\s/ig, " ");//所有空白字符替换成空格
        const path = Path.join(server.websiteSetting.root, UPLOAD_ROOT, fileName);
        this.handleUpload(req, server, path);
    }

}

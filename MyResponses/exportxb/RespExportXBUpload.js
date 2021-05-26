'use strict';
const Path = require('path');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../../MyHttp');
const Application = require("../../Application");
const { LOG, WARN, ERROR } = require('../../MyUtil');

module.exports = class extends MyHttpResponse {
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
        const path = Path.join(server.websiteSetting.root, Application.xb_export_folder, fileName);
        this.handleUpload(req, path);
    }

}

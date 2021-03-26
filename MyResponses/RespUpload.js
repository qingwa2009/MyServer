'use strict';
const Path = require('path');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class RespUpload extends MyHttpResponse {
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
        const path = Path.join(server.websiteSetting.upload_folder, fileName);
        this.handleUpload(req, server, path);
    }

}

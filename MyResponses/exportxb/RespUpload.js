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
        if (this.respIfMethodIsNot(req, HttpConst.METHOD.Post)) return;
        if (this.respIfContLenNotInRange(req, 1, 1024 * 1024 * 1024 * 2)) return;

        let fileName = req.headers['file-name'];
        if (!fileName) {
            this.respError(req, 400, `header must contain: file-name!`);
            return;
        }

        let path;
        try {
            fileName = decodeURI(fileName);
            fileName = fileName.replace(/\s/ig, " ");//所有空白字符替换成空格
            path = Path.join(server.websiteSetting.root, Application.xb_export_folder, fileName);
        } catch (error) {
            this.respError(req, 500, error.message);
            return;
        }
        this.handleUpload(req, path);
    }

}
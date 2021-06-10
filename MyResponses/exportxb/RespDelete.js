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
        if (this.respIfMethodIsNot(req, HttpConst.METHOD.Get)) return;

        const qs = { file: "" };
        if (this.respIfQueryIsInvalid(req, qs)) return;

        if (qs.file === "") {
            this.respError(req, 400, 'file name can not be empty!');
            return;
        }

        const path = Path.join(server.websiteSetting.root, Application.xb_export_folder, qs.file);
        Application.fm.deleteFile(path).then(() => {
            this.respString(req, 200);
        }).catch(err => {
            this.respError(req, 400, err.toString());
        });

    }

}

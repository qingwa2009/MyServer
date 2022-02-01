'use strict';
const Path = require('path');
const FS = require("fs");
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../../MyHttp');
const Application = require("../../Application");
const { LOG, WARN, ERROR, MyFileManager } = require('../../MyUtil');

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

        let path = "";
        const suffix = '.temp';
        try {
            fileName = decodeURI(fileName);
            fileName = fileName.replace(/\s/ig, " ") + suffix;//所有空白字符替换成空格
            path = this.joinOrRespIfPathNotInFolder(req, Path.join(server.websiteSetting.root, Application.xb_export_folder), fileName);
            if (!path) return;

        } catch (error) {
            this.respError(req, 500, error.message);
            return;
        }
        this.handleUpload(req, path, () => {
            return new Promise((res, rej) => {
                FS.rename(path, path.substr(0, path.length - suffix.length), (error) => {
                    if (error) {
                        Application.fm.deleteFile(path).catch(err => { });
                        rej(error);
                    } else {
                        res();
                    }
                })
            });
        });
    }

}

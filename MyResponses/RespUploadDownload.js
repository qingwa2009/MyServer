'use strict';
const Path = require('path');
const FS = require('fs');
const Application = require("../Application");
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');
const { MyFileManager, formatDate } = require('../MyUtil');

const { LOG, WARN, ERROR } = require('../MyUtil');
const MyUtil = require('../MyUtil');

module.exports = class extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        if (req.method === HttpConst.METHOD.Post) {
            //上传
            if (this.respIfContLenNotInRange(req, 1, 1095216660480)) return;
            let fileName = req.headers['file-name'];
            if (!fileName || (typeof fileName !== "string")) {
                this.respError(req, 400, `header must contain: file-name string!`);
                return;
            }

            fileName = decodeURI(fileName);
            let path = this.joinOrRespIfPathNotInFolder(req, server.websiteSetting.upload_folder, fileName);
            if (!path) return;

            this.handleUpload(req, path);
            return;
        }

        const qs = { del: null, file: null };
        if (this.respIfQueryIsInvalid(req, qs)) return;

        if (qs.del) {
            const path = this.joinOrRespIfPathNotInFolder(req, server.websiteSetting.upload_folder, qs.del);
            if (!path) return;

            this.handleDeleteFile(req, path);
            return;
        }

        if (!qs.file) {
            this.handleGetFileList(req, server.websiteSetting.upload_folder);
            return;
        } else {
            const path = this.joinOrRespIfPathNotInFolder(req, server.websiteSetting.upload_folder, qs.file);
            if (!path) return;

            this.handleGetFile(req, path);
            return;
        }
    }

    /**
     * @param {MyHttpRequest} req      
     * @param {string} path 
     */
    handleDeleteFile(req, path) {
        Application.fm.deleteFile(path).then(
            () => {
                this.respString(req, 200);
            },
            err => {
                this.respError(req, 500, err.message);
            }
        );
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {string} folder 
     */
    handleGetFileList(req, folder) {
        Application.fm.getFileList(folder).then(
            stats => {
                var ss = [];
                for (let i = 0; i < stats.length; i++) {
                    const s = stats[i];
                    if (!s.isFile()) continue;
                    ss.push(this.extractFileStat(s));
                }
                this.respString(req, 200, JSON.stringify(ss));
            },
            err => {
                this.respError(req, 500, err.message);
            }
        )
    }
    /**
     * @param {FS.Stats} stat 
     */
    extractFileStat(stat) {
        return [stat.fileName, stat.size, formatDate(stat.mtime)];
    }
    /**
     * @param {MyHttpRequest} req      
     * @param {string} path 
     */
    handleGetFile(req, path) {
        const ifRange= req.headers[HttpConst.HEADER["If-Range"]];        
        this.respFile(req, path, "*/*",  ifRange);
    }
}


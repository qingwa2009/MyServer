'use strict';
const Path = require('path');
const FS = require('fs');
const Application = require("../Application");
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');
const { MyFileManager, formatDate } = require('../MyUtil');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class extends MyHttpResponse {
    static CMD_DEL = 'del';
    static CMD_FILE = 'file';
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {

        if (req.method === HttpConst.METHOD.Post) {
            if (!this.checkContentLen(req, 1, 1095216660480)) return;
            let fileName = req.headers['file-name'];
            if (!fileName) {
                this.respError(req, 400, `header must contain: file-name!`);
                return;
            }
            fileName = decodeURI(fileName);
            const path = Path.join(server.websiteSetting.upload_folder, fileName);
            this.handleUpload(req, path);
            return;
        }

        const del = req.querys[module.exports.CMD_DEL];
        if (del) {
            if (!this.checkQueryIsStr(req, del, module.exports.CMD_DEL)) return;
            const path = Path.join(server.websiteSetting.upload_folder, decodeURI(del));
            this.handleDeleteFile(req, path);
            return;
        }

        const f = req.querys[module.exports.CMD_FILE] || '';
        if (f === '') {
            this.handleGetFileList(req, server.websiteSetting.upload_folder);
            return;
        } else {
            if (!this.checkQueryIsStr(req, f, module.exports.CMD_FILE)) return;

            const path = Path.join(server.websiteSetting.upload_folder, decodeURI(f));
            this.handleGetFile(req, server, path);
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
     * @param {IMyServer} server 
     * @param {string} path 
     */
    handleGetFile(req, server, path) {
        this.respFile(req, path, server, false);
    }
}


'use strict';
const Path = require('path');
const FS = require('fs');

const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');
const { MyFileManager, formatDate } = require('../MyUtil');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class RespUploadDownload extends MyHttpResponse {
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
            this.handleUpload(req, server, path);
            return;
        }

        const del = req.querys[RespUploadDownload.CMD_DEL];
        if (del) {
            if (typeof del !== 'string') {
                this.respError(req, 400, `query '${RespUploadDownload.CMD_DEL}' is not string or is array`);
                return;
            }
            const path = Path.join(server.websiteSetting.upload_folder, decodeURI(del));
            this.handleDeleteFile(req, server, path);
            return;
        }

        const f = req.querys[RespUploadDownload.CMD_FILE] || '';
        if (f === '') {
            this.handleGetFileList(req, server, server.websiteSetting.upload_folder);
            return;
        } else {
            const path = Path.join(server.websiteSetting.upload_folder, decodeURI(f));
            this.handleGetFile(req, server, path);
            return;
        }


    }

    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server 
     * @param {string} path 
     */
    handleDeleteFile(req, server, path) {
        server.fm.deleteFile(path).then(
            () => {
                this.respError(req, 200);
            },
            err => {
                this.respError(req, 500, err.message);
            }
        );
    }

    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server 
     * @param {string} folder 
     */
    handleGetFileList(req, server, folder) {
        server.fm.getFileList(folder).then(
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
        FS.stat(path, (err, stat) => {
            if (err) {
                if (err.code === 'ENOENT')
                    this.respError(req, 404, err.message);
                else
                    this.respError(req, 500, err.message);
                return;
            }
            if (!stat.isFile()) {
                this.respError(req, 400, `the request file is not a file!`);
                return;
            }
            this.respFile(req, path, stat, server, false);
        });
    }
}


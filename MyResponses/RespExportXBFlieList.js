'use strict';
const Path = require('path');
const FS = require('fs');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

const UPLOAD_ROOT = "/upload/";

module.exports = class RespExportXBFlieList extends MyHttpResponse {

    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        // if (!this.checkIsMethod(req, HttpConst.METHOD.Post)) return;
        // if (!this.checkContentLen(req)) return;
        let query = req.querys['type'];
        if (!this.checkQueryIsStr(req, query, 'type')) return;
        query = query.toUpperCase();


        switch (req.method) {
            case HttpConst.METHOD.Get:
                switch (query) {
                    case 'EXPORTING':
                    case 'EXPORTED':
                        const folder = Path.join(server.websiteSetting.root, UPLOAD_ROOT);
                        this.getFileList(folder, query).then(fs => {
                            this.respString(req, 200, JSON.stringify(fs));
                        }).catch(err => {
                            this.respString(req, 200, '[]');
                        });
                        break;
                    default:
                        this.respError(req, 400, "'GET' query must be type=[EXPORTING | EXPORTED]");
                        break;
                }
                break;
            case HttpConst.METHOD.Post:
                if (query === 'DELETE') {
                    req.onceReqBodyRecvComplete(datas => {
                        const s = datas.join('');
                        const path = Path.join(server.websiteSetting.root, UPLOAD_ROOT, s);
                        server.fm.deleteFile(path).then(() => {
                            this.respString(req, 200);
                        }).catch(err => {
                            this.respError(req, 400, err.toString());
                        });
                    });
                } else {
                    this.respErrorAndPauseRecvStream(req, 400, "'POST' query must be type=DELETE");
                }
                break;
            default:
                this.respError(req, 405, "please use 'GET' or 'POST' method!");
                break;
        }
    }


    /**     
     * @param {string} folder 
     * @param {string} type EXPORTING | EXPORTED
     * @returns {Promise<string[]>}
     */
    getFileList(folder, type) {
        return new Promise((res, rej) => {
            FS.readdir(folder, (err, files) => {
                if (err) {
                    rej(err);
                } else {
                    const fs = [];
                    const reg = type === 'EXPORTING' ? /.sld(prt|asm)$/i : /.x_b$/i;
                    for (let i = 0; i < files.length; i++) {
                        const f = files[i];
                        if (reg.test(f)) fs.push(f);
                    }
                    res(fs);
                }
            });
        })
    }

}

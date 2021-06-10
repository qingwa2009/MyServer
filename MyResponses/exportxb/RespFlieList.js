'use strict';
const Path = require('path');
const FS = require('fs');
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
        // if (this.respIfContLenNotInRange(req)) return;

        const qs = { type: "" };
        if (this.respIfQueryIsInvalid(req, qs)) return;

        qs.type = qs.type.toUpperCase();

        switch (qs.type) {
            case 'EXPORTING':
            case 'EXPORTED':
                const folder = Path.join(server.websiteSetting.root, Application.xb_export_folder);
                this.getFileList(folder, qs.type).then(fs => {
                    this.respString(req, 200, JSON.stringify(fs));
                }).catch(err => {
                    this.respString(req, 200, '[]');
                });
                break;
            default:
                this.respError(req, 400, "'GET' query must be type=[EXPORTING | EXPORTED]");
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

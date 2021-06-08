'use strict';
const Path = require("path");
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../../../MyHttp');
const Application = require("../../../Application");
const { LOG, WARN, ERROR } = require('../../../MyUtil');

let itemImgFolder = "";//= Path.resolve(__dirname, "../../../sample/itemImgs");
const qImg = "img";
const qItemNo = "itemno";
module.exports = class extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        itemImgFolder = Path.resolve(server.websiteSetting.root, "./img/itemImgs");
        try {
            switch (req.method) {
                case HttpConst.METHOD.Get:
                    this.handleGet(req);
                    break;
                case HttpConst.METHOD.Post:
                    this.handlePost(req);
                    break;
                default:
                    this.respError(req, 405, "please use 'GET' or 'POST' method!");
                    break;
            }
        } catch (error) {
            this.respError(req, 500, error.message);
        }
    }

    getImgPathOrRespError(/**@type{MyHttpRequest} */req) {
        const imgName = req.querys[qImg];
        if (this.respIfQueryIsNotStr(req, imgName, qImg, true)) return null;
        return Path.join(itemImgFolder, imgName.substr(0, 1), imgName.substr(0, 3), imgName);
    }

    handleGet(/**@type{MyHttpRequest} */req) {
        let path = this.getImgPathOrRespError(req);
        if (path) this.respFile(req, path, 'image/png');
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (this.respIfContLenNotInRange(req, 2, 10 * 1024 * 1024)) return;
        let path = this.getImgPathOrRespError(req);
        const itemNo = req.querys[qItemNo];
        if (this.respIfQueryIsNotStr(req, itemNo, qItemNo, true)) return;
        if (path) {
            Application.dbMyPLMPool.updateItemLastUpdateTime(itemNo).then(b => {

            }, error => {

            });
            this.handleUpload(req, path);
        }
    }
}

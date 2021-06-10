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

    getImgPathOrRespError(imgName) {
        if (!imgName) {
            this.respError(req, 400, `query type error：img must not be empty string`);
            return false;
        }
        return Path.join(itemImgFolder, imgName.substr(0, 1), imgName.substr(0, 3), imgName);
    }

    handleGet(/**@type{MyHttpRequest} */req) {
        const qs = { img: "" };
        if (this.respIfQueryIsInvalid(req, qs)) return;

        let path = this.getImgPathOrRespError(qs.img);
        if (path) this.respFile(req, path, 'image/png');
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (this.respIfContLenNotInRange(req, 2, 10 * 1024 * 1024)) return;

        const qs = { itemno: "", img: "" };
        if (this.respIfQueryIsInvalid(req, qs)) return;
        if (!qs.itemno) {
            this.respError(req, 400, `query type error：itemno must not be empty string`);
            return;
        }
        let path = this.getImgPathOrRespError(qs.img);
        if (path) {
            Application.dbMyPLM.updateItemLastUpdateTime(itemNo).then(b => {
            }, error => {
            });
            this.handleUpload(req, path);
        }
    }
}

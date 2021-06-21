'use strict';
const Path = require("path");
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../../../MyHttp');
const Application = require("../../../Application");
const { LOG, WARN, ERROR } = require('../../../MyUtil');

// let itemImgFolder = "";

module.exports = class extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        // itemImgFolder = Path.resolve(server.websiteSetting.root, "./img/itemImgs");
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

    // getImgPathOrRespError(imgName) {
    //     if (!imgName) {
    //         this.respError(req, 400, `query type error：img must not be empty string`);
    //         return false;
    //     }
    //     return Path.join(itemImgFolder, imgName.substr(0, 1), imgName.substr(0, 3), imgName);
    // }

    handleGet(/**@type{MyHttpRequest} */req) {
        const qs = { itemno: "" };
        if (this.respIfQueryIsInvalid(req, qs)) return;

        // let path = this.getImgPathOrRespError(qs.img);
        // if (path) this.respFile(req, path, 'image/png');

        Application.dbMyPLM.selectItemDoc(qs.itemno).then(mtd => {
            this.respString(req, 200, mtd.toString());
        }, error => {
            this.respError(req, 500, error.stack);
        });
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        this.respError(req, 500, "还没写！");
        // if (this.respIfContLenNotInRange(req, 2, 10 * 1024 * 1024)) return;

        // const qs = { itemno: "", img: "" };//物料编号跟图片名称
        // if (this.respIfQueryIsInvalid(req, qs)) return;
        // if (!qs.itemno) {
        //     this.respError(req, 400, `query type error：itemno must not be empty string`);
        //     return;
        // }

        // //图片名称用物料编号+文件名称后缀
        // let path = qs.itemno + Path.extname(qs.img);
        // path = this.getImgPathOrRespError(path);

        // if (path) {
        //     Application.dbMyPLM.updateItemLastUpdateTime(qs.itemno).then(b => {
        //     }, error => {
        //     });
        //     this.handleUpload(req, path);
        // }
    }
}
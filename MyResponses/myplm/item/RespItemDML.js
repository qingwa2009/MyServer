'use strict';
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../../../MyHttp');
const Application = require("../../../Application");
const { LOG, WARN, ERROR } = require('../../../MyUtil');
const Path = require("path");

module.exports = class extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
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

    handleGet(/**@type{MyHttpRequest} */req) {
        const dml = {
            select: this.handleSelect,
            delete: this.handleDelete,
        }
        const p = Path.basename(req.url);
        if (!dml[p]) {
            this.respError(req, 500, `'${p}' is not handle in Get Method!`);
            return;
        }

        dml[p].call(this, req);
    }

    handleSelect(/**@type{MyHttpRequest} */req) {
        const qs = { itemno: "" };
        if (this.respIfQueryIsInvalid(req, qs)) return;

        Application.dbMyPLM.selectItem(qs.itemno).then(obj => {
            this.respString(req, 200, JSON.stringify(obj));
        }).catch(error => {
            this.respError(req, 500, error.message);
        });
    }

    handleDelete(/**@type{MyHttpRequest} */req) {
        this.respError(req, 500, "还没写！");
    }

    handleUpdate(/**@type{MyHttpRequest} */req) {
        this.handleJSON(req, json => {
            const ITEM_NO = json.ITEM_NO;
            if (!ITEM_NO) throw new Error("miss ITEM_NO!");
            if (json.TYPE_NO !== ITEM_NO.substr(0, 4)) throw new Error("ITEM_NO and TYPE_NO doesn't match!");

            //图片名称用物料编号+文件名称后缀
            if (json["UPLOAD_IMG"]) {
                json["UPLOAD_IMG"] = ITEM_NO + Path.extname(json["UPLOAD_IMG"]);
            } else {
                json["UPLOAD_IMG"] = "";
            }
            json["UPDATE_USER"] = "000000001";//req.Session.ID;

            Application.dbMyPLM.updateItem(ITEM_NO, json).then(obj => {
                this.respString(req, 200, JSON.stringify(obj));
            }, error => {
                this.respError(req, 500, error.message);
            });
        });
    }

    handleInsert(/**@type{MyHttpRequest} */req) {
        this.respError(req, 500, "还没写！");
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (this.respIfContLenNotInRange(req, 2, 65535)) return;

        const dml = {
            insert: this.handleInsert,
            update: this.handleUpdate,
        }
        const p = Path.basename(req.url);
        if (!dml[p]) {
            this.respError(req, 500, `'${p}' is not handle in Post Method!`);
            return;
        }

        dml[p].call(this, req);

    }
}

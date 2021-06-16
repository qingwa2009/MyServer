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
            insert: this.handleInsert,
            update: this.handleUpdate,
        }
        const p = Path.basename(req.url);
        if (!dml[p]) {
            this.respError(req, 500, `'${p}' is not handle!`);
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
        this.respError(req, 500, "还没写！");
    }

    handleInsert(/**@type{MyHttpRequest} */req) {
        this.respError(req, 500, "还没写！");
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (this.respIfContLenNotInRange(req, 2, 8192)) return;
        this.respError(req, 500, "还没写！");
        // this.handleDbCriteria(req, (criteria) => {
        //     const offset = parseInt(req.querys.get("offset") || 0);
        //     let c;
        //     try {
        //         c = criteria.toCriteria();
        //     } catch (error) {
        //         this.respError(req, 400, error.message);
        //         return;
        //     }
        //     Application.dbMyPLM.searchItems(c.where, c.orderby, c.values, offset ? offset : 0).then(mtd => {
        //         this.respString(req, 200, mtd.toString());
        //     }, error => {
        //         this.respError(req, 500, error.message);
        //     });
        // });
    }
}

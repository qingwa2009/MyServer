'use strict';
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../../../MyHttp');
const Application = require("../../../Application");
const { LOG, WARN, ERROR } = require('../../../MyUtil');


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
        this.respError(req, 405, "please use 'POST' method!");
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (this.respIfContLenNotInRange(req, 2, 8192)) return;
        this.handleDbCriteria(req, (criteria) => {
            try {
                const offset = parseInt(req.querys["offset"]);
                let c;
                try {
                    c = criteria.toCriteria();
                } catch (error) {
                    this.respError(req, 400, error.message);
                    return;
                }
                const mtd = Application.dbMyPLM.selectItems(c.where, c.orderby, c.values, offset ? offset : 0);
                this.respString(req, 200, mtd.toString());
            } catch (error) {
                this.respError(req, 500, error.message);
            }
        });
    }
}

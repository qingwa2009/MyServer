'use strict';
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');
const Application = require("../Application");
const { LOG, WARN, ERROR } = require('../MyUtil');

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
        this.respString(req, 200);
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (this.respIfContLenNotInRange(req, 2, 8192)) return;
        this.handleJSON(req, (obj) => {
            console.log(obj);
            this.respString(req, 200);
        });
    }
}

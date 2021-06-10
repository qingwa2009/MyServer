'use strict';
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');
const Application = require("../Application");
const { MyTableData } = require("../MySqlite");
const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
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

    }

    handleGet(/**@type{MyHttpRequest} */req) {
        let user = req.querys.get("user");
        const list = req.querys.get("list");
        if (!user) user = req.Session.name;

        Application.dbSetting.selectUserSettings(user, list).then(mtd => {
            this.respString(req, 200, mtd.toString());
        }, error => {
            this.respError(req, 500, error.message);
        });
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (this.respIfContLenNotInRange(req, 2, 65535)) return;
        this.handleMyTableData(req, mtd => {
            const user = req.Session.name;
            const list = mtd.list;
            const data = [];
            for (const dt of mtd.iterator(true)) {
                data.push(dt);
            }
            Application.dbSetting.saveUserSetting(user, list, data).then(() => {
                this.respString(req, 200);
            }, error => {
                this.respError(req, 400, error.message);
            });
        });
    }

}

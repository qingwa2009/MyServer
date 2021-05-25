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
        let user = req.querys["user"];
        const list = req.querys["list"];
        if (!user) user = req.Session.name;
        try {
            const mtd = Application.dbSetting.selectUserSettings(user, list);
            this.respString(req, 200, mtd.toString());
        } catch (error) {
            this.respError(req, 400, error.message);
        }
    }

    handlePost(/**@type{MyHttpRequest} */req) {
        if (!this.checkContentLen(req, 2, 65535)) return;
        this.handleJSON(req, (/**@type{MyTableData} */obj) => {
            try {
                MyTableData.decorate(obj);
                const user = req.Session.name;
                const list = obj.list;
                const data = [];
                for (const dt of obj.iterator(true)) {
                    data.push(dt);
                }
                Application.dbSetting.saveUserSetting(user, list, data);
                this.respError(req, 200);
            } catch (error) {
                this.respError(req, 400, error.message);
            }
        });
    }

}

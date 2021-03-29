'use strict';
const Path = require('path');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class RespUpload extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        server.status().then(s => {
            this.respString(req, 200, s);
        })
    }

}

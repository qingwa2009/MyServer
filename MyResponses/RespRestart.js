'use strict';
const Path = require('path');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class RespRestart extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        server.stop().then(() => {
            setTimeout(() => {
                server.start();
            }, 3000);
        });
    }

}

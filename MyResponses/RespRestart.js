'use strict';
const Path = require('path');
const { MyHttpRequest, MyHttpResponse, IMyServer, HttpConst } = require('../MyHttp');

const { LOG, WARN, ERROR } = require('../MyUtil');

module.exports = class extends MyHttpResponse {
    /**
     * @param {MyHttpRequest} req 
     * @param {IMyServer} server
     */
    response(req, server) {
        //-------------------
        //权限验证，没写  
        //-------------------

        setTimeout(() => {
            this.statusCode = 200;
            this.end();
        }, 3000);

        if (server.server.listening) {
            server.stop().then(() => {
                setTimeout(() => {
                    server.start();
                }, 3000);
            });
        }

    }

}

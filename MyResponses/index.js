'use strict';
const { MyHttpResponse } = require('../MyHttp');
module.exports = {
    /**
     * @param {string} url 
     * @returns {MyHttpResponse} class
     */
    get(url) {
        return this[url.toLowerCase()];
    },
    '/upload': require('./RespUpload'),//通用上传文件
    '/uploaddownload': require('./RespUploadDownload'),//
    '/status': require('./RespStatus'),

}
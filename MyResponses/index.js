'use strict';
const { MyHttpResponse } = require('../MyHttp');
module.exports = {
    '/upload': require('./RespUpload'),
    '/uploaddownload': require('./RespUploadDownload'),//
    '/exportxbfilelist': require('./RespExportXBFlieList'),
    '/exportxbupload': require('./RespExportXBUpload'),




    /**
    * @param {string} url 
    * @returns {MyHttpResponse} class
    */
    get(url) {
        return this[url.toLowerCase()];
    }
}
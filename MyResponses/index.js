'use strict';
const { MyHttpResponse } = require('../MyHttp');
module.exports = {
    '/upload': require('./RespUpload'),
    '/uploaddownload': require('./RespUploadDownload'),
    '/exportxb/filelist': require('./exportxb/RespExportXBFlieList'),
    '/exportxb/upload': require('./exportxb/RespExportXBUpload'),
    '/restart': require('./RespRestart'),
    '/updatewebsite': require('./RespUpdateWebsite'),
    '/updateserver': require('./RespUpdateServer'),
    '/usersetting': require('./RespUserSettings'),
    /**
    * @param {string} url 
    * @returns {MyHttpResponse} class
    */
    get(url) {
        return this[url.toLowerCase()];
    }
}
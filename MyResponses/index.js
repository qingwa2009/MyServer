'use strict';
const { MyHttpResponse } = require('../MyHttp');
module.exports = {
    '/uploaddownload': require('./RespUploadDownload'),
    '/restart': require('./RespRestart'),
    '/updatewebsite': require('./RespUpdateWebsite'),
    '/updateserver': require('./RespUpdateServer'),
    ...require("./exportxb"),
    '/usersetting': require('./RespUserSettings'),
    /**
    * @param {string} url 
    * @returns {MyHttpResponse} class
    */
    get(url) {
        return this[url.toLowerCase()];
    }
}
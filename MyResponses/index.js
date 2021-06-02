'use strict';
const { MyHttpResponse } = require('../MyHttp');

module.exports = {
    //key必须全小写    
    '/uploaddownload': require('./RespUploadDownload'),
    '/restart': require('./RespRestart'),
    '/updatewebsite': require('./RespUpdateWebsite'),
    '/updateserver': require('./RespUpdateServer'),
    '/usersetting': require('./RespUserSettings'),
    ...require("./exportxb"),
    ...require("./myplm"),
    /**
    * @param {string} url 
    * @returns {MyHttpResponse} class
    */
    get(url) {
        return this[url.toLowerCase()];
    }
}
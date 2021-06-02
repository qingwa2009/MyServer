'use strict';
module.exports = {
    //key必须全小写    
    '/exportxb/filelist': require('./RespFlieList'),
    '/exportxb/upload': require('./RespUpload'),
    '/exportxb/delete': require('./RespDelete'),
    '/exportxb/download': require('./RespDownload'),
}
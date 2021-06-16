'use strict';
module.exports = {
    //key必须全小写    
    ...require('./item'),
    "/myplm/getlist": require("./RespGetList"),
}
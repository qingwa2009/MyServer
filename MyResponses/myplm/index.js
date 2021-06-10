'use strict';
module.exports = {
    //key必须全小写    
    ...require('./selectItems'),
    "/myplm/getlistitems": require("./RespGetListItems"),
}
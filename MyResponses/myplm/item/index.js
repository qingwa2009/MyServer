'use strict';
/**物料相关 */
module.exports = {
    //key必须全小写    
    '/myplm/item/search': require('./RespSearchItems'),
    '/myplm/item/select': require('./RespItemDML'),
    '/myplm/item/insert': require('./RespItemDML'),
    '/myplm/item/update': require('./RespItemDML'),
    '/myplm/item/delete': require('./RespItemDML'),
    '/myplm/item/img': require('./RespItemImg'),
    '/myplm/item/doc': require('./RespItemDoc'),
}
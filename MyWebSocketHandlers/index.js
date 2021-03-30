'use strict';
const { IMyWebSocketHandler } = require('../MyHttp')
module.exports = {
    /**
     * @param {string} url 
     * @returns {IMyWebSocketHandler}
     */
    get(url) {
        return this[url.toLowerCase()];
    },
    '/sample': require('./WSSample'),
    '/weblog': require('./WSLogger'),
    '/multiplayer': require('./WSMultiplayer'),

}
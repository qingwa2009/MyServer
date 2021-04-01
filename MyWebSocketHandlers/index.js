'use strict';
const { IMyWebSocketHandler } = require('../MyHttp')
module.exports = {
    '/sample': require('./WSSample'),
    '/weblog': require('./WSLogger'),
    '/multiplayer': require('./WSMultiplayer'),
    '/status': require('./WSServerStatus'),
    '/exportxb': require('./WSExportxb'),



    /**
     * @param {string} url 
     * @returns {IMyWebSocketHandler}
     */
    get(url) {
        return this[url.toLowerCase()];
    },
    status() {
        const props = Object.getOwnPropertyNames(this);
        const st = { ws: [], totalCount: 0 };
        for (let i = 0; i < props.length; i++) {
            const pn = props[i];
            const p = this.get(pn);
            if (typeof p === 'object') {
                const n = p.count;
                st.ws.push([pn, n]);
                st.totalCount += n;
            }
        }
        return st;
    }
}
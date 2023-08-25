'use strict';
const { IMyWebSocketHandler } = require('../MyHttp')
module.exports = {
    //全小写
    '/sample': require('./WSSample'),
    '/weblog': require('./WSLogger'),
    '/multiplayer': require('./WSMultiplayer'),
    '/status': require('./WSServerStatus'),
    '/exportxb': require('../MyResponses/exportxb/WSExportxb'),
    '/webrtcsignalingserver': require('../MyResponses/WebRTCTest/WSWebRTCSignalingServer'),



    /**
     * @param {string} url 
     * @returns {IMyWebSocketHandler}
     */
    get(url) {
        return this[url.toLowerCase()];
    },
    status() {
        const props = Object.getOwnPropertyNames(this);
        const st = { ws: { title: ["url", "connection count"], data: [] }, totalCount: 0 };
        for (let i = 0; i < props.length; i++) {
            const pn = props[i];
            const p = this.get(pn);
            if (typeof p === 'object') {
                const n = p.count;
                st.ws.data.push([pn, n]);
                st.totalCount += n;
            }
        }
        return st;
    }
}
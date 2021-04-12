'use strict';

const Assert = require('assert');
const FS = require('fs');
const MyUtil = require('./MyUtil');
const MyServer = require('./MyServer');
const { IMyServerSetting } = require('./MyHttp');

const options = {
    key: FS.readFileSync("./SSL/server.key"),
    cert: FS.readFileSync("./SSL/server.pem")
};

let websiteSetting = null;
let need2save = false;
try {
    websiteSetting = JSON.parse(FS.readFileSync('./websiteSetting.json'));

    const tempSetting = new IMyServerSetting();
    const ns = Object.getOwnPropertyNames(tempSetting);
    for (let i = 0; i < ns.length; i++) {
        const n = ns[i];
        if (websiteSetting[n] === undefined) {
            websiteSetting[n] = tempSetting[n];
            need2save = true;
        }
    }
} catch (e) {
    websiteSetting = new IMyServerSetting();
    need2save = true;
}

if (need2save) {
    FS.writeFileSync('./websiteSetting.json', JSON.stringify(websiteSetting));
    console.log('websiteSetting saved!');
}


const httpsServer = new MyServer(websiteSetting, options);
httpsServer.start();
// const httpServer = new MyServer(websiteSetting);
// httpServer.start();

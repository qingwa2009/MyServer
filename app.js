'use strict';

const Assert = require('assert');
const FS = require('fs');
const Path = require('path');
const MyUtil = require('./MyUtil');
const MyServer = require('./MyServer');
const { IMyServerSetting } = require('./MyHttp');

let httpsOptions = null;
try {
    httpsOptions = {
        key: FS.readFileSync(Path.join(__dirname, "/SSL/server.key")),
        cert: FS.readFileSync(Path.join(__dirname, "/SSL/server.pem"))
    };
} catch (error) {
    MyUtil.ERROR(error);
}

/**@type {IMyServerSetting} */
let websiteSetting = null;
let need2save = false;
const settingPath = Path.join(__dirname, FS.readFileSync('/websiteSetting.json'));
try {
    websiteSetting = JSON.parse(settingPath);

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
    FS.writeFileSync(settingPath, JSON.stringify(websiteSetting));
    console.log('websiteSetting saved!');
}

const fm = new MyUtil.MyFileManager();

if (websiteSetting.https_port && httpsOptions) {
    const httpsServer = new MyServer(fm, websiteSetting, httpsOptions);
    httpsServer.start();
}

if (websiteSetting.http_port) {
    const httpServer = new MyServer(fm, websiteSetting);
    httpServer.start();
}

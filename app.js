'use strict';
const MyUtil = require('./MyUtil');
const Assert = require('assert');
const FS = require('fs');
const Path = require('path');
const MyServer = require('./MyServer');
const { IMyServerSetting } = require('./MyHttp');
const Application = require('./Application');

const rootPath = process.argv[2];

let httpsOptions = null;
try {
    httpsOptions = {
        key: FS.readFileSync(Path.join(__dirname, "/SSL/server.key")),
        cert: FS.readFileSync(Path.join(__dirname, "/SSL/server.pem"))
    };
} catch (error) {
    MyUtil.ERROR(error);
}

Application.loadWebsiteSetting();


if (rootPath && FS.existsSync(rootPath)) {
    Application.websiteSetting.root = rootPath;
}

console.log("website root: ", Application.websiteSetting.root);


if (Application.websiteSetting.https_port && httpsOptions) {
    const httpsServer = new MyServer(Application.websiteSetting, httpsOptions);
    httpsServer.start();
}

if (Application.websiteSetting.http_port) {
    const httpServer = new MyServer(Application.websiteSetting);
    httpServer.start();
}

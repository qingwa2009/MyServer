'use strict';
const child_process = require('child_process');
const Assert = require('assert');
const FS = require('fs');
const Path = require('path');
const MyUtil = require('./MyUtil');

child_process.execFile('updateServer.bat', [], { cwd: __dirname }, (err, stdout, stderr) => {
    // console.log(err);
    // console.log(stdout);
    // console.log(stderr);
    const cp = child_process.spawn(`node app.js`, [], { cwd: __dirname, detached: true, stdio: 'inherit', shell: true });
    cp.unref();
    cp.on("exit", (code, signal) => {
        process.exit(0);
    })
}).unref();
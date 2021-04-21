'use strict';
const child_process = require('child_process');
const Assert = require('assert');
const FS = require('fs');
const Path = require('path');
const MyUtil = require('./MyUtil');

console.log("-----------------");
console.log(Date().toString());
console.log('in serverRestarter waiting 3 seconds...');
setTimeout(() => {
    console.log('start updateServer.bat!');
    child_process.execFile('updateServer.bat', [], { cwd: __dirname }, (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        console.log("restarting server...");
        const cp = child_process.spawn(`node app.js`, [], { cwd: __dirname, detached: true, stdio: 'inherit', shell: true });
        cp.unref();
        process.exit(0);
    }).unref();
}, 3000);




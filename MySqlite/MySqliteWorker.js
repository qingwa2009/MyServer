"use strict";
const Assert = require("assert");
const { parentPort } = require("worker_threads");

class MySqliteWorker {
    constructor(db) {
        this.db = db;
        parentPort.on("message", this.onMessage.bind(this));
    }

    onMessage({ method, params }) {
        // Assert("必须重载！");
        const ret = this.db[method](...params);
        parentPort.postMessage(ret);
    }
}
module.exports = MySqliteWorker;

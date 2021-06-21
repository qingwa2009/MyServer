"use strict";
const Assert = require("assert");
const { isMainThread, parentPort } = require("worker_threads");

class MySqliteWorker {
    constructor(db) {
        if (isMainThread) throw "MySqliteWorker can not run in main thread!";
        this.db = db;
        parentPort.on("message", this.onMessage.bind(this));
    }

    onMessage({ method, params }) {
        try {
            const ret = this.db[method](...params);
            parentPort.postMessage(ret);
        } catch (error) {
            //sqlite抛出的错误居然传不出去！！！重新抛
            const e = new Error(error.message);
            e.name = error.name;
            e.stack = `db.${method} is not exists!\n${error.stack}`;
            throw e;
        }
    }
}
module.exports = MySqliteWorker;

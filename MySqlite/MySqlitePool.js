"use strict";
const Path = require("path");
const { Worker } = require("worker_threads");
const os = require("os")
const { ERROR, WARN, LOG } = require("../MyUtil");

class MySqlitePool {
    /** 
     * @param {string} path worker脚本路径
     * @param {number} size 每个db最大打开数，默认值等于cpu的核心数
     */
    constructor(path, size = os.cpus().length) {
        /**@type{Worker[]} */
        this._workers = [];
        /**@type{{resolve:function, reject:function, msg: {method:string, params:[]}}[]} */
        this._jobsQueue = [];

        for (let i = 0; i < size; i++) {
            this._spawn(path);
        }
    }

    _spawn(path) {
        const w = new Worker(path);

        w._job = null;
        w._error = null;

        w.on("online", () => {
            this._workers.push(w);
            this._takeJob(w);
        }).on("message", msg => {
            w._job.resolve(msg);
            w._job = null;
            this._takeJob(w);
        }).on("error", err => {
            w._error = err;
            WARN("Mysqlite worker error: ", err.stack);
        }).on("exit", exitCode => {
            const i = this._workers.indexOf(w);
            if (i > -1) {
                this._workers.splice(i, 1);
            }

            if (w._job) {
                w._job.reject(w._error || new Error("Mysqlite worker died!"));
                w._job = null;
            }
            //不正常关闭就重新开线程
            if (exitCode !== 0) {
                WARN(`Mysqlite worker exitcode:${exitCode}; respawn...`);
                this._spawn(path);
            } else {
                WARN(`Mysqlite worker exit!`);
            }
        });
    }

    _takeJob(/**@type{Worker} */w) {
        if (!w._job && this._jobsQueue.length) {
            const job = this._jobsQueue.shift();
            w._job = job;
            w._error = null;
            w.postMessage(job.msg);
        }
    }

    _allFreeWorkersTakeJob() {
        for (const w of this._workers) {
            this._takeJob(w);
        }
    }

    /**
     *      
     * @param {string} method 
     * @param  {...any} params 
     * @returns {Promise}
     */
    asyncQuery(method, ...params) {
        return new Promise((resolve, reject) => {
            this._jobsQueue.push({ resolve, reject, msg: { method, params } });
            this._allFreeWorkersTakeJob();
        })
    }

    status() {
        return `thread count:${this._workers.length}\njobs in queue:${this._jobsQueue.length}`;
    }

    /**
     * @returns{Promise<void>}
     */
    close() {
        const n = this._workers.length;
        const ps = [];
        for (let i = 0; i < n; i++) {
            ps.push(this.asyncQuery("close").catch(err => { }));
        }
        return Promise.all(ps);
    }
}

module.exports = MySqlitePool;
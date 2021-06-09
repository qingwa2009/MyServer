const { isMainThread } = require("worker_threads");
const MySqlite = require("./MySqlite");
const MySqlitePool = require("./MySqlitePool");
const Assert = require("assert");

class IMySqliteWorkerable {
    constructor(dbPath, dbOptions, workerPath, usePool, poolSize) {
        if (isMainThread && usePool) {
            this.pool = poolSize ? new MySqlitePool(workerPath, poolSize) : new MySqlitePool(workerPath);
            this._initAsDbPool();
        } else {
            this.db = new MySqlite(dbPath, dbOptions);
            this._initAsDb();
        }
    }

    _initAsDb() {
        // Assert(false, "必须重载！");
    }

    _initAsDbPool() {
        // Assert(false, "必须重载！");
    }

    /**
     * @returns{void | Promise<void>}
     */
    close() {
        if (this.pool) return this.pool.close();
        else {
            this.db.close();
            if (!isMainThread) process.exit(0);
        }
    }

    status() {
        return this.pool ? this.pool.status() : "";
    }
}

module.exports = IMySqliteWorkerable;
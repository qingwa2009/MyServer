const Assert = require("assert");
const { ERROR, WARN, LOG } = require("../MyUtil");
const Database = require("better-sqlite3");
const MyTableData = require("./MyTableData");
// SQLite3	|   JavaScript
// NULL	    |   null
// REAL	    |   number
// INTEGER	|   number or BigInt
// TEXT	    |   string
// BLOB	    |   Buffer


class MySqlite extends Database {
    /**
     * @param {string} filename 
     * @param {Database.Options} options 
     */
    constructor(filename, options = undefined) {
        super(filename, options)
        this._init();
    }
    _init() {
        this.pragma("journal_mode = WAL");
        this.pragma("foreign_keys = 1");
        WARN(this.name, "database opened!");
    }
    /**     
     * @param {Database} db 
     */
    static decorate(db) {
        Object.setPrototypeOf(db, MySqlite.prototype);
        db._init();
    }

    /**
     * 如果执行过程有错误，返回值的error属性将包含错误信息
     * @param {string} sql     
     */
    getMyTableData(sql, ...params) {
        let stmt;
        try {
            stmt = this.prepare(sql);
        } catch (error) {
            const mtd = new MyTableData();
            mtd.error = error.toString();
            return mtd;
        }
        return MySqlite.getMyTableData(stmt, ...params);
    }

    /**
     * 如果执行过程有错误，返回值的error属性将包含错误信息
     * @param {Database.Statement} stmt 
     * @returns {MyTableData}
     */
    static getMyTableData(stmt, ...params) {
        var mtd = new MyTableData();
        try {
            stmt.columns().forEach(v => {
                mtd.title.push(v.name);
                mtd.type.push(v.type);
            });
            mtd.data = stmt.raw().all(...params);
            mtd.count = mtd.data.length;
            mtd.totalCount = mtd.count;
            mtd.EOF = true;
        } catch (error) {
            mtd.error = error.toString();
        }
        return mtd;
    }


}

module.exports = MySqlite;
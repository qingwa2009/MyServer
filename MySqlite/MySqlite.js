const Assert = require("assert");
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
    }
    /**     
     * @param {Database} db 
     */
    static decorate(db) {
        Object.setPrototypeOf(db, MySqlite.prototype);
        db._init();
    }

    /**
     * @param {string} sql      
     */
    getMyTableData(sql, ...params) {
        return MySqlite.getMyTableData(this.prepare(sql), ...params);
    }

    /**
     * @param {Database.Statement} stmt 
     * @returns {MyTableData}
     */
    static getMyTableData(stmt, ...params) {
        var mtd = new MyTableData();
        stmt.columns().forEach(v => {
            mtd.title.push(v.name);
            mtd.type.push(v.type);
        });
        const n = mtd.title.length;
        for (const row of stmt.iterate(...params)) {
            const dt = new Array(n);
            for (let i = 0; i < n; i++) {
                const column = mtd.title[i];
                dt[i] = row[column];
            }
            mtd.data.push(dt);
        }
        mtd.count = mtd.data.length;
        mtd.EOF = true;
        return mtd;
    }


}

module.exports = MySqlite;
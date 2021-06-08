"use strict";
const { isMainThread } = require("worker_threads");

if (isMainThread) {
    const Path = require("path");
    const MySqlitePool = require("../MySqlite/MySqlitePool");
    const MyTableData = require("../MySqlite/MyTableData");
    const { ERROR, WARN, LOG } = require("../MyUtil");

    const MAX_ROWS = 500;
    class DbMyPLMPool extends MySqlitePool {
        constructor(size) {
            super(__filename, size);
        }

        /**
         * 物料查询
         * @param {string} where where子句
         * @param {string} orderBy orderBy子句
         * @param {Object[]} values 子句所有要绑定的参数
         * @param {number} offset 偏移
         * @param {number} count 数量 
         * @returns {Promise<MyTableData>}
         */
        selectItems(where = '', orderBy = '', values = [], offset = 0, count = MAX_ROWS) {
            return this.asyncQuery("selectItems", ...arguments).then(mtd => MyTableData.decorate(mtd));
        }
        /**
         * 更新物料的更新时间
         * @param {string} itemNo 
         * @returns {Promise<boolean>}
         */
        updateItemLastUpdateTime(itemNo) {
            return this.asyncQuery("updateItemLastUpdateTime", ...arguments);
        }

        /**
         * @param {string} name  必须全小写
         * @returns {Promise<MyTableData>}
         */
        getListItems(name) {
            return this.asyncQuery("getListItems", ...arguments).then(mtd => MyTableData.decorate(mtd));;
        }
    }

    module.exports = DbMyPLMPool;
} else {
    const MySqliteWorker = require("../MySqlite/MySqliteWorker");
    const DbMyPLM = require("./DbMyPLM");
    new MySqliteWorker(new DbMyPLM());
}
const Path = require("path");
const Assert = require("assert");
const MyUtil = require("../MyUtil");
const { MySqlite, MyTableData } = require("../MySqlite");
const { ERROR, LOG } = MyUtil;

const TB_USER_LIST_SETTING = "tb_user_list_setting";
const path = Path.join(__dirname, 'setting.db');

class DbSetting {

    constructor() {
        this.db = new MySqlite(path, { verbose: (sql) => { LOG("", sql) } });
        this._tryCreateTbSetting();
    }

    _tryCreateTbSetting() {
        const sql = `
        CREATE TABLE IF NOT EXISTS ${TB_USER_LIST_SETTING}(
            user TEXT(32) NOT NULL,
            list TEXT(32) NOT NULL,
            col TEXT(32) NOT NULL,
            width INTEGER NOT NULL DEFAULT 0,
            pos INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (user, list, col)
        )
        `;
        this.db.prepare(sql).run();
    }

    /**
     * 如果查询失败，error会被赋值
     * @param {string} user 
     * @param {string} list 表格名
     * @returns {MyTableData}
     */
    selectUserSettings(user, list = undefined) {
        const s = list ? "stmt_selectUserSetting" : "stmt_selectUserSettings";
        let stmt = this[s];
        if (!stmt) {
            this[s] = this.db.prepare(`
                    SELECT list, col, width, pos 
                    FROM ${TB_USER_LIST_SETTING}
                    WHERE user=? ${list ? "and list=?" : ""}
                    ORDER BY list, pos ASC
                `);
            stmt = this[s];
        }

        const params = list ? [user, list] : user;
        return MySqlite.getMyTableData(this[s], params);
    }


    /**
     * 错误时会自动回滚
     * @param {string} user 
     * @param {string} list 表格名
     * @param {{col:string, width:number}[]} data 
     */
    saveUserSetting(user, list, data) {
        if (!this.tran_saveUserSetting) {
            this.tran_saveUserSetting = this.db.transaction((user, list, /**@type{{col:string, width:number}[]} */data) => {
                this.deleteUserSetting(user, list);
                if (!this.stmt_insUserSetting) {
                    this.stmt_insUserSetting = this.db.prepare(`
                        INSERT INTO ${TB_USER_LIST_SETTING}
                        (user, list, col, width, pos) 
                        VALUES (?, ?, ?, ?, ?)
                    `);
                }
                const n = data.length;
                for (let i = 0; i < n; i++) {
                    const v = data[i];
                    this.stmt_insUserSetting.run(user, list, v.col, v.width, i);
                }
            });
        }

        this.tran_saveUserSetting.immediate(user, list, data);
    }

    /**
     * @param {string} user 
     * @param {string} list 表格名
     */
    deleteUserSetting(user, list) {
        if (!this.stmt_delUserSetting) {
            this.stmt_delUserSetting = this.db.prepare(`
                DELETE FROM ${TB_USER_LIST_SETTING}
                WHERE user=? and list=?
            `);
        }
        this.stmt_delUserSetting.run(user, list);
    }



}
module.exports = DbSetting;
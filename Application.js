const MyUtil = require('./MyUtil');
const DbSetting = require("./sample/DbSetting");
const DbMyPLMPool = require("./sample/DbMyPLMPool");

class Application {
    static fm = new MyUtil.MyFileManager();
    /**@type{DbSetting} */
    static dbSetting;
    /**xb文件上传及导出的路径 */
    static xb_export_folder = "../upload/";
    /**@type{DbMyPLMPool} */
    static dbMyPLMPool;

    static _isDbInited = false;
    static initDb() {
        if (Application._isDbInited) return;
        Application._isDbInited = true;
        Application.dbSetting = new DbSetting();
        Application.dbMyPLMPool = new DbMyPLMPool();
    }

    static releaseAllResources() {
        Application._isDbInited = false;
        Application.fm.releaseAllFileReading();
        Application.dbSetting.db.close();
        Application.dbMyPLMPool.db.close();
    }
}
module.exports = Application;
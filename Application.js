const MyUtil = require('./MyUtil');
const DbSetting = require("./sample/DbSetting");
const DbMyPLM = require("./sample/DbMyPLM");

class Application {
    static fm = new MyUtil.MyFileManager();
    /**@type{DbSetting} */
    static dbSetting;
    /**xb文件上传及导出的路径 */
    static xb_export_folder = "../upload/";
    /**@type{DbMyPLM} */
    static dbMyPLM;

    static _isDbInited = false;
    static initDb() {
        if (Application._isDbInited) return;
        Application._isDbInited = true;
        Application.dbSetting = new DbSetting(true);
        Application.dbMyPLM = new DbMyPLM(true);
    }

    static releaseAllResources() {
        Application._isDbInited = false;
        Application.fm.releaseAllFileReading();
        return Promise.all(
            Application.dbSetting.close(),
            Application.dbMyPLM.close()
        ).catch(() => { });
    }

}
module.exports = Application;
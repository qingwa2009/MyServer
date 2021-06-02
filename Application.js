const MyUtil = require('./MyUtil');
const DbSetting = require("./sample/DbSetting");
const DbMyPLM = require("./sample/DbMyPLM");

class Application {
    static fm = new MyUtil.MyFileManager();
    static dbSetting = new DbSetting();
    /**xb文件上传及导出的路径 */
    static xb_export_folder = "../upload/";
    static dbMyPLM = new DbMyPLM();
}
module.exports = Application;
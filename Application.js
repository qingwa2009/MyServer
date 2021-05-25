const MyUtil = require('./MyUtil');
const DbSetting = require("./sample/DbSetting");

class Application {
    static fm = new MyUtil.MyFileManager();
    static dbSetting = new DbSetting();
}
module.exports = Application;
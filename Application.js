const Path = require('path');
const FS = require('fs');
const MyUtil = require('./MyUtil');
const DbSetting = require("./sample/DbSetting");
const DbMyPLM = require("./sample/DbMyPLM");

const IMyServerSetting = require("./MyHttp/IMyServerSetting");

class Application {
    /**@type{IMyServerSetting} */
    static websiteSetting = null;
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

    static loadWebsiteSetting() {
        let need2save = false;
        const settingPath = Path.join(__dirname, '/websiteSetting.json');
        try {
            Application.websiteSetting = JSON.parse(FS.readFileSync(settingPath));

            const tempSetting = new IMyServerSetting();
            const ns = Object.getOwnPropertyNames(tempSetting);
            for (let i = 0; i < ns.length; i++) {
                const n = ns[i];
                if (Application.websiteSetting[n] === undefined) {
                    Application.websiteSetting[n] = tempSetting[n];
                    need2save = true;
                }
            }
        } catch (e) {
            Application.websiteSetting = new IMyServerSetting();
            need2save = true;
        }

        if (need2save) {
            FS.writeFileSync(settingPath, JSON.stringify(Application.websiteSetting));
            console.log('websiteSetting saved!');
        }
    }

}
module.exports = Application;
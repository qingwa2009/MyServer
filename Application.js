const Path = require('path');
const FS = require('fs');
const MyUtil = require('./MyUtil');

let DbSetting=null;
let DbMyPLM=null;
try {
    require.resolve('better-sqlite3');
    DbSetting = require("./sample/DbSetting");
    DbMyPLM = require("./sample/DbMyPLM");
} catch (error) {
    console.error("====================================================");
    console.error(error);
    console.error("====================================================");
}

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
    /**@type{Map<string,number>} */
    static someoneHackingPath = {};

    static _isDbInited = false;
    static initDb() {
        if (Application._isDbInited) return;
        try {
            Application.dbSetting = new DbSetting(true);
            Application.dbMyPLM = new DbMyPLM(true);            
            Application._isDbInited = true;
        } catch (error) {
            console.error("====================================================");
            console.error(error);
            console.error("====================================================");
        }
    }

    static releaseAllResources() {
        Application.fm.releaseAllFileReading();
        if(Application._isDbInited){
            Application._isDbInited = false;
            return Promise.all(
                Application.dbSetting.close(),
                Application.dbMyPLM.close()
            ).catch(() => { });
        }else{
            return Promise.resolve();
        }
        
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

    /**
    * @param {string} ip 
    * @param {MyUtil.ExceptionPathNoInFolder} err 
    */
    static addToHackingPath(ip, err) {
        if (Application.someoneHackingPath[ip] === undefined) {
            Application.someoneHackingPath[ip] = 1;
        } else {
            Application.someoneHackingPath[ip]++;
        }
    }

}
module.exports = Application;
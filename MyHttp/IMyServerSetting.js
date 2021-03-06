'use strict';
module.exports = class IMyServerSetting {
    /**网站根目录 */
    root = "C:/Users/linjunbin/Desktop/htmlTest/MyWebsiteProjects/MyWebsite";
    /**上传文件目录，不要位于root的子目录，防止root里面的文件被覆盖 */
    upload_folder = "C:/Users/linjunbin/Desktop/htmlTest/上传下载";
    /**网站主页面 */
    main_page = "index.html";
    /**网站端口 */
    http_port = 80;
    https_port = 443;
    /**网站ip */
    ip = "";
    /**是否允许跨域资源共享 */
    allowCORS = true;
    /**是否启用websocket接受调试信息 */
    enable_web_log = true;
    /**是否打印info信息 */
    debug_log = false;
    /**是否打印warn信息 */
    debug_warn = true;
    /**是否打印error信息 */
    debug_error = true;
    /**
     * 响应额外的响应头信息, url必须全小写
     * @type{Object<string, Object<string, string>>}
     */
    extra_resp_headers = {
        "/welcome.html": {
            /**主页禁止被iframe引用 */
            "X-Frame-Options": "deny"
        }
    }

}
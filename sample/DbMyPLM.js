const { isMainThread } = require("worker_threads");
const Path = require("path");
const Assert = require("assert");
const MyUtil = require("../MyUtil");
const { MySqlite, MySqliteWorker, MySqlitePool, MyTableData, IMySqliteWorkerable } = require("../MySqlite");
const { ERROR, WARN, LOG } = MyUtil;
const dbPath = Path.join(__dirname, 'myplm.db');

const T_PDM_ITEM = "T_PDM_ITEM";
const T_PDM_ITEMTYPE = "T_PDM_ITEMTYPE";
const T_PDM_ITEM_FORMULA = "T_PDM_ITEM_FORMULA";
const T_PUB_CODE = "T_PUB_CODE";
const T_SYS_USER = "T_SYS_USER";

const MAX_ROWS = 500;

const SQL_SELECT_ITEM_BASE = `
WITH 
v_unit AS (SELECT CODE_NO, CODE_NAME FROM ${T_PUB_CODE} WHERE CODE='Unit'),
v_status AS (SELECT CODE_NO, CODE_NAME FROM ${T_PUB_CODE} WHERE CODE='ITEM_STATUS'),
v_mj AS (SELECT CODE_NO, CODE_NAME FROM ${T_PUB_CODE} WHERE CODE='PDM_MJ'),
v_mi AS (SELECT CODE_NO, CODE_NAME FROM ${T_PUB_CODE} WHERE CODE='ITEM_MOLD_INFO')

SELECT i.CODE_NAME 状态, t.ITEM_NO 物料编号, t.STUFF 材质, t.ITEM_NAME 物料名称, it.TYPE_NAME 小小类名称, t.RD_NO 研发编号, 
    t.ENG_ITEM_NO 工程图号, t.ITEM_SPEC 尺寸规格, t.P_SECTIONAL "单重(KG/M)", t.ITEM_REMARK 物料描述, t.UPLOAD_IMG 图片, 
    t.SD_PROVIDER 顺德供应商, i1.CODE_NAME 计量单位, i2.CODE_NAME 计价单位, t.RELEVANCE_NO 物料关联号, f.REMARK 计价公式, 
    t.P_PROPORTION 比重, mi.CODE_NAME 开模信息, mj1.CODE_NAME 模具1, mj2.CODE_NAME 模具2, t.P_LONG 长度, t.P_WIDTH 宽度, 
    t.P_HEIGHT 高度, t.P_DIAMETER 直径, t.P_THICK 厚度, t.P_DENSITY 周长, t.REMARK_SM 备注, t.WEIGHT_PRE 预计单重, 
    t.WEIGHT_MACHINING 加工单重, t.SURFACE_AREA 表面积, t.LENGTH_WELD 表面焊缝长度, t.P_SHORTRADIUS 椭圆短边, t.P_LONGRADIUS 椭圆长边, 
    ifnull(stc.USERNAME, t.CREATE_USER) 创建人, t.CREATE_TIME 创建时间, ifnull(stu.USERNAME,t.UPDATE_USER) 更新人, t.UPDATE_TIME 更新时间
	, COUNT() OVER () AS COUNT                                      --添加总计
FROM ${T_PDM_ITEM} t
INNER JOIN v_unit i1 ON i1.CODE_NO=t.MEASURE_UNIT                   --垃圾 plm用了迷之inner join
LEFT JOIN v_status i ON i.CODE_NO=t.ROWSTATE
LEFT JOIN v_unit i2 ON i2.CODE_NO=t.PRICE_UNIT
LEFT JOIN v_mj mj1 ON mj1.CODE_NO=t.ITEM_MJ1
LEFT JOIN v_mj mj2 ON mj2.CODE_NO=t.ITEM_MJ2
LEFT JOIN v_mi mi ON mi.CODE_NO=t.MOLD_INFO
LEFT JOIN ${T_PDM_ITEMTYPE} it ON t.TYPE_NO=it.TYPE_NO
LEFT JOIN ${T_PDM_ITEM_FORMULA} f ON t.FORMULA=f.FORMULA_NO
LEFT JOIN ${T_SYS_USER} stc ON stc.USERNO=t.CREATE_USER
LEFT JOIN ${T_SYS_USER} stu ON stu.USERNO=t.UPDATE_USER 

`;

const SQL_DROPDOWN_LISTS = {
    /**产品材质*/
    productmat: "SELECT STAFF_NO, NAME FROM T_PDM_PRO_STAFF ORDER BY STAFF_NO",
    /**产品年份*/
    productyear: "SELECT YEAR_NO, NAME FROM T_PDM_PRO_YEAR ORDER BY YEAR_NO",
    /**产品大类*/
    productbtype: "SELECT TYPE_NO, NAME FROM T_PDM_PRO_BTYPE ORDER BY TYPE_NO",
    /**产品中类*/
    productmtype: "SELECT PARENT_TYPE_NO, TYPE_NO, NAME FROM T_PDM_PRO_MTYPE ORDER BY PARENT_TYPE_NO, TYPE_NO",
    /**产品设计师*/
    productdesigner: "SELECT CODE_NO, CODE_NAME FROM T_PUB_CODE WHERE CODE='DESIGNER' ORDER BY CODE_NO",
    /**物料大类、中类、小类、小小类编号*/
    itemtype: "SELECT TYPE_NO,TYPE_NAME FROM  T_PDM_ITEMTYPE ORDER BY TYPE_NO",
    /**物料计价公式*/
    itemformula: "SELECT FORMULA_NO,REMARK FROM T_PDM_ITEM_FORMULA",
    /**物料状态*/
    itemstatus: "SELECT CODE_NO, CODE_NAME FROM T_PUB_CODE WHERE code='ITEM_STATUS' ORDER BY CODE_NO",
    /**BOM状态*/
    bomstatus: "SELECT CODE_NO, CODE_NAME FROM T_PUB_CODE WHERE code='BOM_STATUS' ORDER BY CODE_NO",
    /**客户列表*/
    customer: "SELECT CUSTOMER_NO, CUSTOMER_NAME FROM T_CRM_CUSTOMER ORDER BY CUSTOMER_NAME",
    /**研发设计人员列表*/
    rddesigners: `
        SELECT DISTINCT u.USERNO, u.USERNAME
        FROM T_SYS_USERGROUP g
        LEFT JOIN T_SYS_USER u ON u.USERNO=g.USERNO 
        LEFT JOIN T_SYS_GROUP v ON v.GROUPNO=g.GROUPNO 
        WHERE g.GROUPNO IN ('RD-研发设计部组员', 'RD-研发设计部组长', 'RD-研发设计部课长') 
        ORDER BY NLSSORT(u.USERNAME, 'NLS_SORT=SCHINESE_PINYIN_M') 
    `,
    /**角色组列表*/
    rolegroup: "SELECT GROUPNO, GROUPNAME FROM T_SYS_GROUP",
};

const SQL_UPDATE_ITME_LAST_UPDATETIME = `
    UPDATE ${T_PDM_ITEM} SET UPDATE_TIME = datetime('now') 
    WHERE ITEM_NO = ?
`;

class DbMyPLM extends IMySqliteWorkerable {

    /**
     * @param {boolean} usePool 是否使用线程池
     * @param {number} poolSize 可选默认cpu核心数 
     */
    constructor(usePool, poolSize) {
        super(dbPath, { verbose: (sql) => { LOG("", sql) } }, __filename, usePool, poolSize);
    }

    _initAsDb() {
        // Assert(false, "必须重载！");
        this._stmt_dropdowns = {};
    }

    _initAsDbPool() {
        // Assert(false, "必须重载！");
    }

    /**
     * 物料查询
     * @param {string} where where子句
     * @param {string} orderBy orderBy子句
     * @param {Object[]} values 子句所有要绑定的参数
     * @param {number} offset 偏移
     * @param {number} count 数量 
     * @returns {MyTableData|Promise<MyTableData>}
     */
    selectItems(where = '', orderBy = '', values = [], offset = 0, count = MAX_ROWS) {
        if (this.pool) return this.pool.asyncQuery("selectItems", ...arguments).then(mtd => MyTableData.decorate(mtd));

        WARN("selectItems %s %s offset=%s count=%s", where, orderBy, offset, count);
        const sql = `
            ${SQL_SELECT_ITEM_BASE}
            ${where ? where : ''}
            ${orderBy ? orderBy : ''}
            LIMIT ? OFFSET ?
        `;
        if (!this._stmt_selectItems || this._stmt_selectItems.source !== sql) {
            this._stmt_selectItems = this.db.prepare(sql);
        }
        const mtd = MySqlite.getMyTableData(this._stmt_selectItems, [...values, count, offset]);
        if (!mtd.error) {
            mtd.lasColumnSetAsTotalCount(true);
            mtd.setEOF(mtd.totalCount, offset);
        }


        return mtd;
    }

    /**
     * 更新物料的更新时间
     * @param {string} itemNo 
     * @returns {boolean|Promise<boolean>}
     */
    updateItemLastUpdateTime(itemNo) {
        if (this.pool) return this.pool.asyncQuery("updateItemLastUpdateTime", ...arguments);

        if (!this._stmt_updateItemLastUpdateTime) {
            this._stmt_updateItemLastUpdateTime = this.db.prepare(SQL_UPDATE_ITME_LAST_UPDATETIME);
        }
        const ret = this._stmt_updateItemLastUpdateTime.run(itemNo).changes > 0;
        return ret;
    }

    /**
     * @param {string} name  必须全小写
     * @returns {MyTableData|Promise<MyTableData>}
     */
    getListItems(name) {
        if (this.pool) return this.pool.asyncQuery("getListItems", ...arguments).then(mtd => MyTableData.decorate(mtd));;

        if (!SQL_DROPDOWN_LISTS[name]) {
            const mtd = new MyTableData();
            mtd.error = `dropdown list '${name}' is not exists!`;
            return mtd;
        }
        if (!this._stmt_dropdowns[name]) {
            this._stmt_dropdowns[name] = this.db.prepare(SQL_DROPDOWN_LISTS[name]);
        }
        const mtd = MySqlite.getMyTableData(this._stmt_dropdowns[name]);
        return mtd;
    }



}
module.exports = DbMyPLM;
if (!isMainThread) new MySqliteWorker(new DbMyPLM());
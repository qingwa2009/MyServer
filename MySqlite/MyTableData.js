
class MyTableData {
    /**用于分页查找，加载下一页 */
    ID = "";
    count = 0;
    /**对于分页查询可以用来显示查询到的总记录数，默认值-1 */
    totalCount = -1;
    EOF = true;
    title = [];
    type = [];
    data = [];
    error = "";

    /**
     * 枚举data里面的每一条数据，如果data的长度与title的长度不一致将报错
     * @param {boolean} cloneObject false时枚举返回同一个对象，true每次枚举返回新对象，默认false
     * @throws new TypeError("data length does not match title length!")
     */
    *iterator(cloneObject = false) {
        const n = this.data.length;
        const m = this.title.length;
        if (cloneObject) {
            for (let i = 0; i < n; i++) {
                const obj = {};
                const dt = this.data[i];
                if (dt.length !== m) throw new TypeError("data length does not match title length!");
                for (let j = 0; j < m; j++) {
                    obj[this.title[j]] = dt[j];
                }
                yield obj;
            }
        } else {
            const obj = {};
            for (let i = 0; i < n; i++) {
                const dt = this.data[i];
                if (dt.length !== m) throw new TypeError("data length does not match title length!");
                for (let j = 0; j < m; j++) {
                    obj[this.title[j]] = dt[j];
                }
                yield obj;
            }
        }
    }

    toString() {
        return JSON.stringify(this);
    }


    /**
     * 如果obj不包含title或者data将报错
     * @param {{}} obj 
     * @throws new TypeError("Its not MyTableData!")
     */
    static decorate(obj) {
        Object.setPrototypeOf(obj, MyTableData.prototype);

        if (!obj.hasOwnProperty("ID")) obj.ID = "";
        if (!obj.hasOwnProperty("EOF")) obj.EOF = true;
        if (!obj.hasOwnProperty("title")) throw new TypeError("Its not MyTableData!");
        if (!obj.hasOwnProperty("data")) throw new TypeError("Its not MyTableData!");
    }

}

module.exports = MyTableData;
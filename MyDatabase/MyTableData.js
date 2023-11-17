
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
     * @returns {IterableIterator<Object<string, string>>}
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

    /**
     * 将查询到的数据中第一行最后一列的数值保存为totalCount
     * @param {boolean} removeLasColumn 移除最后一列的title，默认true
     */
    lasColumnSetAsTotalCount(removeLasColumn = true) {
        if (this.data.length > 0) {
            this.totalCount = this.data[0][this.title.length - 1];//总计写入totalCount
            if (removeLasColumn) this.title.pop();//移除总计列
        }
    }

    /**
     * 根据总数和偏移判定是否EOF
     * @param {number} totalCount
     * @param {number} offset 
     */
    setEOF(totalCount, offset) {
        this.EOF = totalCount <= offset + this.data.length;
    }

    toString() {
        return JSON.stringify(this);
    }


    /**
     * 如果obj不包含title或者data将报错
     * @param {{}} obj 
     * @returns {MyTableData}
     * @throws new TypeError("Its not MyTableData!")
     */
    static decorate(obj) {
        if (!obj.hasOwnProperty("ID")) obj.ID = "";
        if (!obj.hasOwnProperty("EOF")) obj.EOF = true;
        if (!obj.hasOwnProperty("title")) throw new TypeError("Its not MyTableData!");
        if (!obj.hasOwnProperty("data")) throw new TypeError("Its not MyTableData!");

        Object.setPrototypeOf(obj, MyTableData.prototype);
        return obj
    }

}

module.exports = MyTableData;
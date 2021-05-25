class MySession {
    constructor() {
        this.name = "";
        this.ID = "";
        this.sessinoId = "";
    }


}
MySession.Guest = new MySession();
MySession.Guest.name = "guest";

module.exports = MySession;
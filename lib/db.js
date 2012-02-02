function DB() {
    this.storage = app.storage('db');
}

DB.prototype = {
    isExist: function(key, cb) {
        var data = this.storage.get(key);
        if (data) {
            cb(true, data);
        } else {
            cb(false);
        }
    },
    
    save: function(key, value) {
        this.storage.set(key, value);
    }
};

exports.DB = DB;
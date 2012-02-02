var jsdom = require('jsdom');
var ReqLog  = require('blaast/mark').RequestLogger;
var rlog = new ReqLog(app.log);
var storage = require('blaast/simple-data');
var http = require('blaast/simple-http');
var rssparser = require('htmlparser');
var _ = require('underscore');
var sys = require('sys');
var config = require('./lib/config');

var rssUrl = config.rssURL;

var debug = config.debug;

function DB() {
}
 
DB.prototype = {
    isExist: function(key, cb) {
        storage.get(key, function(err, data) {
            if (data) {
                cb(true, data);
            } else {
                cb(false);
            }
        });
    },
    
    save: function(key, value) {
        storage.set(key, value,  function(err, oldData) {
            if (err) {
                log.info('set() result was err = ' + err);
            }
        });
    }
};

function TeknoJurnalAPI(){
}

TeknoJurnalAPI.prototype = {
    jsdomRequest: function(url, cb){
        var r = rlog.start(url);
        jsdom.env(url,
            [
                'http://code.jquery.com/jquery-1.5.min.js'
            ],
            function(errors, window) {
                r.done();
                cb(window);
            }
        );
    },
    parseContent: function(window, cb) {
        var body = window.$(config.contentKey).text().trim().split(config.splitString)[0];
        if (debug) {
            console.log(body);
        }
        try {
            window.__stopAllTimers();
        } catch(e) { }
        cb(body);
    },
    menuRequest: function(cb) {
        var self = this;
        var data = [];
        var handler = new rssparser.RssHandler( function (error, dom) {
            if (error) {
                console.log(error);
                cb(error);
            } else {
                if (debug) {
                    sys.puts('Raw Data: ' + sys.inspect(dom, false, null));
                }
                _.each(dom.items, function(param){
                    if (debug) {
                        console.log('Id: ' + param.id);
                        console.log('Title: ' + param.title);
                        console.log('Pub Date: ' + param.pubDate);
                        console.log('Link: ' + param.link);
                        console.log('Description : ' + param.description);
                        console.log('########################################');
                    }
                    data.push({title: param.title, url: param.link});
                });
                cb(null, data);
            }
        });
        var parser = new rssparser.Parser(handler);
        
        var r = rlog.start(rssUrl);
        http.get(rssUrl, {
            ok: function(data) {
                r.done();
                parser.parseComplete(data);
            },
            error: function(err) {
                cb(err);
            }
        });
    },
    contentRequest: function(url, cb) {
        var self = this;
        self.jsdomRequest(url, function(window){
            self.parseContent(window, cb);
        });
    }
};

function TeknoJurnalUser(client, api){
    this.client = client;
    this.api = api;
    this.db = new DB();
}

TeknoJurnalUser.prototype = {
    getMenu: function(args){
        var self = this;
        this.api.menuRequest(function(err, lists){
            self.client.msg(args.action, {lists: lists});
        });
    },
    getContent: function(args){
        var self = this;
        self.db.isExist(args.title, function(exist, data) {
            if (exist) {
                self.client.msg(args.action, {content: data.content, title: args.title});
            } else { 
                self.api.contentRequest(args.url, function(content){
                    self.db.save(args.title, {content: content});
                    self.client.msg(args.action, {content: content, title: args.title});
                });
            }
        });
    }
};

app.message(function(client, action, param){
   var self = this;
   if (action.length > 0 && TeknoJurnalUser.prototype.hasOwnProperty(action)) {
        app.debug(client.header() + ' action="' + action + '"');
        var user = new TeknoJurnalUser(client, new TeknoJurnalAPI());
        user[action].apply(user, [param]);
    } else {
        app.debug(client.header() + ' unknown-action="' + action + '"');
    }
});
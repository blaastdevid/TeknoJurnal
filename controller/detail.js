var _ = require('common/util');
var ImageView = require('ui').ImageView;
var DB = require('../lib/db').DB;
var config = require('../lib/config');
var app = this;

function getTotalHeight(controls) {
	var total = 0;
	controls.forEach(function each(item){
		total += item.dimensions().height;
	});
	total += 20;
	return total;
}

_.extend(exports, {
	':load': function() {
		var self = this;
        self.db = new DB();
        self.style({
            'background-color': config.detailBackColor
        });
        self.get('title').style({
            'color': config.detailTitleColor
        });
        self.get('content').style({
            'color': config.detailContentColor
        });
		app.on('message', function(action, param){
			if(action === 'getContent'){
				clearInterval(self.intervalId);
				delete self.intervalId;
                self.db.save(param.title, {content: param.content});
				self.get('title').label(param.title);
				self.get('content').label(param.content);
			}
		});
	},
	
	':state': function(param) {
		var self = this;
        self.sct = 0;
		self.scrollTop(0);
		self.get('title').label(' ');
		self.get('content').label(config.waitText);
		self.intervalId = setInterval(function() {
			if(self.id === undefined){
				self.id = 1;
			}else if(self.id < 10){
				self.id++;
			}else {
				self.id = 1;
			}
			var temp = '';
			for(var i = 0; i < self.id; i++){
				temp = temp + '.';
			}
			
			self.get('content').label(config.waitText + temp);	
		}, 500);
        self.db.isExist(param.title, function(exist, data) {
            if (exist) {
                clearInterval(self.intervalId);
                delete self.intervalId;
				self.get('title').label(param.title);
				self.get('content').label(data.content);
            } else {
                app.msg('getContent', {action:'getContent', url: param.url, title: param.title});
            }
        });
	},
	
	':keypress': function(key) {
		var self = this;
		var totalHeight = getTotalHeight(self);
		
		if (self.sct === undefined) {
			self.sct = 0;
			self.scrollTop(0, 1000);
		} else if (key === 'up' || key === 'down') {
			var next = self.sct + (key === 'up' ? 50 : -50);
			
			if (next > 0) {
				next = 0;
			} else if (next <= ((totalHeight - self.dimensions().height) * -1)) {
				next = ((totalHeight - self.dimensions().height) * -1);
			}
			self.sct = next;
			self.scrollTop(next, 1000);
		}
	}
});
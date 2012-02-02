var _ = require('common/util');
var TextView = require('ui').TextView;
var config = require('../lib/config');
var app = this;

_.extend(exports, {
	':load': function() {
		var self = this; 
		var wait = new TextView({
			"label": config.waitText,
			"style": {
				"border": "5 0 0 0",
				"color": config.waitColor
			}
		});
		self.add('wait', wait);
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
			
			self.get('wait').label(config.waitText + temp);	
		}, 500);
		app.on('message', function(action, param){
			if(action === 'getMenu'){
				clearInterval(self.intervalId);
				delete self.intervalId;
				
				var i = 1;
				self.clear();
				param.lists.forEach(function(item){
					var temp;
					if (i % 2 === 0){
						temp = new TextView({
							label: item.title,
							style: {
								color: config.titleTextColor,
								width: 'fill-parent',
								'background-color': config.titleBackColorEven
							}
						});
						temp.on('blur', function(){
							this.style({
								'color': config.titleTextColor,
								'font-weight': 'normal',
								'background-color': config.titleBackColorEven
							});
						});
					}else{
						temp = new TextView({
							label: item.title,
							style: {
								color: config.titleTextColor,
								width: 'fill-parent',
								'background-color': config.titleBackColorOdd
								
							}
						});
						temp.on('blur', function(){
							this.style({
								'color': config.titleTextColor,
								'font-weight': 'normal',
								'background-color': config.titleBackColorOdd
							});
						});
					}
					temp.on('activate', function(){
						app.setContent('detail', {url: item.url, title: item.title});
					});
					temp.on('focus', function(){
						this.style({
							'color': config.titleHoverTextColor,
							'font-weight': 'bold',
							'background-color': config.titleHoverBackColor
						});
					});
					
					self.add(item.url, temp);
					i++;
				});
			}
		});
		app.on('connected', function(){
			console.log('Connected to Backend');
			app.msg('getMenu', {action:'getMenu'});
		});
		
	},
	
	':keypress': function(key) {
		console.log(key);
		if (this.index === undefined) {
			if (this.size() > 0) {
				this.focusItem(0);
			}
		} else if (key === 'up' || key === 'down') {
			var next = this.index + (key === 'up' ? -1 : 1);

			if (next < 0) {
				next = 0;
			} else if (next > (this.size()-1)) {
				next = this.size()-1;
			}

			if (this.index === next) {
				return;
			}

			this.focusItem(next);
		} else if (key === 'fire') {
			this.get(this.index).emit('activate');
		}
	}, 
	
	focusItem: function(index) {
		if (this.index !== undefined) {
			this.get(this.index).emit('blur');
		}
		this.index = index;
		this.get(index).emit('focus');
		this.scrollTo(index);
	}
});

var bowerRegistry = require('bower-registry'),
async = require('async'),
fetch = require('./fetch.js'),
//port = '6789',
port = '6379',
host = '127.0.0.1',
fs = require('fs'),
Registry = bowerRegistry.Registry,
RedisDb = bowerRegistry.RedisDb;

//扩展一个list方法
RedisDb.prototype.keys = function(key, cb) {
	this.client.keys(key, cb);
};
RedisDb.prototype.hgetall = function(keys, cb) {
	this.client.hgetall(keys, cb);
};

RedisDb.prototype.saveOrigin = function(arr,cb) {
	var client = this.client;
	console.log(arr.length);
	async.filter(arr, function(item,cb) {
		client.exists(item.name, function(err, ret) {
			if (!ret) {
				cb(item);
			} else {
				cb(err || ret);
			}
		});
	},
	function(rets) {
        async.each(rets,function(item,cb){
            client.hmset(item.name,'name',item.name,'url',item.url,function(err){
               if(err) cb(err);  
               else cb(null);
            });
        },function(err){
            if(err) cb(err);
            else cb(null);
        });
	});
};

var redisDB = new RedisDb({
	port: port,
	host: host
});

fetch(function(err, arr) {
	if (!err) redisDB.saveOrigin(arr,function(err){
        if(err) console.log(err);
        else{
            console.log('set finished'); 
        }
    });
});

var publish_key = fs.readFileSync(__dirname + '/publish_key').toString();

var registry = new Registry({
	db: redisDB,
	'private': true
});

registry.server.post('/packages', function(req, res, next) {
	var ua = req.headers['user-agent'];
	if (ua && ua.trim() == publish_key.trim()) {
		next();
	} else {
		res.send(401);
	}
});

registry.server.get('/list', function(req, res, next) {
	redisDB.keys('*', function(err, replies) {
		if (err) {
			next(err);
		} else {
			async.map(replies, redisDB.client.hgetall.bind(redisDB.client), function(err, pkgs) {
				if (err) next(err);
				else {
					pgks = pkgs.map(function(pkg) {
						delete pkg.hits;
						return pkg;
					});
					res.header("Access-Control-Allow-Origin", "*");
					res.header("Access-Control-Allow-Headers", "X-Requested-With");
					res.header("Access-Control-Allow-Methods", "GET");
					res.send(pkgs);
				}
			});
		}
	});
});

registry.initialize().listen(7777);


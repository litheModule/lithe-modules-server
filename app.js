var bowerRegistry = require('bower-registry'),
async = require('async'),
port = '6789',
host = '127.0.0.1',
fs = require('fs'),
Registry = bowerRegistry.Registry,
RedisDb = bowerRegistry.RedisDb;

//扩展一个list方法
RedisDb.prototype.keys= function(key,cb){
   this.client.keys(key,cb);
};
RedisDb.prototype.hgetall= function(keys,cb){
   this.client.hgetall(keys,cb);
};

var redisDB = new RedisDb({
	port: port,
	host: host
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
    redisDB.keys('*',function(err,replies){
        if(err){
            next(err);
        }else{
            async.map(replies,redisDB.client.hgetall.bind(redisDB.client),function(err,pkgs){
                if(err) next(err);
                else{
                    pgks = pkgs.map(function(pkg){
                        delete pkg.hits;
                        return pkg;
                    });
                    res.header("Access-Control-Allow-Origin","*");
                    res.header("Access-Control-Allow-Headers","X-Requested-With");
                    res.header("Access-Control-Allow-Methods","GET");
                    res.send(pkgs); 
                }
            });
        }
    });
});

registry.initialize().listen(7777);


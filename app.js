var bowerRegistry = require('bower-registry'),
fs = require('fs'),
Registry = bowerRegistry.Registry,
RedisDb = bowerRegistry.RedisDb;

var publish_key = fs.readFileSync(__dirname + '/publish_key').toString();

var registry = new Registry({
        db: new RedisDb({
            port:'6789',
            host:'127.0.0.1'
        }),
        'private':true
});

registry.server.post('/packages',function(req,res,next){
        var ua = req.headers['user-agent'];
        if(ua && ua == publish_key){
            next();
        }else{
            res.send(401);
        }  
});
registry.initialize().listen(7777);

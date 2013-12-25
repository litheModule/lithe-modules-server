var request = require('request');
var Origin = 'https://bower.herokuapp.com/packages';

function fetch(cb) {
	request(Origin, function(err, res, body) {
		if (err) cb(err);
		else {
			var arr = JSON.parse(body);
			cb(null, arr);
		}
	});
}

module.exports = fetch;


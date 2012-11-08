var express = require("express");

exports.start = function(options, callback) {
	var app = express.createServer();

	require("./socketServer.js")({app : app, config : options}, function(err, socketServer) {
		if (err) {callback(err);} else {
			require("./webServer.js")({app : app, config : options, socketServer : socketServer}, function(err, webServer) {
				if (err) {callback(err);} else {
					app.listen(options.port);
	
					console.log("Test server listening on port : "+ options.port);
				
					callback();
				}
			});
		}
	});	
};
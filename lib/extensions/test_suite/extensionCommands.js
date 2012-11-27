var fs=require("fs"), path = require("path"), childProcess = require("child_process"),
		ce = require("cloneextend");

var ideServer = require("./server/server.js");

var staticConfig = { idePort : 8222 };

module.exports = function(extOptions) {
	return {
		ide : function(config) {
			var idePort = extOptions.config && extOptions.config.idePort ? extOptions.config.idePort : staticConfig.idePort;
			startIde(config, idePort, function(err) {
				if (err) {
					console.error("An error occurred running the ide...");
					console.error(err);
					process.exit(1);
				} else {
					if (config.launch) {
						var execCommand = "start http://localhost:"+ staticConfig.idePort;
						childProcess.exec(execCommand);
					}
				}
			});
		}
	};
};

function startIde(config, port, callback) {
	if (!config.bin) {
		console.error("Error. You must specify a bin location for cucumber");
		process.exit(1);
	} else {
		ideServer.start(ce.cloneextend(config, {
			port : port,
			glossaryFile : path.join(config.features, "glossary.js")
		}), callback);
	}
}
var path = require("path"), childProcess = require('child_process');

module.exports = function(extOptions, callback) {
	callback(null, {
		name : "report_core",
		assets : require("./extensionAssets.js"),
		commands : require("./extensionCommands.js")(extOptions),
		hook : require("./extensionHooks.js")(extOptions),
		templates : path.resolve(__dirname, "templates"),
		behaviours : require("./extensionBehaviours.js")
	});
};
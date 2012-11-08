var path = require("path");

module.exports = function(extOptions, callback) {	
	callback(null, {
		name : "test_suite",
		assets : require("./extensionAssets.js"),
		commands : require("./extensionCommands.js")(extOptions),
		hook : require("./extensionHooks.js")(extOptions),
		templates : path.resolve(__dirname, "templates")
	});
};
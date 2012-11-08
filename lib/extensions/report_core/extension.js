var path = require("path");

module.exports = function(extOptions, callback) {
	callback(null, {
		name : "report_core",
		assets : require("./extensionAssets.js"),
		commands : require("./extensionCommands.js")(extOptions),
		hook : require("./extensionHooks.js")(extOptions),
		templates : path.resolve(__dirname, "templates")
	});
};
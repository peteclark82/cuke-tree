var path = require("path"), fs = require("fs");

module.exports = function(extOptions, callback) {	
	callback(null, {
		name : "test_suite",
		assets : require("./extensionAssets.js"),
		commands : require("./extensionCommands.js")(extOptions),
		hook : require("./extensionHooks.js")(extOptions),
		templates : path.resolve(__dirname, "templates"),
		behaviours : function(ctContext) {
			return {
				getTestHistory : getTestHistory
			};
			
			function getTestHistory(callback) {
				fs.readdir(ctContext.inputDir, function(err, files) {
					if (err) { callback(err); } else {
						files.sort(function(a, b) {
							var aTime = fs.statSync(path.join(ctContext.inputDir, a)).mtime.getTime();
							var bTime = fs.statSync(path.join(ctContext.inputDir, b)).mtime.getTime();
							return bTime - aTime;
						});
						var finalFiles = [];
						files.forEach(function(file) {
							if (path.extname(file) == ".js") {
								finalFiles.push(file);
							}
						});
						callback(null, finalFiles);
					}
				});
			}
		}
	});
};
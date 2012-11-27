var path = require("path"), childProcess = require('child_process');

module.exports = function(extOptions, callback) {
	callback(null, {
		name : "report_core",
		assets : require("./extensionAssets.js"),
		commands : require("./extensionCommands.js")(extOptions),
		hook : require("./extensionHooks.js")(extOptions),
		templates : path.resolve(__dirname, "templates"),
		behaviours : function(ctContext) {
			return {
				runTests : runTests,
				generateGlossary : require("./generators/glossaryGenerator.js").generate	
			};
			
			function runTests(options, callback) {
				var command = ctContext.bin +" "+ options.run;
				var parts = command.split(" ");
				var name = parts[0];
				var args = parts.slice(1, parts.length);
				if (options.dryRun) {
					args.push("--dry-run");
				}
				args.push("-o");
				args.push(options.output);
				var proc = childProcess.spawn(name, args, { stdio: [process.stdin, (options.stdout ? 'pipe' : process.stdout), process.stderr]});
				proc.on('exit', callback);
				if (options.stdout) {	
					proc.stdout.on("data", options.stdout);
				}
			}
		}
	});
};
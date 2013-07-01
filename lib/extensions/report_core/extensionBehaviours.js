var path = require("path"), childProcess = require('child_process');

module.exports = function(ctContext) {
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
		var proc = childProcess.spawn(name, args, { stdio: ['ignore', (options.ignoreStdout ? 'ignore' : process.stdout), process.stderr]});
		proc.on('exit', callback);
	}
};
var fs = require("fs"), path = require("path");
var childProcess = require('child_process');
var glossaryGenerator = require("./extensions/report_core/generators/glossaryGenerator.js"); //need to refactor into extension!!!


module.exports = {
	runTests : runTests,
	getTestHistory : getTestHistory,
	generateGlossary : glossaryGenerator.generate,
	internal : require("./cukeTree.internal.js")
};


function runTests(options) {
	var command = options.cucumberBin +" "+ options.features;
	var parts = command.split(" ");
	var name = parts[0];
	var args = parts.slice(1, parts.length);
	if (options.skeleton) {
		args.push("-s");
	}
	args.push("-o");
	args.push(options.output);
	var proc = childProcess.spawn(name, args, { stdio: [process.stdin, (options.stdout ? 'pipe' : process.stdout), process.stderr]})
		.on('exit', options.finishedCallback);
	if (options.stdout) {	
		proc.stdout.on("data", options.stdout);
	}
}

function getTestHistory(options, callback) {
	fs.readdir(options.output, function(err, files) {
		if (err) { callback(err); } else {
			files.sort(function(a, b) {
				var aTime = fs.statSync(path.join(options.output, a)).mtime.getTime();
				var bTime = fs.statSync(path.join(options.output, b)).mtime.getTime();
				return bTime - aTime;
			});
			callback(null, files);
		}
	});
}

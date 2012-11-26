var sys = require("sys"), fs=require("fs"), path = require("path"), childProcess = require("child_process"), 
	color = require("ansi-color").set;

var cukeTree = require("../../cukeTree.js");

module.exports = function(extOptions) {
	return {
		run : function(config) {
			generateReport(config, function(err) {
				if (err) {
					console.error(color(sys.inspect(err), "red+bold"));
					safeExit(1);
				} else {
					if (config.launch) {
						var execCommand = "start "+ path.join(config.output, "report.htm");
						childProcess.exec(execCommand);
					}
				}
			});
		}
	};
};

function generateReport(config, callback) {
	if (config.run) {
		console.log("Running cucumber process...");
		cukeTree.runTests({
			cucumberBin : config.bin,
			output : config.input, //cukeTree input (report.json)
			features : config.run, 
			finishedCallback : function(code) {
				if (code > 1) { 
					callback("Cucumber Process Exited Unexpectedly with code : "+ code);
				} else {
					fs.exists(config.input, function(exists) {
						if (exists) {
							console.log("Building CukeTree report...");
							buildReport(code);
						} else {
							callback("Cucumber report not found : "+ config.input +"\nProcess Exit Code : "+ code);
						}
					});
				}				
			}
		});
	} else {
		buildReport(0);
	}
	
	function buildReport(code) {
		cukeTree.internal.pipelines.profiles.report.default({
			input : config.input,
			features : config.features,
			extensions : config.extensions
		}, function(err, result) {
			if (err) {callback(err);} else {
				console.log("Saving CukeTree report...");
				saveReport(config.output, result.data.page, result.glossaryJson, result.loadedExtensions, function(err) {
					if (err) {callback(err);} else {
						console.log("CukeTree report successfully built and saved :-");
						console.log(config.output);
						if (code == 0) {
							callback();
						} else {
							callback("One or more cucumber tests failed : "+ code);
						}
					}
				});
			}
		});
	}
	
	function saveReport(outputPath, report, glossaryJson, loadedExtensions, callback) {
		var outputFile = path.join(outputPath, "report.htm");
		console.log("Building CukeTree report structure...");
		cukeTree.internal.assets.manager.buildDirectory({input : config.input, output : outputPath, extensions : loadedExtensions}, function(err) {
			if (err) {callback(err);} else {
				console.log("Writing report HTML...");
				fs.writeFile(outputFile, report, "ascii", function(err) {
					if (err) {callback(err);} else {
						console.log("Writing report glossary...");
						var glossaryDefinitionScript = "var glossaryDef = "+ JSON.stringify(glossaryJson, null, 3) + ";";
						fs.writeFile(path.join(outputPath, "glossary_definitions.js"), glossaryDefinitionScript, function(err) {
							if (err) {callback(err);} else {
								callback();
							}
						});											
					}
				});
			}
		});
	}
}

function safeExit(errorCode) {
	// --- exit after waiting for all pending output ---
	var waitingIO = false;
	process.stdout.on('drain', function() {
		if (waitingIO) {
			// the kernel buffer is now empty
			process.exit(errorCode);
		}
	});
	if (process.stdout.write("")) {
		// no buffer left, exit now:
		process.exit(errorCode);
	} else {
		// write() returned false, kernel buffer is not empty yet...
		waitingIO = true;
	}	
}
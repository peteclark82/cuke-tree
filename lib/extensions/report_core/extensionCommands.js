var sys = require("sys"), fs=require("fs"), path = require("path"), childProcess = require("child_process"), 
	color = require("ansi-color").set;

var cukeTree = require("../../cukeTree.js");

module.exports = function(extOptions) {
	return {
		run : function(config) {
			generateReport(config, function(err) {
				if (err) {
					console.error(color(sys.inspect(err), "red+bold"));
					process.exit(1);
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
							runReport(code);
						} else {
							callback("Cucumber report not found : "+ config.input +"\nProcess Exit Code : "+ code);
						}
					});
				}				
			}
		});
	} else {
		runReport(0);
	}
	
	function runReport(code) {
		cukeTree.internal.pipelines.profiles.report.default({
			input : config.input,
			features : config.features,
			extensions : config.extensions
		}, function(err, result) {
			if (err) {callback(err);} else {
				buildAndSaveReport(config.output, result.data.page, result.glossaryJson, result.loadedExtensions, function(err) {
					if (err) {callback(err);} else {
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
	
	function buildAndSaveReport(outputPath, report, glossaryJson, loadedExtensions, callback) {
		var outputFile = path.join(outputPath, "report.htm");
		cukeTree.internal.assets.manager.buildDirectory({input : config.input, output : outputPath, extensions : loadedExtensions}, function(err) {
			if (err) {callback(err);} else {
				fs.writeFile(outputFile, report, "ascii", function(err) {
					if (err) {callback(err);} else {
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
var fs=require("fs"), path = require("path"), childProcess = require("child_process"), 
	color = require("ansi-color").set;

var cukeTree = require("../../cukeTree.js");

module.exports = function(extOptions) {
	return {
		run : function(config) {
			generateReport(config, function(err) {
				if (err) {
					console.error(err);
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
			finishedCallback : cucumberProcessFinished,
			exitedCallback : function(code) {
				if (code === 0 || code === 1) {
					runReport(code);
				} else {
					callback("Tests failed unexpectedly and exited with code : " + code);
				}	
			}
		});
	} else {
		runReport();
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
							callback("One or more cucumber tests failed.");
						}
					}
				});
			}
		});
	}
}

function buildAndSaveReport(outputPath, report, glossaryJson, loadedExtensions, callback) {
	var outputFile = path.join(outputPath, "report.htm");
	cukeTree.internal.assets.manager.buildDirectory({output : outputPath, extensions : loadedExtensions}, function(err) {
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

function cucumberProcessFinished(error, stdout, stderr) {
	console.log(color("\n------------------------------------------------------------", "black+white_bg"));
	if (error) { 
		console.log(color("Child Process Error:-", "red+bold"));
		console.log(color("Error code: ", "yellow") +error.code);
		console.log(color("Signal received: ", "yellow") +error.signal);
		console.log(color("Stack:- ", "yellow+bold"));
		console.log(error.stack);
		console.log(color("STDERR:-\n", "red+bold") +stderr);
		console.log(color("STDOUT:-\n", "green+bold") +stdout);
	} else {
		console.log(stdout);
	}				
	console.log(color("------------------------------------------------------------", "black+white_bg"));
}
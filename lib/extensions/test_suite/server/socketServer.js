var fs = require("fs"), path = require("path"), childProcess = require('child_process'),
		ce = require("cloneextend"), color = require("ansi-color").set, $f = require("fluid"),
		handlebars = require("handlebars");

var cukeTree = require("../../../cukeTree.js");
var testSuiteTemplates = cukeTree.internal.templates.loader.getSync(path.resolve(__dirname, "../templates"));


module.exports = function(options, callback) {
	var app = options.app;
	var config = options.config;
	
	var io = require("socket.io").listen(app);
	io.disable("log");

	var runningSocket = null;
		
	io.of("/cuke-tree")
	.on("connection", function(socket) {
		runningSocket = socket
		.on("runTests", onRunTests)
		.on("getReport", onGetReport)
		.on("edit", edit);
		
		getTestHistory();
	});
	
	fs.watch(config.glossaryFile, function(type, filename) {
		fs.stat(config.glossaryFile, function(err, stats) {
			if (stats.size > 0) { updateGlossary(); }
		});
	});	
	
	var server = {};
	callback(null, server);
	
	/* Socket Handlers */
	function onRunTests(data) {
		var jsonFilename = new Date().toString().replace(" GMT+0100 (GMT Daylight Time)","").replace(/\:/g, "_") + ".js";
		jsonFilename = path.join(config.resultsPath, jsonFilename);
		if (data.dryRun) {
			runTests({
				feature : data && data.feature ? data.feature : config.featuresPath,
				output : jsonFilename,
				dryRun : true
			});
		} else {
			var scenarioCount = 0
			runTests({
				feature : data && data.feature ? data.feature : config.featuresPath,
				output : jsonFilename,
				dryRun : true,
				stdout : function(stdout) {
					var re = /\[SCENARIO\]/g;
					var match = re.exec(stdout);
					while (match != null) {
						scenarioCount++;
						match = re.exec(stdout);
					}
				},
				finishedCallback : function(code) {
					console.log(color("\n------------------------------------------------------------", "black+white_bg"));
					if (code > 0) { 
						console.log(color("Cucumber dry run process exited expectedly with code : "+ code, "red+bold"));
						runningSocket.emit("testsError", { error : "Exited with code : "+ code });
					} else {
						console.log(color("Cucumber dry run process exited with code : "+ code, "green+bold"));
						runTests({
							feature : data && data.feature ? data.feature : config.featuresPath,
							output : jsonFilename,
							dryRun : false,
							scenarioCount : scenarioCount
						});
					}				
					console.log(color("------------------------------------------------------------", "black+white_bg"));
				}
			});
		}
	}
	
	function runTests(options) {
		var scenarioIndex = 0;
		console.log(color("\n------------------------------------------------------------", "black+white_bg"));
		console.log(color("Running cucumber"+ (options.dryRun ? " dry run " : " ") +"feature path :-\n  "+ options.feature, "yellow+bold"));
		console.log(color("JSON output path :-\n  "+ options.output, "yellow+bold"));
		console.log(color("\n------------------------------------------------------------", "black+white_bg"));
		cukeTree.runTests({
			cucumberBin : config.cucumberBin,
			output : options.output,
			features : options.feature, 
			finishedCallback : options.finishedCallback ? options.finishedCallback : cucumberProcessFinished(options.output),
			dryRun : options.dryRun,
			stdout : options.stdout ? options.stdout : function(stdout) {
				if (options.scenarioCount) {
					var re = /\[SCENARIO\]\[STATUS\:(.+)\]/g;
					var match = re.exec(stdout);
					while (match != null) {
						scenarioIndex++;
						var scenarioStatus = match[1];
						runningSocket.emit("testsProgressed", { percent : Math.round((100 / options.scenarioCount) * scenarioIndex), scenarioStatus : scenarioStatus });
						match = re.exec(stdout);
					}
				}
				console.log(stdout.toString());
			}
		});
	}
	
	function onGetReport(data) {
		console.log(color("\n------------------------------------------------------------", "black+white_bg"));
		console.log(color("Generating report", "yellow+bold"));
		console.log(color("\n------------------------------------------------------------", "black+white_bg"));
		cukeTree.internal.pipelines.profiles.report.default({
			input : path.join(config.resultsPath, data.filename),
			features : config.featuresPath,
			extensions : config.extensions
		}, function(err, result) {
			console.log(color("\n------------------------------------------------------------", "black+white_bg"));
			if (err) {
				console.log(color("Error generating report :-", "red+bold"));
				console.log(err);
				runningSocket.emit("reportError", { error : err });
			} else {
				console.log(color("Report successfully generated", "green+bold"));
				runningSocket.emit("reportReceived", result.data);
				getTestHistory();
				updateGlossary();
			}
			console.log(color("\n------------------------------------------------------------", "black+white_bg"));
		});
	}
	
	function edit(data) {
		var cmd = "start "+ data.uri;
		childProcess.exec(cmd);
	}
	
	/* Private Functions */	
	function getTestHistory() {
		cukeTree.getTestHistory({ output : config.resultsPath}, function(err, files) {
			if (err) {
				console.log("Error getting test history");
				console.log(err);
			} else {
				runningSocket.emit("testHistoryUpdated", { testHistory : files });
			}
		});
	}
		
	function updateGlossary() {
		cukeTree.generateGlossary({ features : config.featuresPath, templates : testSuiteTemplates }, function(err, result) {
			if (err) {
				runningSocket.emit("glossaryUpdated", { error : err });
			} else {
				runningSocket.emit("glossaryUpdated", result);
			}
		});
	}
		
	function cucumberProcessFinished(jsonFilename) {
		return function(code) {
			console.log(color("\n------------------------------------------------------------", "black+white_bg"));
			if (code > 1) { 
				console.log(color("Cucumber process exited unexpectedly with code : "+ code, "red+bold"));
				runningSocket.emit("testsError", { error : "Exited with code : "+ code }); //should include actual error message!!
			} else {
				console.log(color("Cucumber process exited with code : "+ code, "green+bold"));
				runningSocket.emit("testsFinished", { filename : path.relative(config.resultsPath, jsonFilename) });
			}				
			console.log(color("------------------------------------------------------------", "black+white_bg"));
		};
	}
};
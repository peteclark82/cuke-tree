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
		.on("runTests", runTests)
		.on("getReport", getReport)
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
	function runTests(data) {
		var jsonFilename = new Date().toString().replace(" GMT+0100 (GMT Daylight Time)","").replace(/\:/g, "_") + ".js";
		jsonFilename = path.join(config.resultsPath, jsonFilename);
		cukeTree.runTests({
			cucumberBin : config.cucumberBin,
			output : jsonFilename,
			features : data && data.feature ? data.feature : config.featuresPath, 
			finishedCallback : cucumberProcessFinished,
			exitedCallback : cucumberErrored(jsonFilename)
		});
	}
	
	function getReport(data) {
		cukeTree.internal.pipelines.profiles.report.default({
			input : path.join(config.resultsPath, data.filename),
			features : config.featuresPath,
			extensions : config.extensions
		}, function(err, result) {
			if (err) {
				runningSocket.emit("reportError", { error : err });
			} else {
				runningSocket.emit("reportReceived", result.data);
				getTestHistory();
				updateGlossary();
			}
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
		
	function cucumberProcessFinished(error, stdout, stderr) {
		console.log(color("\n------------------------------------------------------------", "black+white_bg"));
		if (error) { 
			console.log(color("Cucumber Process Error:-", "red+bold"));
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

	function cucumberErrored(jsonFilename) {
		return function(code) {
			if (code === 0 || code === 1) {
				runningSocket.emit("testsFinished", { filename : path.relative(config.resultsPath, jsonFilename) });
			} else {
				var err = "Tests failed and exited with code : " + code;
				console.log(err);
				runningSocket.emit("testsError", { error : err });
			}	
		};
	}
};
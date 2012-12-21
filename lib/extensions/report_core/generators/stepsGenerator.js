var fs = require("fs"), path = require("path"), walk = require("walk"),
		handlebars = require("handlebars"), ce = require("cloneextend"), $f = require("fluid");


exports.generate = function(options, callback) {		
	$f(fs)
		({name: "results"}).readFile(options.input)
	.with(getStepDefinitions)
		({name: "stepDefinitions"}).self(options.features)
	.go(function(err, res) {
		if (err) { callback(err); } else {	
			var resultsJson = JSON.parse(res.results[0].toString());
			var stepsJson = getStepsWithStats(res.stepDefinitions[0], resultsJson);
			callback(null, stepsJson);
		}
	});
};

function getStepDefinitions(featuresPath, callback) {
	var stepFiles = [];

	var walker = walk.walk(featuresPath, { followLinks: false });

	walker.on("file", function (root, fileStats, next) {
		var filePath = path.join(root,fileStats.name);
		var steps = getStepsFromModule(filePath);
		if (steps.length > 0) {
			stepFiles.push({ name : path.relative(featuresPath, filePath), filename : filePath, steps : steps });
		}
		next();
	});

	walker.on("errors", function (root, nodeStatsArray, next) {
		console.log("ERROR OCCURRED WALKING STEP DEFS");
		callback({ message : "ERROR OCCURRED WALKING STEP DEFS"});
		next();
	});

	walker.on("end", function () {
		callback(null, stepFiles);
	});
}

function getStepsFromModule(filePath) {
	var steps = [];
	
	if (path.extname(filePath) === ".js") {
		var possibleSteps = require(filePath);
		if (possibleSteps instanceof Function) {
			var context = {};
			context.Given = wrapper("Given");
			context.When = wrapper("When");
			context.Then = wrapper("Then");
			possibleSteps.apply(context);
		}
	}
	
	return steps;
	
	function wrapper(keyword) {
		return function(pattern, func, options) {
			steps.push({
				keyword : keyword,
				pattern : pattern,
				func : func,
				options : options
			});
		};
	}	
}

function getStepsWithStats(stepsJson, resultsJson) {
	/*
		Need to optimise and make sure works when resultsJson is empty,
			currently doesn't show step names in report because never reaches
			in the loop
	*/	
	resultsJson.forEach(function(item) {
		if (item.type=="FeatureGroup") {
			item.elements.forEach(function(feature) {
				processFeature(stepsJson, feature);
			});
		} else {
			processFeature(stepsJson, item);
		}
	});
	
	return stepsJson;
}

function processFeature(stepsJson, feature) {
	(feature.elements ? feature.elements : []).forEach(function(scenario) {
		(scenario.steps ? scenario.steps : []).forEach(function(step) {
			var stepName = step.name.replace(/^(Given\s|When\s|Then\s|And\s)/, "");
			stepsJson.forEach(function(stepFile) {
				stepFile.steps.forEach(function(stepDef) {
					var regEx = stepDef.pattern;
					if (!(regEx instanceof RegExp)) {
						var pattern = "^" + regEx.replace(/\$[\w\d]+/g, "[\\w\\d]+") + "$"
						regEx = new RegExp(pattern);
					}
					if (stepDef.patternString === undefined) {
						stepDef.patternString = regEx.toString();
					}
					if (stepDef.summary === undefined) {
						stepDef.summary = { called : [] };
					}
					if (regEx.test(stepName)) {
						stepDef.summary.called.push({
							featurePath : feature.uri,
							featureName : feature.name,
							scenarioName : scenario.name,
							stepName : step.name
						});
					}
				});
			});
		});
	});
}
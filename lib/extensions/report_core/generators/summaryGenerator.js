var fs = require("fs"), path = require("path");

var statusOrder = ["passed", "skipped", "pending", "stepless", "undefined", "failed"];
var statusManager = require("./statusManager.js")(statusOrder);

exports.generate = function(options, callback) {		
	fs.readFile(options.input, function(err, resultsJsonString) {
		if (err) {callback(err);} else {
			var features = JSON.parse(resultsJsonString.toString());
			if (features.length > 0 && features[0].type == "FeatureGroup") {
				var allFeatures = [];
				features.forEach(function(featureGroup) {
					allFeatures = allFeatures.concat(featureGroup.elements);
				});
				features = allFeatures;
			}
			
			var summaryJson = { features : {}, scenarios : {}, tags : [] };
			statusOrder.forEach(function(status) {
				summaryJson.features[status] = summaryJson.scenarios[status] = 0;
			});
			
			var overallStatus = statusManager.create();
			features.forEach(function(feature) {
				var featureStatus = statusManager.create();
				(feature.elements ? feature.elements : []).forEach(function(scenario) {
					if (scenario.keyword == "Scenario") {
						var scenarioStatus = statusManager.create();
						(scenario.steps ? scenario.steps : []).forEach(function(step) {
							if (step.result) {
								scenarioStatus.update(step.result.status);
								featureStatus.update(step.result.status);
								overallStatus.update(step.result.status);
							}
						});
						if (!scenario.steps || scenario.steps.length === 0) {
							scenarioStatus.update("stepless");
							featureStatus.update("stepless");
							overallStatus.update("stepless");
						}
						summaryJson.scenarios[scenarioStatus.get()]++;
						(scenario.tags ? scenario.tags : []).forEach(function(tag) {
							var tagSummary = null;
							for(var i=0; i<summaryJson.tags.length; i++) {
								if (summaryJson.tags[i].name === tag.name) {
									tagSummary = summaryJson.tags[i];
									break;
								}
							}
							if (tagSummary === null) {
								tagSummary = { name : tag.name, count : 0 };
								summaryJson.tags.push(tagSummary);
							}
							tagSummary.count++;
						});
					}
				});
				summaryJson.features[featureStatus.get()]++;
			});
			summaryJson.status = overallStatus.get();
			
			for(var state in summaryJson.features) {
				summaryJson.featureCount = summaryJson.featureCount
					? summaryJson.featureCount + summaryJson.features[state]
					: summaryJson.features[state];
			}
			
			for(var state in summaryJson.scenarios) {
				summaryJson.scenarioCount = summaryJson.scenarioCount
					? summaryJson.scenarioCount + summaryJson.scenarios[state]
					: summaryJson.scenarios[state];
			}
			
			callback(null, summaryJson);
		}
	});
};
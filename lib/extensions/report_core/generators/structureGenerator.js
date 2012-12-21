var fs = require("fs"), path = require("path"), s = require("string");

var statusOrder = ["passed", "skipped", "pending", "stepless", "undefined", "failed"];
var statusManager = require("./statusManager.js")(statusOrder);

exports.generate = function(options, callback) {		
	fs.readFile(options.input, function(err, jsonResults) {
		if (err) {callback(err);} else {
			callback(null, buildStructure(JSON.parse(jsonResults.toString())));
		}
	});
	
	function buildStructure(jsonReport) {
		var structure = {
			"id" : "root",
			"name" : "Root",
			"keyword" : "Group",
			"uri" : options.features,
			"features" : [],			
			"children" : []
		};
			
		jsonReport.forEach(function(item) {		
			if (item.type == "FeatureGroup") {
				var featureGroup = {
					"id" : item.id,
					"name" : item.name,
					"keyword" : "Group",
					"features" : [],
					"children" : []
				};
				structure.children.push(featureGroup);
				item.elements.forEach(function(feature) {
					addToStructure(featureGroup, feature, item.name+"_");
				});
			} else {
				var feature = item;
				addToStructure(structure, feature);
			}
		});
		
		calculateBubbledStatus(structure);
		return structure;
	}
	
	function addToStructure(structure, feature, prefix) {
		var pathParts = normalizeFeaturePath(feature.uri).split(path.sep);
		var currentLevel = structure;
		for(var i=0; i<pathParts.length - 1; i++) {
			var pathPart = pathParts[i];
			var parentPath = pathParts.slice(0, i+1).join(path.sep);
			currentLevel = ensurePath(currentLevel.children, pathPart, parentPath, prefix);
		}
		for(var i=0; i<(feature.elements ? feature.elements.length : 0); i++) {
			if (feature.elements[i].keyword != "Scenario"){ 
				feature.elements.splice(i, 1); i--;
			}
		}
		currentLevel.features.push(feature);
	}
	
	function ensurePath(childStructure, pathPart, parentPath, prefix) {
		var found = null;
		var friendlyName = s(pathPart.replace(/_/g, " ")).capitalize().toString();
		for(var i=0; i<childStructure.length; i++) {
			if (childStructure[i].pathPart === pathPart) {
				found = childStructure[i];
				break;
			}
		}
		if (!found) {
			var id = parentPath.toLowerCase();
			if (prefix) {id = prefix + id;}
			found = {
				"pathPart" : pathPart,
				"id" : id,
				"name" : friendlyName,
				"keyword" : "Group",
				"uri" : path.join(options.features, parentPath),
				"features" : [],
				"children" : []
			};
			childStructure.push(found);
		}
		return found;
	}
	
	function normalizeFeaturePath(filePath) {	
		return path.relative(options.features, filePath);
	}

	function calculateBubbledStatus(group) {
		var groupStatus = statusManager.create();
		group.features.forEach(function(feature) {
			var featureStatus = statusManager.create();
			(feature.elements ? feature.elements : []).forEach(function(scenario) {
				var scenarioStatus = statusManager.create();
				(scenario.steps ? scenario.steps : []).forEach(function(step) {
					if (step.result) {
						scenarioStatus.update(step.result.status);
						featureStatus.update(step.result.status);
						groupStatus.update(step.result.status);
					}
				});
				if (!scenario.steps || scenario.steps.length === 0) {
					scenarioStatus.update("stepless");
					featureStatus.update("stepless");
					groupStatus.update("stepless");
				}
				scenario.result = {
					"status" : scenarioStatus.get()
				};
			});
			feature.result = {
				"status" : featureStatus.get()
			};
		});
				
		group.children.forEach(function(child) {
			calculateBubbledStatus(child);
			groupStatus.update(child.result.status);
		});		
		
		group.result = {
			"status" : groupStatus.get()
		};
	}
};
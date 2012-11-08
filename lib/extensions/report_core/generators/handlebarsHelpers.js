exports.register = function(handlebars) {
	handlebars.registerHelper("getScenarioStatus", getScenarioStatus);
	handlebars.registerHelper("length", getArrayLength);
	handlebars.registerHelper("countScenariosInGroup", countScenariosInGroup);
	handlebars.registerHelper("countStepsInFile", countStepsInFile);
	handlebars.registerHelper("hasFailed", hasFailed);
	handlebars.registerHelper("hashCode", hashCode);
};

function getArrayLength(context) {
	return context ? context.length : 0;
}

function getScenarioStatus(context) {
	var status = "success";
	if (context.isWip) { status = "wip"; }
	else if (context.isManual) { status = "manual"; }
	else if (context.success) { status = "success"; }
	else if (context.hasFailed) { status = "fail"; }
	else if (context.hasUndefined) { status = "undefined"; }	
	return status;
}

function hasFailed(status, options) {
  if(status === "failed") {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
}

function countScenariosInGroup(group) {
	var scenarioCount = 0;
	if (group.features) { 
		group.features.forEach(function(feature) {
			scenarioCount += feature.elements ? feature.elements.length : 0;
		});
	}
	if (group.children) {
		group.children.forEach(function(child) {
			scenarioCount += countScenariosInGroup(child);
		});
	}
	return scenarioCount;
}

function countStepsInFile(files) {
	var stepCount = 0;
	files.forEach(function(file) {
		stepCount += file.steps.length;
	});
	return stepCount;
}

function hashCode(str){
	var hash = 0;
	if (str.length == 0) return hash;
	for (i = 0; i < str.length; i++) {
			char = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+char;
			hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
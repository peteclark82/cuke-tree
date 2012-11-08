var path = require("path"), ce = require("cloneextend");

var pipelineManager = require("./pipelineManager.js");

var pipelines = module.exports = {
	types : {
		report : createPipelineGetter({
			name : "report",
			stages : {
				init : {},
				prepareData : {},
				loadTemplates : {},
				render : {}
			}
		})
	},
	profiles : {
		report : {
			default : createProfileRunner({
				pipeline : "report"
			}),
			basePage : createProfileRunner({
				pipeline : "report",
				runStages : ["init", "loadTemplates", "render"]
			})
		}
	}
};

/* Private Functions */
function createPipelineGetter(pipeline) {
	return function() {
		return pipelineManager.create(pipeline);
	};
}

function createProfileRunner(profile) {
	return function(options, callback) {
		var pipeline = pipelines.types[profile.pipeline];
		if (pipeline === undefined) {
			 callback({ message : "pipeline name not '"+ profile.pipeline +"' not recognised" });
		} else {
			pipeline().start(ce.cloneextend(profile, options), callback);
		}
	};
}
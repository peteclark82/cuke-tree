var ce = require("cloneextend");

var hooks = require("./hooks.js");
var extensionLoader = require("../extensions/extensionLoader.js");


exports.create = function(pipeline) {	
	return {
		start : start
	};
	
	function start(options, callback) {
		var context = {};
		var hookContext = hooks.createContext();
		var runStages = options.runStages ? options.runStages : Object.keys(pipeline.stages);
		
		var extensions = options.extensions ? options.extensions : [];
		if (pipeline.extensions) {
			extensionLoader.init(pipeline.extensions, function(err, pipelineExtensions) {
				if (err) {callback(err);} else {
					extensions = pipelineExtensions.concat(extensions);
					startRunningStages();
				}
			});
		} else {
			startRunningStages();
		}
		
		function startRunningStages() {
			var loadedExtensions = extensionLoader.load(extensions);
			context.loadedExtensions = loadedExtensions;
			loadedExtensions.attachHooks(hookContext, function(err) {
				if (err) {callback(err);} else {
					runStage(0, function(err) {
						if (err) {callback(err);} else {
							callback(null, context);
						}
					});
				}
			});	
			
			function runStage(index, callback) {
				var stageName = runStages[index];
				var stage = pipeline.stages[stageName];
				if (stage === undefined) {
					callback({ message : "Stage name '"+ stageName +"' not recognised for pipeline '"+ pipeline.name +"'" });
				} else {
					hookContext.emit(stageName, context, options, function(err) {
						if (err) { callback(err); } else {
							if ((index + 1) < runStages.length) {
								runStage(index + 1, callback);
							} else {
								callback();
							}
						}
					});
				}
			}
		}
	}	
};
var ce = require("cloneextend"), async = require("async");

var hooks = require("./hooks.js");

exports.create = function(pipeline) {	
	return {
		start : start
	};
	
	function start(options, callback) {
		var context = {};
		var hookContext = hooks.createContext();
		var runStages = options.runStages || Object.keys(pipeline.stages);
		var hookFuncs = options.hooks || [];
		
		async.forEachSeries(hookFuncs, function(hook, nextHook) {
			hook(hookContext, nextHook);	
		}, function(err) {
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
};
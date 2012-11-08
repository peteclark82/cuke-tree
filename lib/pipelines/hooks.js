var async = require("async");

module.exports = {
	createContext : createContext
};

function createContext() {
	var allListeners = {};

	return {
		on : addListener,
		emit : emitHookEvent
	};
		
	function addListener(hookName, callback) {
		if (allListeners[hookName] === undefined) {
			allListeners[hookName] = [];
		}
		allListeners[hookName].push(callback);
	}
	
	function emitHookEvent() {
		var hookName = arguments[0];
		var context = arguments.length == 4 ? arguments[1] : null;
		var options = arguments.length == 4 ? arguments[2] : arguments[1];
		var callback = arguments.length == 4 ? arguments[3] : arguments[2];
	
		var listeners = allListeners[hookName];
		if (listeners === undefined) {
			callback();
		} else {
			async.forEachSeries(listeners, function(listener, next) {
				listener.apply(context, [options, next]);
			}, function (err) {
				if (err) {callback(err);} else {
					callback();
				}
			});
		}
	}
}
var fs = require("fs"), path = require("path"),
		ce = require("cloneextend");

var internal = require("./cukeTree.internal.js");

module.exports = {
	internal : internal,
	createContext : createContext
};

function createContext(config, callback) {
	var loadedExtensions = internal.extensions.loader.load(config.extensions);
	var ctContext = ce.cloneextend(config, {
		assets : loadedExtensions.assets,
		templates : loadedExtensions.templates,
		hooks : [ loadedExtensions.hooks ],
		cliCommands : loadedExtensions.cliCommands,
		behaviours : loadedExtensions.behaviours,
		inputDir : path.extname(config.input) == "" ? config.input : path.dirname(config.input),
		outputDir : path.extname(config.output) == "" ? config.output : path.dirname(config.output)
	})
	Object.keys(ctContext.behaviours).forEach(function(extensionName) {
		if (ctContext.behaviours[extensionName] !== null) {
			ctContext.behaviours[extensionName] = ctContext.behaviours[extensionName](ctContext);
		}
	});
	callback(null, ctContext);
}
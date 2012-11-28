var ce = require("cloneextend"), async = require("async");

var templateLoader = require("../templates/templateLoader.js");

module.exports = {
	init : init,
	load : load
};

function init(extensions, callback) {
	var initialized = [];
	async.forEachSeries(extensions, function(extDesc, next) {
		var extOptions = {
			config : extDesc.options || {}
		};
		var extensionFunc = null;
		if (extDesc.module) {
			extensionFunc = extDesc.module;
		} else {
			extensionFunc = require(extDesc.path);
		}
		extensionFunc(extOptions, function(err, extension) {
			if (err) {next(err);} else {
				initialized.push(extension);
				next();
			}
		});
	}, function(err) {
		if (err) {callback(err);} else {
			callback(null, initialized);
		}
	});
}

function load(extensions) {
	var hooks = [];
	var extConfig = {
		templates : {},
		assets : {},
		hooks : attachHooks,
		cliCommands : {},
		behaviours : {},
		attachHooks : attachHooks
	};
	
	if (extensions) {
		extensions.forEach(function(extension) {
			extConfig.behaviours[extension.name] = extension.behaviours || null;
			if (extension.commands) {
				Object.keys(extension.commands).forEach(function(commandName) {
					if (extConfig.cliCommands[commandName] !== undefined) {
						throw new Error("CukeTree extension CLI command name conflict. Command already registered : "+ commandName);
					} else {
						extConfig.cliCommands[commandName] = extension.commands[commandName];
					}
				});
			}
			if (extension.hook) {
				hooks.push(extension.hook);
			}
			if (extension.templates) {
				var extensionTemplates = templateLoader.getSync(extension.templates);
				extConfig.templates = templateLoader.mergeTemplateCollections([extConfig.templates, extensionTemplates]);
			}
			if (extension.assets) {
				extConfig.assets[extension.name] = extension.assets;
			}
		});
	}
	
	return extConfig;
	
	function attachHooks(hookContext, callback)  {
		async.forEachSeries(hooks, function(hook, next) {
			hook(hookContext, function(err) {
				if (err) {callback(err);} else { next(); }
			});
		}, function(err) {
			if (err) {callback(err);} else {
				callback();
			}
		});
	}
};
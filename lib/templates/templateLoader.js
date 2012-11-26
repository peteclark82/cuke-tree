var fs = require("fs"), path = require("path"), handlebars = require("handlebars"),
		async = require("async"), ce = require("cloneextend");

module.exports = {
	get : get,
	getSync : getSync,
	compileTemplateCollection : compileTemplateCollection,
	mergeTemplateCollections : mergeTemplateCollections
};

function get(dirPath, callback) {
	var templatesManifestFilename = path.join(dirPath, "templates.js");
	var templatesManifest = {};
	fs.exists(templatesManifestFilename, function(err, exists) {
		if (err) {callback(err);} else {
			if (exists) {
				fs.readFile(templatesManifestFilename, function(err, manifestString) {
					templatesManifest = JSON.parse(manifestString);
				});
				getTemplates();
			} else {
				getTemplates();
			}
		}
	});
	
	function getTemplates() {
		fs.readdir(dirPath, function(err, files) {
			if (err) {callback(err);} else {
				var templates = {};
				files.forEach(function(filename) {
					if (path.extname(filename) === ".htm") {
						var name = path.basename(filename, ".htm");
						templates[name] = {
							manifest : templatesManifest[name] ? templatesManifest[name] : {},
							getter : createTemplateGetter(name, path.resolve(dirPath,filename))
						};
					}
				});
				callback(null, templates);
			}
		});
	}
}

function getSync(dirPath) {
	var templatesManifestFilename = path.join(dirPath, "templates.js");
	var templatesManifest = {};
	if (fs.existsSync(templatesManifestFilename)) {
		templatesManifest = JSON.parse(fs.readFileSync(templatesManifestFilename));
	}
	
	var templates = {};
	fs.readdirSync(dirPath).forEach(function(filename) {
		if (path.extname(filename) === ".htm") {
			var name = path.basename(filename, ".htm");
			templates[name] = {
				manifest : templatesManifest[name] ? templatesManifest[name] : {},
				getter : createTemplateGetter(name, path.resolve(dirPath,filename))
			};
		}
	});
	return templates;
}

function compileTemplateCollection(templates, handlebars, callback) {
	var compiledTemplates = {};
	async.forEachSeries(Object.keys(templates), function(templateName, next) {
		templates[templateName].getter(handlebars, function(err, template) {
			if (err) {next(err);} else {
				compiledTemplates[templateName] = template;
				next();
			}
		});
	}, function(err) {
		if (err) {callback(err);} else {
			callback(null, compiledTemplates);
		}
	});
}

function mergeTemplateCollections(templatesArray) {
	var mergedCollection = {};
	templatesArray.forEach(function(templates) {
		if (templates) {
			Object.keys(templates).forEach(function(templateName) {
				var templateObject = templates[templateName];
				if (mergedCollection[templateName] === undefined) {
					mergedCollection[templateName] = {
						manifest : templateObject.manifest,
						getter : templateObject.getter
					};
				} else {
					mergedCollection[templateName].manifest = ce.extend(mergedCollection[templateName].manifest, templateObject.manifest);
					if (mergedCollection[templateName].manifest.merge == true) {
						mergedCollection[templateName].getter = createChainedGetter(templateName, mergedCollection[templateName].getter, templateObject.getter);
					} else {
						mergedCollection[templateName].getter = templateObject.getter;
					}
				}
			});
		}
	});
	return mergedCollection;
}

/* Private */
function createTemplateGetter(name, filename) {
	return function() {
		var handlebarsInstance = arguments.length > 1 ? arguments[0] : null;
		var callback = arguments.length > 1 ? arguments[1] : arguments[0];
		fs.readFile(filename, function(err, content) {
			if (err) {callback(err);} else {
				var template = handlebars.compile(content.toString())
				if (handlebarsInstance) {
					handlebarsInstance.registerPartial(name, template);
				}
				callback(null, template);
			}
		});
	};
}

function createChainedGetter(name, existingTemplateGetter, newTemplateGetter) {
	return function() {
		var handlebarsInstance = arguments.length > 1 ? arguments[0] : null;
		var callback = arguments.length > 1 ? arguments[1] : arguments[0];
		
		existingTemplateGetter(handlebarsInstance, function(err, existingTemplate) {
			if (err) {callback(err);} else {		
				newTemplateGetter(handlebarsInstance, function(err, newTemplate) {
					if (err) {callback(err);} else {
						var chainedTemplate = function() {
							return existingTemplate.apply(null, arguments) + newTemplate.apply(null, arguments);
						};
						handlebarsInstance.registerPartial(name, chainedTemplate);
						callback(null, chainedTemplate);
					}
				});
			}
		});
	};
}
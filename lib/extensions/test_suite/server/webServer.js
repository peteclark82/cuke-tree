var fs = require("fs"), path = require("path"), express = require("express"),
		async = require("async"), ce = require("cloneextend"), $f = require("fluid");
		
var cukeTree = require("../../../cukeTree.js");

module.exports = function(options, callback) {
	var app = options.app;
	var config = options.config;
	var loadedExtensions = cukeTree.internal.extensions.loader.load(config.extensions);
		
	app.use(express.bodyParser());

	app.get("/", showTestSuitePage);
	app.post("/glossary", addTermToGlossary);
	
	cukeTree.internal.assets.manager.forEach({ extensions : loadedExtensions }, function(item, next) {
		if (item.asset.path instanceof Function) {
			item.asset.path(null, function(err, urlPath) {
				if (err) {next(err);} else {
					processPath(urlPath);
				}
			});
		} else {
			processPath("/" + item.asset.path);
		}
		
		function processPath(urlPath) {
			if (item.asset.src instanceof Array) {
				app.get(urlPath, handleAssetRequest(item.asset));
			} else if (item.asset.src instanceof Function) {
				app.get(urlPath, handleDynamicAssetRequest(item.asset));
			} else {
				app.use(urlPath, express.static(item.asset.src));
			}			
			next();
		}
	}, function(err) {
		var server = {};
		callback(err, server);
	});
	
	function showTestSuitePage(request, response) {
		cukeTree.internal.pipelines.profiles.report.basePage({ extensions : config.extensions }, function(err, result) {
			if (err) {callback(err);} else {
				response.end(result.rendered.page);
			}
		});
	}
	
	function addTermToGlossary(request, response) {
		fs.readFile(config.glossaryFile, function(err, content) {
			if (err) {
				response.statusCode = 500;
				response.end(JSON.stringify({message : "Error reading glossary file", error: err}, null, 3));
			} else {
				var glossary = null, error = null;
				try { glossary = JSON.parse(content); }
				catch(e) { error = e; }
				
				if (error !== null) {
					response.statusCode = 500;
					response.end(JSON.stringify({message : "Error parsing glossary file", error: error}, null, 3));
				} else {
					var newTerm = {
						type : request.body.newTermType,
						name : request.body.newTermName,
						description : request.body.newTermDescription
					};
					
					var existingTerm = null;
					for(var i=0; i<glossary.length; i++) {
						if (glossary[i].name.toLowerCase() == newTerm.name.toLowerCase()) {
							existingTerm = glossary[i];
							break;
						}
					}
					if (existingTerm !== null) {
						response.statusCode = 403;
						response.end(JSON.stringify({ message : "Term already exists : "+ existingTerm.name}, null, 3));
					} else {
						glossary.push(newTerm);
						fs.writeFile(config.glossaryFile, JSON.stringify(glossary, null, 3), function(err) {
							if (err) {
								response.statusCode = 500;
								response.end(JSON.stringify({message : "Error writing glossary file", error: err}, null, 3));
							} else {
								response.statusCode = 201;
								response.end(JSON.stringify({ message : "Term successfully added : "+ newTerm.name}, null, 3));
							}
						});
					}
				}
			}
		});
	}

	function handleAssetRequest(asset) {
		return function(request, response) {
			cukeTree.internal.assets.manager.getMergedFiles(asset, function(err, contents) {
				if (err) {
					response.statusCode = 500;
					response.end(JSON.stringify(err, null, 3));
				} else {
					response.setHeader("content-type", asset.contentType);
					response.end(contents);
				}
			});
		};
	}
	
	function handleDynamicAssetRequest(asset) {
		return function(request, response) {
			asset.src(decodeURIComponent(request.path), function(err, filename) {
				if (err) {
					response.statusCode = 500;
					response.end(JSON.stringify(err, null, 3));
				} else {
					fs.readFile(filename, function(err, contents) {
						if (err) {
							response.statusCode = 500;
							response.end(JSON.stringify(err, null, 3));
						} else {
							response.end(contents);
						}
					});
				}
			});
		};
	}
};
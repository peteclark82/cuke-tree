var fs = require("fs"), path = require("path"), express = require("express"),
		async = require("async"), ce = require("cloneextend"), $f = require("fluid");
		
var cukeTree = require("../../../cukeTree.js");

module.exports = function(options, callback) {
	var app = options.app;
	var config = options.config;
	var loadedExtensions = cukeTree.internal.extensions.loader.load(config.extensions);
		
	app.use(express.bodyParser());

	app.get("/", showTestSuitePageHandler);
	app.post("/glossary", addTermToGlossaryHandler);
	
	var ctExecutingContext = { extensions : loadedExtensions };
	
	cukeTree.internal.assets.manager.getAllAssets(ctExecutingContext, function(err, assets) {
		if (err) { callback(err); } else {
			async.forEachSeries(assets, function(assetDetail, nextAsset) {
				assetDetail.resolve(ctExecutingContext, function(err, resolvedAsset) {
					if (err) { nextAsset(err); } else {
						if (resolvedAsset.isFile()) {
							console.log("Creating file handler GET '"+ resolvedAsset.outputPattern +"'");
							app.get(resolvedAsset.outputPattern, assetFileHandler(resolvedAsset));
							nextAsset();
						} else if (resolvedAsset.isDynamicSource()) {
							console.log("Creating dynamic source handler GET '"+ resolvedAsset.outputPattern +"'");
							app.get(resolvedAsset.outputPattern, assetDynamicSourceHandler(resolvedAsset));
							nextAsset();
						} else {
							resolvedAsset.getSourceItems(function(err, items) {
								console.log("Creating folder handler GET '"+ resolvedAsset.outputPattern +"' to '"+ items[0].src +"'");
								app.use(resolvedAsset.outputPattern.toString(), express.static(items[0].src));
								nextAsset();
							});
						}
					}
				})
			}, function(err) {
				var server = {};
				callback(err, server);
			});
		}
	});
	
	function showTestSuitePageHandler(request, response) {
		cukeTree.internal.pipelines.profiles.report.basePage({ extensions : config.extensions }, function(err, result) {
			if (err) {callback(err);} else {
				response.end(result.rendered.page);
			}
		});
	}
	
	function addTermToGlossaryHandler(request, response) {
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

	function assetFileHandler(resolvedAsset) {
		return function(request, response) {
			resolvedAsset.getContents(function(err, contents) {
				if (err) {
					response.statusCode = 500;
					response.end(JSON.stringify(err, null, 3));
				} else {
					response.setHeader("content-type", resolvedAsset.rawAsset.contentType);
					response.end(contents);
				}
			})
		};
	}
		
	function assetDynamicSourceHandler(resolvedAsset) {
		return function(request, response) {
			resolvedAsset.getSourceItem(decodeURIComponent(request.path), function(err, item) {
				fs.readFile(item.src, function(err, contents) {
					if (err) {
						response.statusCode = 500;
						response.end(JSON.stringify(err, null, 3));
					} else {
						response.end(contents);
					}
				});				
			});
		};
	}
};
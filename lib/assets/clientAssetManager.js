var fs = require("fs"), path = require("path"), ce = require("cloneextend"),
		async = require("async"), ncp = require("ncp").ncp, $f = require("fluid"),
		mkdirp = require("mkdirp");

module.exports = {
	buildDirectory : buildDirectory,
	forEach : forEach,
	getMergedFiles : getMergedFiles
};

function buildDirectory(options, callback) {
	var assets = options.extensions.assets;
	forEachAsset(assets, function(item, next) {
		if (item.asset.path instanceof Function) {
			item.asset.path(options, function(err, outputPath) {
				if (err) { next(err); } else {
					processOutput(outputPath);
				}
			});
		} else {
			processOutput(path.join(options.output, item.asset.path));
		}
		
		function processOutput(outputPath) {
			mkdirp(path.dirname(outputPath), function(err) {
				if (err) { callback(err); } else {
					if (item.asset.src instanceof Function) {
						item.asset.src(options, function(err, src) {
							if (err) {callback(err);} else {
								processSource(src);
							}
						});
					} else {
						processSource(item.asset.src);
					}
					
					function processSource(src) {
						if (src instanceof Array) {
							getMergedFiles(item.asset, function(err, contents) {
								if (err) {next(err);} else {
									fs.writeFile(outputPath, contents, next);
								}
							});
						} else {
							ncp(src, outputPath, {}, next);
						}
					}
				}
			});
		}
	}, function(err) {
		callback(err);
	});
}

function forEach(options, callback, finishedCallback) {
	var assets = options.extensions.assets;
	forEachAsset(assets, function(item, next) {
		callback(item, next);
	}, function(err) {
		finishedCallback(err);
	});
}

/* Private Methods */
function forEachAsset(assets, callback, finishedCallback) {
	async.forEachSeries(Object.keys(assets), function(groupName, nextGroup) {
		var group = assets[groupName];
		async.forEachSeries(Object.keys(group), function(assetTypeName, nextAssetType) {
			var assetTypeGroup = group[assetTypeName];
			async.forEachSeries(assetTypeGroup, function(asset, nextAsset) {
				callback({
					group : group,
					groupName : groupName,
					assetTypeGroup : assetTypeGroup,
					assetTypeName : assetTypeName,
					asset : asset
				}, nextAsset);
			}, function(err) { nextAssetType(err); });
		}, function(err) { nextGroup(err); });
	}, function(err) { finishedCallback(err); });
}

function getMergedFiles(asset, callback) {
	var output = "";
	async.forEachSeries(asset.src, function(file, next) {
		fs.lstat(file, function(err, stat) {
			if (err) {
				next({message : "Error reading stats for file: "+ file, error: err});
			} else {
				fs.readFile(file, function(err, contents) {
					if (err) { 
						next({message : "Error reading file: "+ file, error: err});
					} else {
						output += contents.toString() +"\n";
						next();
					}
				});
			}
		});
	}, function(err) {
		if (err) {callback(err);} else {
			callback(null, output);
		}
	});
}
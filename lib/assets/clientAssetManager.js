var fs = require("fs"), path = require("path"), ce = require("cloneextend"),
		async = require("async"), ncp = require("ncp").ncp, $f = require("fluid"),
		mkdirp = require("mkdirp");

module.exports = {
	getAllAssets : getAllAssets
};

function getAllAssets(cukeTreeContext, callback) {
	var rawAssets = cukeTreeContext.extensions.assets;
	var assets = [];
	forEachAsset(rawAssets, function(assetDetail, nextAsset) {
		assetDetail.resolve = resolveAsset(assetDetail);
		assets.push(assetDetail);
		nextAsset();
	}, function(err) {
		if (err) { callback(err); } else {
			callback(null, assets);
		}
	});
}

function resolveAsset(assetDetail) {
	var asset = assetDetail.asset;
	return function(ctContext, finalCallback) {
		var resolvedAsset = { rawAsset : asset };
		$f({})
			({ name : "outputPath" }).custom(getOutputPath)
		.go(function(err, results) {
			if (err) { finalCallback({ message : "Error resolving asset '"+ assetDetail.extensionName +"."+ assetDetail.groupName +"."+ asset.name +"'", error : err }); } else {
				if (typeof(results.outputPath[0]) == "string") {
					resolvedAsset.outputPattern = new RegExp(results.outputPath[0]);
					resolvedAsset.outputPath = results.outputPath[0];
				} else {
					resolvedAsset.outputPattern = results.outputPath[0].pattern;
					resolvedAsset.outputPath = results.outputPath[0].value;
				}
				resolvedAsset.outputPath = path.join(ctContext.output, resolvedAsset.outputPath);
				resolvedAsset.isFile = isFile;
				resolvedAsset.isDynamicSource = isDynamicSource;
				resolvedAsset.getContents = getContents;
				resolvedAsset.getSourceItem = getSourceItem;
				resolvedAsset.getSourceItems = getSourceItems;
				finalCallback(null, resolvedAsset);
			}
		});
		
		function getOutputPath(callback) {
			if (asset.path instanceof Function) {
				asset.path({ ctContext : ctContext }, function(err, outputPath) {
					if (err) { callback({ message : "Error resolving dynamic asset path", error : err }); } else {
						callback(null, outputPath);
					}
				});
			} else { callback(null, asset.path); }
		}
		function isFile() {				
			return path.extname(resolvedAsset.outputPath) != "";
		}
		function isDynamicSource() {
			return (asset.src instanceof Function);
		}
		function getContents(callback) {
			var isArray = asset.src instanceof Array;
			if (resolvedAsset.isFile()) {
				$f(resolvedAsset)
					({name:"items"}).getSourceItems()
					({name:"contents"}).custom(function(callback) {
						var output = "";
						async.forEachSeries(this.items[0], function(file, next) {
							fs.readFile(file.src, function(err, contents) {
								if (err) { next({ message : "Error reading file: "+ file.src, error: err }); } else {
									output += contents.toString() +"\n"; next();
								}
							});
						}, function(err) { callback(err, output); });
					})
				.go(function(err, result) {
					if (err) { callback(err); } else { callback(null, result.contents[0]); }
				});
			} else {
				callback({ message : "Cannot get contents of folder asset '"+ resolvedAsset.outputPath +"'" });
			}
		}
		function getSourceItem(filename, callback) {
			if (resolvedAsset.isDynamicSource()) {
				asset.src({ ctContext : ctContext, filename : filename }, function(err, src) {
					if (err) { callback({ message : "Error resolving dynamic asset source for file '"+ filename +"'", error : err }); } else {
						callback(null, { src : src });
					}
				});
			} else if (array.src instanceof Array) {
				callback({ message : "Getting individual files is only supported with dynamic handlers" });
			} else {
				callback(null, { src : asset.src }); 
			}
		}
		function getSourceItems(callback) {
			if (resolvedAsset.isDynamicSource()) {
				asset.src({ ctContext : ctContext }, function(err, src) {
					if (err) { callback({ message : "Error resolving dynamic asset source", error : err }); } else {
						callback(null, src);
					}
				});
			} else if (asset.src instanceof Array) {
				var src = [];
				asset.src.forEach(function(item) { src.push({ src : item }); });
				callback(null, src);
			} else {
				callback(null, [{ src : asset.src }]); 
			}
		}
	};
}

/* Private Methods */
function forEachAsset(assets, callback, finishedCallback) {
	async.forEachSeries(Object.keys(assets), function(extensionName, nextGroup) {
		var extensionAssets = assets[extensionName];
		async.forEachSeries(Object.keys(extensionAssets), function(groupName, nextAssetType) {
			var group = extensionAssets[groupName];
			async.forEachSeries(group, function(asset, nextAsset) {
				callback({
					extensionAssets : extensionAssets,
					extensionName : extensionName,
					group : group,
					groupName : groupName,
					asset : asset
				}, nextAsset);
			}, function(err) { nextAssetType(err); });
		}, function(err) { nextGroup(err); });
	}, function(err) { finishedCallback(err); });
}
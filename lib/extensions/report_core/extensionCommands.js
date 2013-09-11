var sys = require("sys"), fs=require("fs"), path = require("path"), childProcess = require("child_process"), 
	color = require("ansi-color").set, async = require("async"), ncp = require("ncp").ncp, mkdirp = require("mkdirp"),
	ce = require("cloneextend");

var cukeTree = require("../../cukeTree.js");

module.exports = function(extOptions) {
	return {
		run : function(config) {
			generateReport(config, function(err) {
				if (err) {
					console.error(color(sys.inspect(err), "red+bold"));
					safeExit(1);
				} else {
					if (config.launch) {
						var execCommand = "start "+ path.join(config.output, "report.htm");
						childProcess.exec(execCommand);
					}
				}
			});
		}
	};
};

function generateReport(config, callback) {	
	cukeTree.createContext(config, function(err, ctContext) {
		if (ctContext.run) {
			console.log("Running cucumber process...");
			ctContext.behaviours.report_core.runTests(ce.cloneextend(ctContext, {
				output : config.input, //cukeTree input (report.json)
				run : ctContext.run
			}), function(code) {
				if (code > 1) { 
					callback("Cucumber Process Exited Unexpectedly with code : "+ code);
				} else {
					fs.exists(config.input, function(exists) {
						if (exists) {
							console.log("Building CukeTree report...");
							buildReport(code);
						} else {
							callback("Cucumber report not found : "+ config.input +"\nProcess Exit Code : "+ code);
						}
					});
				}				
			});
		} else {
			buildReport(0);
		}
		
		function buildReport(code) {
			cukeTree.internal.pipelines.profiles.report.default(ctContext, function(err, result) {
				if (err) {callback(err);} else {
					console.log("Saving CukeTree report...");
					saveReport(result.data.page, result.glossaryJson, result.renderData.structure, function(err) {
						if (err) {callback(err);} else {
							console.log("CukeTree report successfully built and saved :-");
							console.log(config.output);
							if (code == 0) {
								callback();
							} else {
								callback("One or more cucumber tests failed : "+ code);
							}
						}
					});
				}
			});
		}
		
		function saveReport(report, glossaryJson, structureJson, callback) {
			console.log("Building CukeTree report structure...");
				
			cukeTree.internal.assets.manager.getAllAssets(ctContext, function(err, assets) {
				if (err) { callback(err); } else {
					async.forEachSeries(assets, function(assetDetail, nextAsset) {
						assetDetail.resolve(ctContext, function(err, resolvedAsset) {
							if (err) { nextAsset(err); } else {
								var outputDir = path.dirname(resolvedAsset.outputPath);
								mkdirp(outputDir, function(err) {
									if (err) { nextAsset({ message : "Error creating directory path '"+ outputDir +"'", error : err }); } else {
										if (resolvedAsset.isFile()) {
											resolvedAsset.getContents(function(err, contents) {
												if (err) {nextAsset("Error getting merged files : " + err.toString());} else {
													console.log("Writing file to '"+ resolvedAsset.outputPath +"'");
													fs.writeFile(resolvedAsset.outputPath, contents, nextAsset);
												}
											});
										} else {
											resolvedAsset.getSourceItems(function(err, items) {
												if (err) { nextAsset(err); } else {
													async.forEachSeries(items, function(item, nextSourceItem) {
														fs.exists(item.src, function(exists) {
															if (exists) {
																console.log("Copying file/folder from '"+ item.src +"' to '"+ resolvedAsset.outputPath +"'");
																ncp(item.src, resolvedAsset.outputPath, {}, function(err) {
																	if (err) { nextSourceItem("Error copying files from '"+ item.src +"' to '"+ resolvedAsset.outputPath +"'"); } else { 
																		nextSourceItem();
																	}
																});
															} else {
																console.log("Skipping file/folder because it doesn't exists '"+ item.src +"'");
																nextSourceItem();
															}
														});													
													}, nextAsset);
												}
											});
										}
									}
								});
								
							}
						});
					}, function(err) {
						if (err) {callback(err);} else { console.log("Writing report HTML...");
							var outputFile = path.join(ctContext.output, "report.htm");
							fs.writeFile(outputFile, report, "ascii", function(err) {
								if (err) {callback(err);} else { console.log("Writing report glossary...");
									var glossaryDefinitionScript = "var glossaryDef = "+ JSON.stringify(glossaryJson, null, 3) + ";";
									var structureScript = "var structureJson = "+ JSON.stringify(structureJson) + ";";
									fs.writeFile(path.join(ctContext.output, "glossary_definitions.js"), glossaryDefinitionScript, function(err) {
										if (err) {callback(err);} else {
											fs.writeFile(path.join(ctContext.output, "structure.js"), structureScript, function(err) {
												if (err) {callback(err);} else {
												
													callback();
												}
											});											
											callback();
										}
									});											
								}
							});
						}
					});
				}
			});
		}
	});	
}

function safeExit(code) {
  process.on('exit', function() {
    process.exit(code);
  });
}
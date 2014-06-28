var path = require("path"), fs = require("fs"), async = require("async"),
		ce = require("cloneextend");
		
var extensionLoader = require("../extensions/extensionLoader.js");
		
var defaultConfigFile = "default";
module.exports = {
	getCli : getCli,
	getConfiguration : getConfiguration
};

function getCli() {
	var usage = "\nGenerates a CukeTree report.\n\nUsage: $0 <command> -i <filename> -o <directory> -f <directory>\n";

	return require("optimist")
		.usage(usage)
		.alias("h", "help").describe("h", "Optional. Shows usage information")
		.alias("c", "config").describe("c", "Optional. Name of the configuration profile for running cuketree")
		.alias("i", "input").describe("i", "Name of cucumber test data (as JSON) used to generate report")
		.alias("o", "output").describe("o", "Output directory to generate report")
		.alias("f", "features").describe("f", "Features directory the report was generated from")
		.alias("l", "launch").describe("l", "Optional. Launch/open the report/ide with the default handler")
		.alias("b", "bin").describe("b", "Optional. Bin location of cucumber-js")
		.alias("r", "run").describe("r", "Optional. Location of test directory to execute")
		.alias("e", "ext").describe("e", "Optional. Comma seperated list of locations of CukeTree extensions");
}

function getConfiguration(cmdArgs, callback) {	
	var configFile = cmdArgs.config;
	if (!configFile) { configFile = defaultConfigFile; }
	configFile = path.resolve(process.cwd(), configFile);
	if (path.extname(configFile) === "") { configFile += ".cukeTree.js"; }
	if (!fs.existsSync(configFile)) { callback("CukeTree config file does not exist: "+ configFile); }
	
	var config = resolveConfig(cmdArgs, configFile);
	extensionLoader.init(config.ext ? config.ext : [], function(err, extensions) {
		if (err) {callback(err);} else {
			config.extensions = extensions;
			callback(null, config);
		}
	});	
}

/* Private Methods */
function resolveConfig(cmdArgs, configFile) {
	var config = {};
	if (configFile) {
		var configPath = path.dirname(configFile);
		config = require(configFile);
		Object.keys(config).forEach(function(key) {
			if (["input", "output", "features", "run"].indexOf(key) > -1) {
				config[key] = path.resolve(configPath, config[key]);
			}
		});
	}
	
	var finalConfig = {
		command : cmdArgs._[0] ? cmdArgs._[0].toLowerCase() : config.command,
		input : cmdArgs.input ? path.resolve(process.cwd(), cmdArgs.input) : config.input,
		output : cmdArgs.output ? path.resolve(process.cwd(), cmdArgs.output) : config.output,
		features : cmdArgs.features ? path.resolve(process.cwd(), cmdArgs.features) : config.features,
		variant : cmdArgs.variant ? cmdArgs.variant : config.variant,
		bin : cmdArgs.bin ? cmdArgs.bin : config.bin,
		launch : cmdArgs.launch ? cmdArgs.launch : config.launch,
		run : cmdArgs.run !== undefined 
			? cmdArgs.run != true ? cmdArgs.run : null
			: config.run,
		ext : [
			{ module : require("../extensions/report_core/extension.js") }
		]
	};
	
	if (cmdArgs.ext) {
		cmdArgs.ext.split(",").forEach(function(ext) {
			var extPath = ext;
			if (extPath.replace("\\","/").indexOf("/") > -1) { extPath = path.resolve(process.cwd(), ext); }
			finalConfig.ext.push({
				path : extPath
			});
		});
	} else if (config.ext) {
		config.ext.forEach(function(ext) {
			if (typeof(ext) == "string") {
				var extPath = ext;
				if (extPath.slice(0,1) == ".") { extPath = path.resolve(configPath, extPath); }
				finalConfig.ext.push({
					path : extPath
				});
			} else if (ext instanceof Function) {
				finalConfig.ext.push({
					module : ext
				});
			} else {
				var extPath = ext.path;
				if (extPath && extPath.slice(0,1) == ".") { extPath = path.resolve(configPath, extPath); }
				finalConfig.ext.push({
					options : ext.options,
					path : extPath ? extPath : null,
					module : ext.module ? ext.module : null
				});
			}
		});
	}
	
	return finalConfig;
}
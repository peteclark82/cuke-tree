module.exports = {
	cli : {
		arguments : require("./cli/cliArguments.js")
	},
	extensions : {
		loader : require("./extensions/extensionLoader.js")
	},
	templates : {
		loader : require("./templates/templateLoader.js")
	},
	assets : {
		manager : require("./assets/clientAssetManager.js")
	},
	pipelines : require("./pipelines/pipelines.js")
};
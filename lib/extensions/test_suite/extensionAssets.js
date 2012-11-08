var path = require("path");

var ideAssetsPath = path.resolve(__dirname, "assets");

module.exports = {
	js : [
		{
			name : "ide", path : "js/ide.js", contentType : "text/javascript",
			src : [
				path.join(ideAssetsPath, "js/glossary.js"),
				path.join(ideAssetsPath, "js/testHistory.js"),
				path.join(ideAssetsPath, "js/ide.js")
			]
		}
	],
	css : [
		{
			name : "main", path : "css/ide.css", contentType : "text/css",
			src : [
				path.join(ideAssetsPath, "css/test-history.css")
			]
		}
	]
};
		
var path = require("path");

var reportAssetsPath = path.resolve(__dirname, "assets");

module.exports = {
	js : [
		{
			name : "lib", path : "js/lib.js", contentType : "text/javascript",
			src : [
				path.join(reportAssetsPath, "js/lib/jquery-1.7.2.min.js"),
				path.join(reportAssetsPath, "js/lib/jquery-ui-1.8.22.custom.min.js"),
				path.join(reportAssetsPath, "js/lib/jquery.cookie.js"),
				path.join(reportAssetsPath, "js/lib/jquery.ba-hashchange.min.js"),
				path.join(reportAssetsPath, "js/lib/jquery.ba-bbq.min.js"),
				path.join(reportAssetsPath, "js/stateManager.js"),
				path.join(reportAssetsPath, "js/cukeTree.js"),
				path.join(reportAssetsPath, "js/report.js"),
				path.join(reportAssetsPath, "js/details.js"),
				path.join(reportAssetsPath, "js/stepDefinitions.js"),
				path.join(reportAssetsPath, "js/glossary.js"),
				path.join(reportAssetsPath, "js/main.js")
			]
		},
		{
			name : "jstree", path : "js/jstree/jquery.jstree.js", contentType : "text/javascript",
			src : [
				path.join(reportAssetsPath, "js/lib/jstree/jquery.jstree.js")
			]
		},
		{
			name : "control", path : "js/staticControl.js", contentType : "text/javascript",
			src : [
				path.join(reportAssetsPath, "js/control.js")
			]
		}
	],
	css : [
		{
			name : "main", path : "css/style.css", contentType : "text/css",
			src : [
				path.join(reportAssetsPath, "css/style.css"),
				path.join(reportAssetsPath, "css/glossary.css"),
				path.join(reportAssetsPath, "css/detail.css"),
				path.join(reportAssetsPath, "css/summary.css"),
				path.join(reportAssetsPath, "css/report.css"),
				path.join(reportAssetsPath, "css/steps.css")
			]
		},
		{
			name : "jqueryui", path : "css/jqueryui/style.css", contentType : "text/css",
			src : [
				path.join(reportAssetsPath, "css/theme/jquery-ui-1.8.22.custom.css")
			]
		}
	],
	misc : [
		{
			name : "images", path : "images",
			src : path.join(reportAssetsPath, "images")
		},
		{
			name : "jstree", path : "js/jstree",
			src : path.join(reportAssetsPath, "js/lib/jstree")
		},
		{
			name : "jqueryui", path : "css/jqueryui/images",
			src : path.join(reportAssetsPath, "css/theme/images")
		}
	]
};
		
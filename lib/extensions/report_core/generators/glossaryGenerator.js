var fs = require("fs"), path = require("path"), handlebars = require("handlebars"), 
	ce = require("cloneextend"), $f = require("fluid");

var internal = require("../../../cukeTree.internal.js");
var	templates = internal.templates.loader.getSync(path.resolve(__dirname, "../templates"));
var handlebarsHelpers = require("./handlebarsHelpers.js");

exports.generate = function(options, callback) {		
	$f(ce.cloneextend(templates, options.templates).glossary)
		({name:"glossary"}).getter()
	.with(fs)
		({name: "glossaryJson"}).readFile(path.join(options.features, "glossary.js"))
	.go(function(err, res) {
		if (err) { callback(err); } else {
			handlebarsHelpers.register(handlebars);

			var glossaryJson = JSON.parse(res.glossaryJson[0].toString());

			callback(null, {
				glossaryJson : glossaryJson,
				glossary : res.glossary[0]({ glossary : glossaryJson})
			});
		}
	});
};
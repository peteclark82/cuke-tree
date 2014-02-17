var fs = require("fs"), $f = require("fluid"),
	handlebars = require("handlebars"), ce = require("cloneextend");

var internal = require("../../cukeTree.internal.js");
var handlebarsHelpers = require("./generators/handlebarsHelpers.js");


module.exports = function(extOptions) {
	return function(context, callback) {		
		context.on("init", function(options, callback) {
			this.renderData = this.renderData ? this.renderData : {};				
			callback();
		});
		
		context.on("prepareData", function(options, callback) {
			var self = this;
			fs.readFile(options.input, function(err, reportStream) {
				if (err) {
					callback({ message : "Error reading JSON report file : "+ options.input, error : err });
				} else {
					var report = null;
					try {
						report = JSON.parse(reportStream.toString());
					} catch (e) {
						report = null;
						callback({ message : "Error parsing JSON report file : "+ options.input, error : e.toString() });
					}
					if (report !== null) {
            options.report = report;
              
						$f(require("./generators/structureGenerator.js"))({name : "structureJson"}).generate(options)
						.with(require("./generators/summaryGenerator.js"))({name : "summaryJson"}).generate(options)
						.with(require("./generators/glossaryGenerator.js"))({name : "glossaryReport"}).generate(options)
						.with(require("./generators/stepsGenerator.js"))({name : "stepsReport"}).generate(options)
						.go(function(err, res) {
							if (err) {callback(err);} else {
								self.renderData = {
									structure : res.structureJson[0],
									summary : res.summaryJson[0],
									glossary : res.glossaryReport[0].glossaryJson,
									stepFiles : res.stepsReport[0]
								}
								callback();
							}
						});
					}
				}
			});
		});
		
		context.on("loadTemplates", function(options, callback) {
			var self = this;
			this.templates = options.templates;
			internal.templates.loader.compileTemplateCollection(options.templates, handlebars, function(err, compiledTemplates) {
				if (err) {callback(err);} else {
					self.compiledTemplates = compiledTemplates;
					callback();
				}
			});
		});
		
		context.on("render", function(options, callback) {
			var self = this;
			handlebarsHelpers.register(handlebars);
			self.rendered = {
				page : self.compiledTemplates.page(self.renderData),
				report : self.renderData.structure ? self.compiledTemplates.report(self.renderData.structure) : null,
				summary : self.renderData.structure ? self.compiledTemplates.summary(self.renderData) : null,
				steps : self.renderData.structure ? self.compiledTemplates.steps(self.renderData) : null
			};
			self.data = self.rendered; //needs refactoring so reads from rendered
			self.glossaryJson = self.renderData.glossary; //needs refactoring so reads from rendered
			callback();
		});
		
		callback();
	};
};
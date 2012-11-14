$(function () {
	$.fn.cukeTree = function() {
		$this = this; 
		
		var cukeTree = {
			init : wrap(function() {
				cukeTree.events.initialising();
			}),
			start : wrap(function() {
				cukeTree.events.starting();
			}),
			updateReport : wrap(function($report) {
				cukeTree.events.reportUpdating($report);
			}),
			updateGlossary : wrap(function(glossaryJson) {
				cukeTree.events.glossaryUpdated(glossaryJson);
			}),
			events : {
				initialising : wrap(function() { this.trigger("cukeTree.initialising"); }),
				starting : wrap(function() { this.trigger("cukeTree.starting"); }),
				reportUpdating : wrap(function($report) { this.trigger("cukeTree.reportUpdating", $report); }),
				reportRendered : wrap(function($report) { this.trigger("cukeTree.reportRendered", $report); }),
				reportNodeSelected : wrap(function(options) { this.trigger("cukeTree.report.nodeSelected", options); }),
				glossaryUpdated : wrap(function(glossaryJson) { this.trigger("cukeTree.glossaryUpdated", { json : glossaryJson }); }),
			}
		};
		
		return cukeTree;
		
		function wrap(func) { return function() { func.apply($this, arguments);}; }
	};	
});
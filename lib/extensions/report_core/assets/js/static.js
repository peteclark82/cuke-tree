$(function() {
	$(".report-tree")
		.trigger("report.display")
		.on("report.loaded", function() {
			$(this).glossary().highlightTerms(glossaryDef);
		});
		
	$("#steps").trigger("stepDefinitions.update");
	$("#domain").trigger("testDomain.update");
	$(window).hashchange();
});
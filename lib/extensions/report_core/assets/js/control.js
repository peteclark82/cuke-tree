$(function() {		
	var $cukeTree = $(window);

	$cukeTree.on("cukeTree.initialising", function() {
		$cukeTree.cukeTree().start(); 
	}).on("cukeTree.starting", function() {
		$(".report-tree").each(function() { $cukeTree.cukeTree().updateReport($(this)); });		
		$cukeTree.cukeTree().updateGlossary(glossaryDef);	
		$("#steps").trigger("stepDefinitions.update");
		$("#domain").trigger("testDomain.update");
	});
	
	$cukeTree.cukeTree().init();
});
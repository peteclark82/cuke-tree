$(function() {
	var $cukeTree = $(window.document);

	$cukeTree.on("cukeTree.initialising", function() {
		$cukeTree.cukeTreeIde().init();
	});
	
	$cukeTree.cukeTree().init();
});
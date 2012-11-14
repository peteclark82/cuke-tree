$(function() {
	var $cukeTree = $(window);

	$cukeTree.on("cukeTree.initialising", function() {
		$(window).cukeTreeIde().init();
	});
	
	$cukeTree.cukeTree().init();
});
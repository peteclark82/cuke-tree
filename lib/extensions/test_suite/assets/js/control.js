$(function() {
	var $cukeTree = $(window);

	$cukeTree.on("cukeTree.initialising", function() {
		$(window).cukeTreeIde().init();
	});
	
	var lastState = null;
	$(window).hashchange(function() {
		var newState = $.bbq.getState();
		if (newState.filename && (!lastState || newState.filename !== lastState.filename)) {
			$cukeTree.cukeTreeIde().showReport(newState.filename);
		}
		lastState = newState;
	});
});
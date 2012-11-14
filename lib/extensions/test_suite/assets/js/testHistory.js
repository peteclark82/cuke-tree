$(function () {	
	var $cukeTree = $(window);

	$.fn.testHistory = function() {
		$(this).each(function() {
			var $history = $(this);
			$history.on("testHistory.display", function(e, options) {
				displayHistory(options);
			});
						
			/* Private Methods */	
			function displayHistory(options) {
				$history.html("<ol></ol>");
				for(var i=0; i<options.data.length; i++) {
					var $item = $("<li data-filename='"+ options.data[i] +"'><a href='javascript:void(0)'>"+ options.data[i] +"</a></li>");
					$history.find("ol").append($item);
					$item.click(function() {
						var filename = $(this).data("filename");
						$cukeTree.stateManager().set("filename", filename);
					});
				}
			}
		});
		
		return $(this);
	};
});
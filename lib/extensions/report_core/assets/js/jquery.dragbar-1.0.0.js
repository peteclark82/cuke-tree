(function($) {
	$.fn.dragbar = function(options) {		
		var $this = this;
		
		$this.on("mousedown", function(e) {
			e.preventDefault();

			var $ghost = $this.clone();
			var pos = $this.offset();
			$ghost.css("position", "absolute");
			$ghost.offset(pos);
			$ghost.width($this.width());
			$ghost.height($this.height());
			if (options && options.ghostCreated) {
				options.ghostCreated($ghost);
			}
			$("body").append($ghost);
									
			window.addEventListener("mousemove", captureMouseMove, true);
			window.addEventListener("mouseup", captureMouseUp, true);
			
			function captureMouseMove(e) {
				$ghost.offset({ top : pos.top, left : e.pageX });
			}
			function captureMouseUp(e) {
				window.removeEventListener("mousemove", captureMouseMove, true);
				window.removeEventListener("mouseup", captureMouseUp, true);
				var delta = $ghost.offset().left - pos.left;
				if (options && options.moved) {
					options.moved(delta);
				}
				$ghost.remove();
			}
		});
		
		return $this;
	};
})(jQuery);
$(function() {
	jQuery.fn.elementManager = function() {		
		var $this = this;
		var elementManager = $this.data("elementManager");
		if (!elementManager) {
			elementManager = ElementManager($this);
			$this.data("elementManager", elementManager);
		}

		return elementManager;
	};
	jQuery.elementManager = $(window).elementManager();
	
	function ElementManager($this) {
		var instance = {
		
		};
				
		return instance;
		
	}
});
(function ($) {
	var cukeTreeMethods = {};

	$.fn.cukeTree = function() {
		$this = this; 
		
		var cukeTree = {};
		for (var methodName in cukeTreeMethods) {
			cukeTree[methodName] = wrap(cukeTreeMethods[methodName](cukeTree));
		}
		
		return cukeTree;
		
		function wrap(func) { return function() { func.apply($this, arguments);}; }
	};	
	
	$.cukeTree = {
		attachMethod : function(name, method) {
			if (cukeTreeMethods[name] !== undefined) {
				throw new Error("CukeTree method already registered : "+ name);
			} else {
				cukeTreeMethods[name] = method;
			}
			return $.cukeTree;
		}
	};
	
	$.cukeTree
		.attachMethod("init", function(cukeTree) {
			return function() {
				this.trigger("cukeTree.initialising");
			};
		})
		.attachMethod("start", function(cukeTree) {
			return function() {
				this.trigger("cukeTree.starting");
			};
		})
		.attachMethod("updateGlossary", function(cukeTree) {
			return function(glossaryJson) {
				this.trigger("cukeTree.glossaryUpdated", { json : glossaryJson });
			};
		});
})(jQuery);
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
	jQuery.elementManager = $(window.document).elementManager(); //changed from window, might break things?!?!
	
	function ElementManager($this) {
		var members = {};
		
		var instance = function() {
			var $members = $();
			for(var name in members) {
				var $member = members[name]();
				$members = $members == null ? $member : $members.add($member);
			}
			return $members;
		};
		$.extend(instance, {
			add : add,
			addGroup : addGroup,
			get : get
		});
				
		return instance;
		
		function add(element) {
			if (members[element.name]) {
				throw new Error("Member already registered '"+ element.name + "'");
			} else {
				members[element.name] = function() {
					return $this.find(element.selector);
				};
				members[element.name].name = element.name;
				members[element.name].selector = element.selector
				return instance;
			}
		}
		
		function addGroup(group) {
			if (members[group.name]) {
				throw new Error("Member already registered '"+ group.name + "'");
			} else {
				members[group.name] = ElementManager($this);
				return members[group.name];
			}
		}
		
		function get() {
			return members;
		}
	}
});
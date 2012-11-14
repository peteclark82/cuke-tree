$(function() {
	jQuery.fn.stateManager = function() {		
		var $this = this;
		var stateManager = $this.data("stateManager");
		if (!stateManager) {
			stateManager = StateManager($this);
			$this.data("stateManager", stateManager);
		}

		return stateManager;
	};
	
	function StateManager($this) {
		var members = {};
		
		var events = {
			stateUpdated : function(member, oldValue, newValue) {
				$this.trigger("stateManager.stateUpdated."+ member.name, { oldValue : oldValue, newValue : newValue });
			}
		};
		
		var stateTypes = {
			page : PageState($this, events),
			localStorage : LocalStorageState($this, events)
		};
		
		var instance = {
			init : init,
			add : add,
			get : get,
			set : set
		};
				
		return instance;
		
		function init() {
			for(var stateTypeName in stateTypes) {
				var stateType = stateTypes[stateTypeName];
				var stateTypeMembers = {};
				for (var name in members) {
					var member = members[name];
					if (member.type == stateTypeName) {
						stateTypeMembers[name] = member;
					}
				}
				stateType.init(stateTypeMembers);
			}						
			return instance;
		}
		
		function add(member) {
			members[member.name] = member;
			return instance;
		}
		
		function get(name) {
			var member = members[name];
			if (!member) {
				throw new Error("Error getting state. Member not registered : " + name);
			} else {
				var stateType = stateTypes[member.type];
				if (stateType) {
					return stateType.get(member);
				} else {
					throw new Error("Error setting state. Type '"+ member.type +"' not recognised for member : " + name);
				}
			}
		}
		
		function set(name, value) {
			var member = members[name];
			if (!member) {
				throw new Error("Error setting state. Member not registered : " + name);
			} else {
				var stateType = stateTypes[member.type];
				if (stateType) {
					stateType.set(member, value);
				} else {
					throw new Error("Error setting state. Type '"+ member.type +"' not recognised for member : " + name);
				}
			}
			return instance;
		}
	}
	
	/* State Types */
	function PageState($this, events) {
		var oldState = null;
		
		return {
			init : init,
			get : get,
			set : set
		}
		
		function init(members) {
			$(window).hashchange(function() {
				for(var name in members) {
					var member = members[name];
					var oldValue = oldState == null ? null : oldState[name];
					var newValue = get(member);
					if (newValue !== oldValue) {
						events.stateUpdated(member, oldValue, newValue);
					}
				}
				oldState = $.bbq.getState();
			});
			$(window).hashchange();
		}
		
		function get(member) {
			var value = $.bbq.getState()[member.name];
			value = value === undefined && member.defaultValue ? member.defaultValue : value;
			return value;
		}
		
		function set(member, value) {
			var newState = {};
			newState[member.name] = value;
			$.bbq.pushState(newState);
		}
	}
	
	function LocalStorageState($this, events) {
		return {
			init : init,
			get : get,
			set : set
		}
		
		function init(members) {
			for(var name in members) {
				var member = members[name];
				events.stateUpdated(member, null, get(member));
			}
		}
		
		function get(member) {
			var value = localStorage.getItem(member.name);
			value = value === undefined && member.defaultValue ? member.defaultValue : value;
			return value;
		}
		
		function set(member, value) {
			var oldValue = get(member);
			if (value !== oldValue) {
				localStorage.setItem(member.name, value);
				events.stateUpdated(member, oldValue, value);
			}
		}
	}
});
(function($) {
	$.fn.stateManager = function(isDebug) {		
		var $this = this;
		var stateManager = $this.data("stateManager");
		if (!stateManager) {
			stateManager = StateManager($this);
			$this.data("stateManager", stateManager);
		}
		if (isDebug !== undefined) {
			stateManager.setDebug(isDebug);
		}
		
		return stateManager;
	};
	$.stateManager = $(window.document).stateManager();
	
	function StateManager($this) {
		var isDebug = false;		
		var members = {};
		
		var events = {
			stateUpdated : function(newState) {
				debugInfo("StateUpdated: " + newState.member.name +" = "+ newState.oldValue +" -> "+ newState.newValue);
				$this.trigger("stateManager.stateUpdated."+ newState.member.name, {
					oldValue : newState.oldValue, 
					newValue : newState.newValue
				});
			}
		};
		
		var stateTypes = {
			"page.client" : PageClientState($this, events),
			"page.server" : PageServerState($this, events),
			"localStorage" : LocalStorageState($this, events),
			"cookie" : CookieState($this, events)
		};
		
		var instance = {
			init : init,
			add : add,
			get : get,
			set : set,
			setDebug : setDebug
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
			if (stateTypes[member.type] === undefined) {
				throw new Error("State type not registered : "+ member.type);
			} else {
				members[member.name] = member;
				return instance;
			}
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
		
		function set() {
			if (typeof(arguments[0]) == "string") {
				debugInfo("Setting single state: "+ arguments[0] + " = " + arguments[1]);
				setMember(arguments[0], arguments[1], arguments[2]);
			} else {
				var batch = arguments[0];
				for(var name in batch) {
					debugInfo("Setting state in batch: "+ name + " = " + batch[name]);
					setMember(name, batch[name], arguments[1]);
				}
			}
			for(var stateTypeName in stateTypes) {
				stateTypes[stateTypeName].updateState();
			}
			
			return instance;
		}
		
		function setDebug(debug) {
			isDebug = debug;
			return instance;
		}
	
		/* Private Methods */
		function setMember(name, value, options) {
			var member = members[name];
			if (!member) {
				throw new Error("Error setting state. Member not registered : " + name);
			} else {
				var stateType = stateTypes[member.type];
				if (stateType) {
					stateType.set(member, value, options);
				} else {
					throw new Error("Error setting state. Type '"+ member.type +"' not recognised for member : " + name);
				}
			}
		}
	
		function debugInfo(message) {
			if (isDebug === true) { console.log(message); }
		}
	}
	
	/* State Types */
	function PageClientState($this, events) {
		var oldState = null;
		var newState = {};
		
		return {
			init : init,
			get : get,
			set : set,
			updateState : updateState
		}
		
		function init(members) {
			$(window).hashchange(onHashChange(members));
			onHashChange(members)();			
		}
		
		function get(member) {
			var value = $.bbq.getState()[member.name];
			value = value === undefined
				? member.defaultValue ? member.defaultValue : null
				: value;
			if (value !== undefined && value !== null) { value = value.toString(); }
			return value;
		}
		
		function set(member, value) {
			newState[member.name] = value.toString();
		}
		
		function updateState() {
			$.bbq.pushState(newState);
			newState = {};
		}
		
		function onHashChange(members) {
			return function() {
				for(var name in members) {
					var member = members[name];
					if (member !== undefined) {
						var oldValue = oldState == null ? null : oldState[name];
						var newValue = get(member);
						if (newValue !== oldValue) {
							events.stateUpdated({ member : member, oldValue : oldValue, newValue : newValue });
						}
					}
				}
				oldState = $.bbq.getState();
			};
		}
	}
	
	function PageServerState($this, events) {	
		var stateUpdates = [];
		
		return {
			init : init,
			get : get,
			set : set,
			updateState : updateState
		}
		
		function init(members) {
			for(var name in members) {
				var member = members[name];
				events.stateUpdated({ member : member, oldValue : null, newValue : get(member) });
			}
		}
		
		function get(member) {	
			var value = $.deparam.querystring()[member.name];
			value = value === undefined
				? member.defaultValue ? member.defaultValue : null
				: value;
			if (value !== undefined && value !== null) { value = value.toString(); }
			return value;
		}
		
		function set(member, value) {		
			var oldValue = get(member);
			value = value.toString();
			if (value !== oldValue) {
				localStorage.setItem(member.name, value);
				stateUpdates.push({ member : member, oldValue : oldValue, newValue : value });
			}
		}
		
		function updateState() {
			if (stateUpdates.length > 0) {
				var newState = {};
				for(var i=0; i<stateUpdates.length; i++) {
					newState[stateUpdates[i].member.name] = stateUpdates[i].newValue;
				}
				var currentUrl = window.location.href;
				var newUrl = $.param.querystring(currentUrl, newState);
				stateUpdates = [];
				window.location.replace(newUrl)				
			}
		}
	}
	
	function LocalStorageState($this, events) {
		var stateUpdates = [];
	
		return {
			init : init,
			get : get,
			set : set,
			updateState : updateState
		}
		
		function init(members) {
			for(var name in members) {
				var member = members[name];
				stateUpdates.push({ member : member, oldValue : null, newValue : get(member) });
			}
			updateState();
		}
		
		function get(member) {
			var value = localStorage.getItem(member.name);
			value = value === null
				? member.defaultValue ? member.defaultValue : null
				: value;
			if (value !== undefined && value !== null) { value = value.toString(); }
			return value;
		}
		
		function set(member, value) {
			var oldValue = get(member);
			if (value !== undefined && value !== null) { value = value.toString(); }
			if (value !== oldValue) {
				localStorage.setItem(member.name, value);
				stateUpdates.push({ member : member, oldValue : oldValue, newValue : value });
			}
		}
		
		function updateState() {
			while (stateUpdates.length > 0) {
				var stateUpdate = stateUpdates.shift();
				events.stateUpdated(stateUpdate);
			}
		}
	}
	
	function CookieState($this, events) {
		var stateUpdates = [];
	
		return {
			init : init,
			get : get,
			set : set,
			updateState : updateState
		}
		
		function init(members) {
			for(var name in members) {
				var member = members[name];
				stateUpdates.push({ member : member, oldValue : null, newValue : get(member) });
			}
			updateState();
		}
		
		function get(member) {
			var value = $.cookie(member.name);
			value = value === null
				? member.defaultValue ? member.defaultValue : null
				: value;
			if (value !== undefined && value !== null) { value = value.toString(); }
			return value;
		}
		
		function set(member, value, options) {
			var oldValue = get(member);
			if (value !== undefined && value !== null) { value = value.toString(); }
			if (value !== oldValue) {
				$.cookie(member.name, value, options);
				stateUpdates.push({ member : member, oldValue : oldValue, newValue : value });
			}
		}
		
		function updateState() {
			while (stateUpdates.length > 0) {
				var stateUpdate = stateUpdates.shift();
				events.stateUpdated(stateUpdate);
			}
		}
	}
})(jQuery);
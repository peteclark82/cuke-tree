module.exports = function(statusArray) {
	return {
		create : function() {
			var statusIndex = 0;
			return {
				update : function(newState) {
					if (statusArray.indexOf(newState) > statusIndex) {
						statusIndex = statusArray.indexOf(newState);
					}
				},
				get : function() { return statusArray[statusIndex]; }
			};
		}
	};	
}
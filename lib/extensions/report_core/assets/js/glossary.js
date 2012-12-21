// THIS NEEDS FIXING!!

$(function() {
	$.fn.glossary = function() {
		var isDebug = false;
		var $self = $(this);
		
		return {
			highlightTerms : highlightTerms,
			unhighlightTerms : unhighlightTerms
		};
		
		function highlightTerms(terms) {
			terms = terms.slice().sort(function(a,b) {
				var aSpaces = a.name.match(new RegExp(" ","g"));
				var aWordCount = aSpaces ? aSpaces.length + 1 : 1;
				var bSpaces = b.name.match(new RegExp(" ","g"));
				var bWordCount = bSpaces ? bSpaces.length + 1 : 1;

				return aWordCount < bWordCount;
			});
		
			$self.each(function() {
				var $this = $(this);
				for(var i=0; i<terms.length; i++) {			
					var term = terms[i];
					$this.highlight(term.name, { element: 'span', className: 'glossary-term', highlighted: function(err, $highlight) {
						$highlight.attr("title", term.description);
					}});
				}				
			});
		}
		function unhighlightTerms() {
			$this.unhighlight();
		}
	};
});

/* Extend jQuery selector functions */
$(function() {
	$.extend($.expr[':'], {
		'containsi': function (elem, i, match, array) {
			var text = $(elem).andSelf().contents().filter(function() {
						return this.nodeType === 3;
				}).text().toLowerCase();
			return text.indexOf((match[3] || "").toLowerCase()) >= 0;
		}
	});
});
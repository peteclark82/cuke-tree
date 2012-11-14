$(function() {
	$.fn.glossary = function() {
		var isDebug = false;
		var $roots = $(this);
		
		return {
			highlightTerms : highlightTerms,
			unhighlightTerms : unhighlightTerms
		};
		
		function highlightTerms(originalGlossary) {
			unhighlightTerms();
			$roots.each(function() {
				var $root = $(this);
				var glossary = originalGlossary.slice(0,originalGlossary.length)
				.sort(function(a,b) {
					var aSpaces = a.name.match(new RegExp(" ","g"));
					var aWordCount = aSpaces ? aSpaces.length + 1 : 1;
					var bSpaces = b.name.match(new RegExp(" ","g"));
					var bWordCount = bSpaces ? bSpaces.length + 1 : 1;

					return aWordCount < bWordCount;
				});
						
				for(var i=0; i<glossary.length; i++) {
					var term = glossary[i];
								
					printDebug("Searching for '"+ term.name +"'...");
					var contains = ":containsi('"+ term.name +"')";
					var $instances = $root.find("a" + contains + ",span"+contains);
					printDebug($instances.length + " instances found.");
					
					$instances.each(function() {
						var $instance = $(this);
						
						printDebug("Found for '"+ term.name +"':-");
						printDebug($instance.html());
						
						var className = term.type ? term.type : "";
						if (!$instance.hasClass("glossary-term")) {
							printDebug("Wrapping...");
							
							var $newInstance = $instance.clone();
							$newInstance.contents().remove();
							var description = term.description.replace(/'/g, "&#39;");
							var termPattern = new RegExp("([\\b<>\\s]" + term.name + "s{0,1}[\\b<>\\s])", "gi");
							var termElement = "<span class='glossary-term "+ className +"' title='"+ description +"'>$1</span>";

							$instance.andSelf().contents().each(function() {
								if (this.nodeType === 3) {
									$newInstance.append("<span>"+ this.textContent.replace(termPattern, termElement) +"</span>");
								} else {
									$newInstance.append($(this));
								}
							});
							$instance.replaceWith($newInstance);
							
							printDebug($newInstance.html());
						}
					});
				}
			});
		};
		
		function unhighlightTerms() {
			$roots.each(function() {
				var $root = $(this);
				$root.find("span.glossary-term").each(function() {
					$(this).replaceWith($(this).html());
				});
			});
		}
		
		function printDebug(message) {
			if (isDebug) {console.log(message);}
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
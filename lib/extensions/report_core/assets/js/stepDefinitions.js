$(function () {
	$.fn.stepDefinitions = function() {	
		var $stepDefs = $(this);
		
		$(this).on("stepDefinitions.update", function() {
			setupStepsReport();
		});
		
		$(this).on("stepDefinitions.gotoStepDef", function(e, options) {
			$(".steps>dt").each(function() {
				var $step = $(this);
				var pattern = $step.text();
				var re = new RegExp(pattern.slice(1,pattern.length-1));
				var stepName = options.stepName.replace(/^(Given |When |Then |And )/,"");
				if (re.test(stepName)) {
					$step.parents().each(function() {
						$(this).show();
					});
					$(window).scrollTop($step.offset().top - 100); //scroll top is always 0 for all steps for some reason!
					$step.addClass("step-highlighted").effect("pulsate", { times : 5 }, 1000, function() {
						$step.removeClass("step-highlighted");
					});
				}
			});
		});
								
		function setupStepsReport() {
			$stepDefs.find(".step-info dt>a").click(function(e) {
				e.preventDefault();
				$(this).parent("dt").next().toggle();
			});
			
			$stepDefs.find(".step-files dt").click(function(e) {
				e.preventDefault();
				$(this).next().toggle();
			});
			
			$stepDefs.find(".step-info dt>a").click(function(e) {
				e.preventDefault();
				$(this).parent("dt").next().toggle();
			});
			
			$stepDefs.find(".open-stepdefs").click(function(e) {
				cukeTree.emit('edit', { uri : $(this).data("path") });
			});
			
			$stepDefs.find(".steps > dt").each(function() {
				var $instance = $(this);
				var $newInstance = $instance.clone();
				var html = $newInstance.html();
				//var html = html.replace(/(\/)/g, "<span class='regex-delimiter'>$1</span>");
				var html = html.replace(/(\')/g, "<span class='regex-quote'>$1</span>");
				var html = html.replace(/(\^|\$|\\d|\\w|\+)/g, "<span class='regex-symbol'>$1</span>");
				var html = html.replace(/(\[|\])/g, "<span class='regex-range'>$1</span>");
				
				$newInstance.html(html);
				$instance.replaceWith($newInstance);
			});
		}
	};
});
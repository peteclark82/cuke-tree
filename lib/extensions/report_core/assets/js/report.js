$(function () {	
	$.fn.report = function() {
		$(this).each(function() {
			var $report = $(this);
			$report.dblclick(function(e, t) {
				e.preventDefault();
				var $target = $(e.srcElement).parents("li").eq(0);
				$(this).jstree('toggle_node', $target)
			})
			.on("report.display", function(e, options) {
				displayReport(options);
			});
						
			/* Private Methods */	
			function displayReport(options) {
				var treeOptions = {
					plugins : [ "themes", "html_data", "ui", "cookies", "contextmenu" ],
					"cookies" : {
						"save_opened" : $report.attr("id")+"_opened"
					},
					"contextmenu" : {
						"select_node" : true,
						"items" : function (node) {
							var type = $(node).data("type"), menu = {};
							if (type == "step") {
								menu.gotoStepDef = {
									"label" : "Goto Step Definition",
									"action" : function ($node) { $report.trigger("report.goto_step_def", { stepName : $node.children("a").text().trim() }); }
								};
							}
							return menu;
						}
					}
				};
				if (options && options.data) {
					treeOptions["html_data"] = { "data" : options.data };
				}
				
				$report.jstree(treeOptions)
				.on("loaded.jstree", function(event, data) {
					$report.trigger("report.loaded");
				})
				.on("select_node.jstree", function(event, data) {
					var $node = $(data.args[0]);
					$report.trigger("report.select_node", { selected : $node });
				});	
			}
		});
		
		return $(this);
	};
});
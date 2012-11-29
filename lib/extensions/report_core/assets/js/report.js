$(function () {	
	var $cukeTree = $(window.document);

	$cukeTree.on("cukeTree.initialising", function() {
		initialiseReports($(".report-tree"));
	});
	
	function initialiseReports($reports) {
		$reports.each(function() {
			var $report = $(this);

			$cukeTree.on("cukeTree.reportUpdating", function(e, $updatingReport) {
				if ($report[0] == $updatingReport) {
					updateReport();
				}
			});
			
			$report.on("dblclick", function(e, t) {
				e.preventDefault();
				var $target = $(e.srcElement).parents("li").eq(0);
				$(this).jstree('toggle_node', $target)
			});
						
			/* Private Methods */	
			function updateReport() {
				var treeOptions = {
					plugins : [ "themes", "html_data", "ui", "cookies", "contextmenu" ],
					"cookies" : {
						"save_opened" : $report.attr("id")+"_opened"
					},
					"contextmenu" : {
						"select_node" : true,
						"items" : contextMenuHandler
					}
				};
				$report.jstree(treeOptions)
				.on("loaded.jstree", function(event, data) {
					$cukeTree.cukeTree().events.reportRendered($report);
				})
				.on("select_node.jstree", function(event, data) {
					var $node = $(data.args[0]);
					$cukeTree.cukeTree().events.reportNodeSelected({ $report : $report, selected : $node });
				});	
			}
			
			function contextMenuHandler(node) {
				var type = $(node).data("type"), menu = {};
				if (type == "step") {
					menu.gotoStepDef = {
						"label" : "Goto Step Definition",
						"action" : function ($node) { $report.trigger("report.goto_step_def", { stepName : $node.children("a").text().trim() }); }
					};
				}
				return menu;
			}
		});
	}
});
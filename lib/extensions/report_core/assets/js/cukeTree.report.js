(function($) {	
	$.cukeTree
		.attachMethod("updateReport", function(cukeTree) {
			return function($report) {
				this.trigger("cukeTree.reportUpdating", $report);
			};
		})
		.attachMethod("reportRendered", function(cukeTree) {
			return function($report) {
				this.trigger("cukeTree.reportRendered", $report);
			};
		})
		.attachMethod("reportNodeSelected", function(cukeTree) {
			return function(options) {
				this.trigger("cukeTree.report.nodeSelected", options);
			};
		});
	
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
			function getNodeIndex(path, index, node) {
				path += "/" + node.id;
				var id = hashCode(path);
				node.nodeId = id;
				index[id] = node;
				if (node.children !== undefined) {
					for(var i=0; i<node.children.length; i++) {
						getNodeIndex(path, index, node.children[i]);
					}
				}
				if (node.features !== undefined) {
					for(var i=0; i<node.features.length; i++) {
						getNodeIndex(path, index, node.features[i]);
					}
				}
				return index;
			}
			
			function updateReport() {
				var nodeIndex = getNodeIndex("", {}, structureJson);
				console.log("UPDATING");
				console.log(structureJson);
			
				var treeOptions = {
					"plugins" : [ "themes", "json_data", "ui", "cookies", "contextmenu" ],
					"cookies" : {
						"save_opened" : $report.attr("id")+"_opened"
					},
					"contextmenu" : {
						"select_node" : true,
						"items" : contextMenuHandler
					},
					"json_data" : {
						"progressive_render" : true,
						"progressive_unload" : true,
						"data" : function(id, callback) {
							var data = null;
							if (id === -1) {
								var node = structureJson;
								data = {
									attr : { id : node.nodeId },
									data : node.name,
									state : "closed"
								};
							} else {
								id = $(id).attr("id");
								console.log("ID = "+ id);
								var node = nodeIndex[id];
								data = [];
								if (node.features !== undefined) {
									for(var i=0; i<node.children.length; i++) {
										var child = node.children[i];
										data.push({
											attr : { id : child.nodeId },
											data : child.name,
											state : "closed"
										});
									}
									for(var i=0; i<node.features.length; i++) {
										var child = node.features[i];
										data.push({
											attr : { id : child.nodeId },
											data : child.name,
											state : "closed"
										});
									}
								}
							}
							callback(data);
						}
					}
				};
				$report.jstree(treeOptions)
				.on("loaded.jstree", function(event, data) {
					$cukeTree.cukeTree().reportRendered($report);
				})
				.on("select_node.jstree", function(event, data) {
					var $node = $(data.args[0]);
					$cukeTree.cukeTree().reportNodeSelected({ $report : $report, selected : $node });
				});	
			}
			
			function hashCode(str){
				var hash = 0;
				if (str.length == 0) return hash;
				for (i = 0; i < str.length; i++) {
						char = str.charCodeAt(i);
						hash = ((hash<<5)-hash)+char;
						hash = hash & hash; // Convert to 32bit integer
				}
				return hash;
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
})(jQuery);
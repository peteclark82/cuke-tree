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
			function updateReport() {
				var nodeIndex = getNodeIndex("", {}, structureJson);
			
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
						"data" : dataHandler
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
        
        function dataHandler(item, callback) {
          var data = [];
          if (item === -1) {
            data.push(getTreeNode("group", structureJson));
          } else {
            var parent = nodeIndex[$(item).attr("id")];
            if (parent.children !== undefined) {
              for(var i=0; i<parent.children.length; i++) { data.push(getTreeNode("group", parent.children[i])); }
            }
            if (parent.features !== undefined) {
              for(var i=0; i<parent.features.length; i++) { data.push(getTreeNode("feature", parent.features[i])); }
            }
            if (parent.elements !== undefined) {
              for(var i=0; i<parent.elements.length; i++) { data.push(getTreeNode("scenario", parent.elements[i])); }
            }
            if (parent.steps !== undefined) {
              for(var i=0; i<parent.steps.length; i++) { data.push(getTreeNode("step", parent.steps[i])); }
            }
          }
          callback(data);
        }
			}
      
      function getNodeIndex(path, index, node) {
        var uniqueId = node.uri !== undefined ? node.uri : node.id;
				path += "/" + uniqueId;
				var id = hashCode(path);
				node.nodeId = id;
        node.nodePath = path;
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
        if (node.elements !== undefined) {
					for(var i=0; i<node.elements.length; i++) {
						getNodeIndex(path, index, node.elements[i]);
					}
				}
        if (node.steps !== undefined) {
					for(var i=0; i<node.steps.length; i++) {
						getNodeIndex(path, index, node.steps[i]);
					}
				}
				return index;
			}
      
      function getTreeNode(type, node) {
        var cssClasses = "";
        if (node.result.status == "failed") {
          //cssClasses += "jstree-open";
        } else {
          //cssClasses += "jstree-closed"
        }
        cssClasses += " node-"+ node.result.status;
        switch(type) {
          case "group":
            cssClasses +=" group group-"+ node.result.status;
            break;
          case "feature":
            cssClasses +=" feature-"+ node.result.status;
            break;
          case "scenario":
            cssClasses +=" scenario-"+ node.result.status;
            break;
          case "step":
            cssClasses +=" step-"+ node.result.status;
            break;
          default:
            break;
        }
        
        return {
          attr : { id : node.nodeId, "data-node-path" : node.nodePath, "data-type" : type, class : cssClasses },
          state : "closed",
          data : {
            title : node.name,
            icon : type
          }
        };
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
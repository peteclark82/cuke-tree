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
          "core" : {
            "html_titles" : true
          },
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
          var data = null;
          if (item === -1) {
            data = [getTreeNode("group", structureJson)];
          } else {
            data = getTreeNodeChildren($(item).attr("id"));
          }
          callback(data);
        }
        
        function getTreeNodeChildren(id) {
          var data = [];
          var parent = nodeIndex[id];
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
          return data;
        }
        
        function getTreeNode(type, reportEntry) {
          var cssClasses = "node-"+ reportEntry.result.status;
          cssClasses += " "+ type +" "+ type +"-"+ reportEntry.result.status;
          
          var title = reportEntry.name;
          switch(type) {
            case "group": 
              title += " ("+ getScenarioCount(type, reportEntry) +" scenario(s))"; 
              break;
            case "feature":
              var scenarioCount = reportEntry.elements !== undefined ? reportEntry.elements.length : 0;
              if (reportEntry.profile !== undefined) {
                title += " <span class='profile'>["+ reportEntry.profile +"]</span>";
              }
              title += " ("+ scenarioCount +" scenario(s))"
              break;
            case "scenario":
              for(var i=0; i < (reportEntry.tags !== undefined ? reportEntry.tags.length : 0); i++) {
                title += " <span class='scenario-tag'>"+ reportEntry.tags[i].name +"</span>";
              }
              break;
            case "step":
              title = '<span class="keyword">'+ reportEntry.keyword +'</span>'+ title;
              break;
          }
          
          var addingChildren = reportEntry.result && reportEntry.result.status == "failed";
                  
          var node = {
            attr : { 
              id : reportEntry.nodeId,
              "data-type" : type, 
              class : cssClasses
            },
            state : addingChildren && type !== "step" ? "open" : "closed",
            data : {
              attr : { 
                href : "javascript:;", 
                "data-path" : reportEntry.uri
              },
              title : title,
              icon : type
            }
          };
          
          if (addingChildren) {
            node.children = getTreeNodeChildren(reportEntry.nodeId);
          }
          
          if (reportEntry.result.error_message !== undefined) {
            node.attr["data-error"] = reportEntry.result.error_message;
          }
          
          if (reportEntry.embeddings !== undefined) {
            node.attr["data-embedding-mime-type"] = reportEntry.embeddings[0].mime_type;
            node.attr["data-embedding-data"] = reportEntry.embeddings[0].data;
          }
          
          return node;
        }
			}
      
      function getScenarioCount(type, entry) {
        var count = 0;
        switch(type) {
          case "group":
            for(var i=0; i<entry.children.length; i++) {
              count += getScenarioCount(type, entry.children[i]);
            }
            for(var i=0; i<entry.features.length; i++) {
              count += getScenarioCount("feature", entry.features[i]);
            }
            break;
          case "feature":
            count += entry.elements !== undefined ? entry.elements.length : 0;
            break;
        }
        return count;
      }
      
      function getNodeIndex(path, index, node) {
        var uniqueId = node.uri !== undefined ? node.uri : node.id;
				path += "/" + uniqueId;
        if (node.profile) {
          path += node.profile;
        }
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
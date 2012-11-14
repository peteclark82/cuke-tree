$(function () {
	var $cukeTree = $(window);
	
	$cukeTree.stateManager()
		.add({ name : "hideSuccessful", type : "page", defaultValue : "false" })
		.add({ name : "reportView", type : "page", defaultValue : "reportTree" })
		.add({ name : "showDetail", type : "page", defaultValue : "true" })
		.add({ name : "selectedAccordian", type : "localStorage", defaultValue : "0" })
		.add({ name : "selectedTab", type : "localStorage", defaultValue : "0" });
	
	$cukeTree.on("cukeTree.starting", function() {
		init();
	});
	
	var $elements = {
		tabs : {
			all:$(".tabGroup"), stepDefinitions:$("#steps")
		},
		accordion : {
			all:$(".accordion")
		},
		detail : {
			panel:$("#detail")
		},
		toolBox : {
			reportView:$("#reportView"), toggleDetail:$("#detail_button"), hideSuccessful:$("#toggle_visible")
		},
		reportTrees : {
			all:$(".report-tree")
		}
	};
		
	var glossaryJson = null;
	
	function init() {		
		basicPageStructure();					
		toolBox_icons();
		toolBox_hideSuccessful();
		toolBox_reportView();
		detailPane();
		stepDefinitions();
		glossary();
		
		$(window).stateManager().init();
	}
	
	function basicPageStructure() {
		$elements.accordion.all.accordion().on("accordionchange", function(event, ui) {
			 $cukeTree.stateManager().set("selectedAccordian", ui.options.active.toString());			
		});		
		$cukeTree.on("stateManager.stateUpdated.selectedAccordian", function(e, options) {
			$elements.accordion.all.accordion().accordion("activate", parseInt(options.newValue));
		});

		$elements.tabs.all.tabs().on("tabsselect", function(event, ui) {
			 $cukeTree.stateManager().set("selectedTab", ui.index.toString());			
		});
		$cukeTree.on("stateManager.stateUpdated.selectedTab", function(e, options) {
			$elements.tabs.all.tabs().tabs("select", parseInt(options.newValue));
		});
	}
	
	function toolBox_icons() {
		/* Nasty Hack jQuery UI Icons */
		$(document).on("mouseenter", ".ui-icon", function() {
			$(this).parent().addClass('ui-state-hover');
		}).on("mouseleave", ".ui-icon", function() {
			$(this).parent().removeClass('ui-state-hover');
		});
	}
	
	function toolBox_hideSuccessful() {
		$elements.toolBox.hideSuccessful.on("click", function(e) {
			e.preventDefault(); $cukeTree.stateManager().set("hideSuccessful", $elements.toolBox.hideSuccessful.is(":checked") ? "true" : "false");			
		});
		
		$cukeTree.on("stateManager.stateUpdated.hideSuccessful", function(e, options) {
			hideSuccesful($(".report-tree"), (options.newValue == "true" ? true : false))
		})
		.on("cukeTree.reportRendered", function(e, report) {
			hideSuccesful($(report), ($cukeTree.stateManager().get("hideSuccessful") == "true" ? true : false))
		});
		
		function hideSuccesful($context, hide) {
			if (hide) {
				$context.find("li.node-passed").hide(); $elements.toolBox.hideSuccessful.attr("checked", "checked");
			} else {
				$context.find("li.node-passed").show(); $elements.toolBox.hideSuccessful.removeAttr("checked");
			}
		}
	}
	
	function toolBox_reportView() {
		$elements.toolBox.reportView.on("change", function(e) {
			e.preventDefault(); $cukeTree.stateManager().set("reportView", $elements.toolBox.reportView.val());			
		});
		
		$cukeTree.on("stateManager.stateUpdated.reportView", function(e, options) {
			$elements.reportTrees.all.hide();
			$("#"+ options.newValue).show();
			$elements.toolBox.reportView.val(options.newValue);
		});
	}
	
	function detailPane() {
		$elements.detail.panel.reportDetail();
		
		$elements.toolBox.toggleDetail.on("click", function(e) {
			e.preventDefault(); $cukeTree.stateManager().set("showDetail", $elements.detail.panel.is(":visible") ? "false" : "true");			
		});
		
		$cukeTree.on("stateManager.stateUpdated.showDetail", function(e, options) {
			if (options.newValue === "true") {
				$elements.detail.panel.show();
			} else {
				$elements.detail.panel.hide();
			}
		})
		.on("cukeTree.report.nodeSelected", function(e, options) { 
			var $node = options.selected;
			var detail = {
				name : $node.text(),
				node : $node.parents("li").eq(0),
				mingleUrl : $node.data("mingle-url")
			};
			$elements.detail.panel.trigger("reportDetail.render", detail);
		});
	}

	function stepDefinitions() {
		$elements.tabs.stepDefinitions.stepDefinitions();
		$cukeTree.on("report.goto_step_def", function(e, options) {
			$elements.tabs.all.tabs("select", 2);
			$elements.tabs.stepDefinitions.trigger("stepDefinitions.gotoStepDef", options);
		});
	}

	function glossary() {
		$cukeTree.on("cukeTree.glossaryUpdated", function(e, glossary) {
			glossaryJson = glossary.json;
			$elements.reportTrees.all.glossary().highlightTerms(glossaryJson);
		});
	
		$cukeTree.on("cukeTree.reportRendered", function(e, report) {
			if (glossaryJson !== null) {
				$(report).glossary().highlightTerms(glossaryJson);
			}
		});
	}
});
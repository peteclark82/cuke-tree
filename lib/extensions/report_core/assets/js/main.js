$(function () {
	// this should be the only script orchestrating things, apart from extensions
	var $cukeTree = $(window.document); //this should be passed in to all plugin parts to use as a context
	
	$.stateManager
		.add({ name : "hideSuccessful", type : "page.client", defaultValue : "false" })
		.add({ name : "reportView", type : "page.client", defaultValue : "reportTree" })
		.add({ name : "showDetail", type : "page.client", defaultValue : "true" })
		.add({ name : "selectedAccordian", type : "localStorage", defaultValue : "0" })
		.add({ name : "selectedTab", type : "localStorage", defaultValue : "0" });
						
	var elements = $cukeTree.elementManager();
	elements
		.addGroup({ name : "tabs" })
			.add({ name : "all", selector : ".tabGroup" })
			.add({ name : "stepDefinitions", selector : "#steps" })
			.parent()
		.addGroup({ name : "accordion" })
			.add({ name : "all", selector : ".accordion" })
			.parent()
		.addGroup({ name : "detail" })
			.add({ name : "panel", selector : "#detail" })
			.parent()
		.addGroup({ name : "toolBox" })
			.add({ name : "reportView", selector : "#reportView" })
			.add({ name : "toggleDetail", selector : "#detail_button" })
			.add({ name : "hideSuccessful", selector : "#toggle_visible" })
			.parent()
		.addGroup({ name : "reportTrees" })
			.add({ name : "all", selector : ".report-tree" })
			.parent();
			
	var hasInitialised = false;
	$cukeTree.on("cukeTree.starting", function() {
		init();
	});
				
	var glossaryJson = null;
	
	function init() {				
		if (!hasInitialised) {
			basicPageStructure();					
			toolBox_icons();
			toolBox_hideSuccessful();
			toolBox_reportView();
			detailPane();
			stepDefinitions();
			glossary();		
			
			$cukeTree.stateManager().init();
		}
		hasInitialised = true;
	}
	
	function basicPageStructure() {
		elements.get().accordion().accordion().on("accordionchange", function(event, ui) {
			 $.stateManager.set("selectedAccordian", ui.options.active.toString());			
		});		
		$cukeTree.on("stateManager.stateUpdated.selectedAccordian", function(e, options) {
			elements.get().accordion().accordion().accordion("activate", parseInt(options.newValue));
		});

		elements.get().tabs().tabs().on("tabsselect", function(event, ui) {
			$.stateManager.set("selectedTab", ui.index.toString());			
		});
		$cukeTree.on("stateManager.stateUpdated.selectedTab", function(e, options) {
			elements.get().tabs().tabs("select", parseInt(options.newValue));
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
		var $hideSuccessful = elements.get().toolBox.get().hideSuccessful();
	
		$hideSuccessful.on("click", function(e) { e.preventDefault(); 
			$.stateManager.set("hideSuccessful", $hideSuccessful.is(":checked") ? "true" : "false");			
		});
		
		$cukeTree.on("stateManager.stateUpdated.hideSuccessful", function(e, options) {
			hideSuccesful($(".report-tree"), (options.newValue == "true" ? true : false))
		})
		.on("cukeTree.reportRendered", function(e, report) {
			hideSuccesful($(report), ($.stateManager.get("hideSuccessful") == "true" ? true : false))
		});
		
		function hideSuccesful($context, hide) {
			if (hide) {
				$context.find("li.node-passed").hide(); $hideSuccessful.attr("checked", "checked");
			} else {
				$context.find("li.node-passed").show(); $hideSuccessful.removeAttr("checked");
			}
		}
	}
	
	function toolBox_reportView() {
		var $reportView = elements.get().toolBox.get().reportView();
	
		$reportView.on("change", function(e) {
			e.preventDefault(); $.stateManager.set("reportView", $reportView.val());			
		});
		
		$cukeTree.on("stateManager.stateUpdated.reportView", function(e, options) {
			elements.get().reportTrees().hide();
			$("#"+ options.newValue).show();
			$reportView.val(options.newValue);
		});
	}
	
	function detailPane() {
		var $panel = elements.get().detail.get().panel();
		$panel.reportDetail();
		
		elements.get().toolBox.get().toggleDetail().on("click", function(e) {
			e.preventDefault(); $.stateManager.set("showDetail", $panel.is(":visible") ? "false" : "true");			
		});
		
		$cukeTree
			.on("stateManager.stateUpdated.showDetail", function(e, options) {
				if (options.newValue === "true") {
					$panel.show();
				} else {
					$panel.hide();
				}
			})
			.on("cukeTree.report.nodeSelected", function(e, options) { 
				var $node = options.selected;
				var detail = {
					name : $node.text(),
					node : $node.parents("li").eq(0),
					mingleUrl : $node.data("mingle-url")
				};
				$panel.trigger("reportDetail.render", detail);
			});
	}

	function stepDefinitions() {
		elements.get().tabs.get().stepDefinitions().stepDefinitions();
		$cukeTree.on("report.goto_step_def", function(e, options) {
			elements.get().tabs().tabs("select", 2);
			elements.get().tabs.get().stepDefinitions().trigger("stepDefinitions.gotoStepDef", options);
		});
	}

	function glossary() {
		$cukeTree.on("cukeTree.glossaryUpdated", function(e, glossary) {
			glossaryJson = glossary.json;
			elements.get().reportTrees().glossary().highlightTerms(glossaryJson);
		});
	
		$cukeTree.on("cukeTree.reportRendered", function(e, report) {
			if (glossaryJson !== null) {
				$(report).glossary().highlightTerms(glossaryJson);
			}
		});
	}
});
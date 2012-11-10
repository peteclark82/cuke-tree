$(function () {
	var $cukeTree = $(window);

	$cukeTree.cukeTree().init();
	
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
	var $detailButton = $("#detail_button");
	var $toggleVisibleButton = $("#toggle_visible");
	
	$cukeTree.on("cukeTree.starting", function() {
		init();
	});
	
	$(window).hashchange(function() {
		var newState = $.bbq.getState();
		hideSuccessful(newState.hideSuccessful ? newState.hideSuccessful : "false");
		showReportByView(newState.reportView ? newState.reportView : "reportTree");		
		if (newState.showDetail !== "false") {
			$elements.detail.panel.show();
		} else {
			$elements.detail.panel.hide();
		}
	});
	
	function init() {		
		var selectedAccordian = localStorage && localStorage.getItem("selectedAccordian") ? parseInt(localStorage.getItem("selectedAccordian")) : 0;			
		$elements.accordion.all.accordion()
			.accordion("activate", selectedAccordian)
			.on("accordionchange", function(event, ui) {
				localStorage.setItem("selectedAccordian", ui.options.active);
			});
			
		var selectedTab = localStorage && localStorage.getItem("selectedTab") ? parseInt(localStorage.getItem("selectedTab")) : 0;		
		$elements.tabs.all.tabs()
			.tabs("select", selectedTab)
			.on("tabsselect", function(event, ui) {
				localStorage.setItem("selectedTab", ui.index);
			});
		$elements.tabs.stepDefinitions.stepDefinitions();

		$elements.detail.panel.reportDetail();
			
		$elements.toolBox.toggleDetail.click(function(e) {
			e.preventDefault();
			$.bbq.pushState({ showDetail : $elements.detail.panel.is(":visible") ? "false" : "true" });
		});

		$elements.toolBox.hideSuccessful.click(function(e) {
			e.preventDefault();
			$.bbq.pushState({ hideSuccessful : $elements.toolBox.hideSuccessful.is(":checked") ? "true" : "false" });
		});
		
		$elements.toolBox.reportView.change(function(e) {
			e.preventDefault();
			$.bbq.pushState({ reportView : $elements.toolBox.reportView.val() });
		});
		
		$('#icons div').hover(
			function() { $(this).addClass('ui-state-hover'); }, 
			function() { $(this).removeClass('ui-state-hover'); }
		);
		
		$cukeTree
			.on("cukeTree.report.nodeSelected", function(e, options) { 
				displayDetails(options.selected);
			})
			.on("report.goto_step_def", function(e, options) {
				$elements.tabs.all.tabs("select", 2);
				$elements.tabs.stepDefinitions.trigger("stepDefinitions.gotoStepDef", options);
			});
		
		$(window).hashchange();
	}

	/* Private Methods */	
	function displayDetails($node) {		
		var detail = {
			name : $node.text(),
			node : $node.parents("li").eq(0),
			mingleUrl : $node.data("mingle-url")
		};
		$elements.detail.panel.trigger("reportDetail.render", detail);
	}
	
	function hideSuccessful(hide) {
		var $successNodes = $("li.node-passed");
		if (hide === "false") {
			$successNodes.show();
			$elements.toolBox.hideSuccessful.removeAttr("checked");
		} else {
			$successNodes.hide();
			$elements.toolBox.hideSuccessful.attr("checked", "checked");
		}
	}
	
	function showReportByView(reportId) {
		$elements.reportTrees.all.hide();
		$("#"+ reportId).show();
		$elements.toolBox.reportView.val(reportId);
	}
});
$(function () {
	var $detailButton = $("#detail_button");
	var $toggleVisibleButton = $("#toggle_visible");
	var $reportView = $("#reportView");
	
	$(window).hashchange(function() {
		var newState = $.bbq.getState();
		hideSuccessful(newState.hideSuccessful ? newState.hideSuccessful : "false");
		showReportByView(newState.reportView ? newState.reportView : "reportTree");		
		if (newState.showDetail !== "false") {
			$("#detail").show();
		} else {
			$("#detail").hide();
		}
	});
	
	setupBehaviour();
	
	var selectedTab = 0, selectedAccordian = 0;
	if (localStorage) {
		if (localStorage.getItem("selectedTab")) {
			selectedTab = parseInt(localStorage.getItem("selectedTab"));
		}
		if (localStorage.getItem("selectedAccordian")) {
			selectedAccordian = parseInt(localStorage.getItem("selectedAccordian"));
		}
	}	
	$(".tabGroup").tabs().tabs("select", selectedTab)
		.on("tabsselect", function(event, ui) {
			localStorage.setItem("selectedTab", ui.index);
		});
	$(".accordion").accordion().accordion("activate", selectedAccordian)
		.on("accordionchange", function(event, ui) {
			localStorage.setItem("selectedAccordian", ui.options.active);
		});
	$("#steps").stepDefinitions();
	$("#detail").reportDetail();
	$(".report-tree").report().on("report.select_node", function(e, options) {
		displayDetails(options.selected);
	}).on("report.goto_step_def", function(e, options) {
		$(".tabGroup").tabs().tabs("select", 2);
		$("#steps").trigger("stepDefinitions.gotoStepDef", options);
	});

	/* Private Methods */	
	function setupBehaviour() {
		$detailButton.click(function(e) {
			e.preventDefault();
			$.bbq.pushState({ showDetail : $("#detail").is(":visible") ? "false" : "true" });
		});

		$toggleVisibleButton.click(function(e) {
			e.preventDefault();
			$.bbq.pushState({ hideSuccessful : $toggleVisibleButton.is(":checked") ? "true" : "false" });
		});
		
		$reportView.change(function(e) {
			e.preventDefault();
			$.bbq.pushState({ reportView : $reportView.val() });
		});
		
		$('#icons div').hover(
			function() { $(this).addClass('ui-state-hover'); }, 
			function() { $(this).removeClass('ui-state-hover'); }
		);
	}
	
	function displayDetails($node) {		
		var detail = {
			name : $node.text(),
			node : $node.parents("li").eq(0),
			mingleUrl : $node.data("mingle-url")
		};
		$("#detail").trigger("reportDetail.render", detail);
	}
	
	function hideSuccessful(hide) {
		var $successNodes = $("li.node-passed");
		if (hide === "false") {
			$successNodes.show();
			$toggleVisibleButton.removeAttr("checked");
		} else {
			$successNodes.hide();
			$toggleVisibleButton.attr("checked", "checked");
		}
	}
	
	function showReportByView(viewMode) {
		$(".report-tree").hide();
		$("#"+ viewMode).show();
		$reportView.val(viewMode);
	}
});
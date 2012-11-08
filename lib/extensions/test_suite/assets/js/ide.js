var cukeTree = null;

$(function() {
	var $runTests = $("#runTests");
	var $editNode = $("#editNode");
	var $runCurrent = $("#runCurrent");
	var glossaryJson = null;
	
	var lastState = null;
	$(window).hashchange(function() {
		var newState = $.bbq.getState();
		if (newState.filename && (!lastState || newState.filename !== lastState.filename)) {
			getReport(newState.filename);
		}
		lastState = newState;
	});
	
	$("#testHistory").testHistory();
	
	$runTests.click(function(e) {
		e.preventDefault();
		runTests({label : "Running all tests...", feature : null})
	});
	
	$("#runTests, #runCurrent, #editNode, #viewMingle").addClass("disabled");
	var isConnected = false;
	cukeTree = io.connect('/cuke-tree')
		.on("connect", onConnect)
		.on("disconnect", onDisconnect)
		.on("testsError", onTestsError)
		.on("testsFinished", onTestsFinished)
		.on("reportError", onReportError)	
		.on("reportReceived", onReportsReceived)
		.on("testHistoryUpdated", onTestHistoryUpdated)
		.on("glossaryUpdated", onGlossaryUpdated);		
	
	$(".report-tree")
	.on("report.select_node", function(e, options) {
		displayDetailTools(options.selected);
	})
	.on("report.loaded", function() {
		if (glossaryJson) {
			$(this).glossary().highlightTerms(glossaryJson);
		}
		if ($(this).is(":visible")) {
			$(this).effect("pulsate", { times : 2 }, 250);
		}
	});
	
	/* Socket Event Handlers */
	function onConnect() {
		$("h1").addClass("connected");
		$("#runTests, #runCurrent, #editNode, #viewMingle").removeClass("disabled");
		isConnected = true;
		updateStatus("Connected.");
		$(window).hashchange();
	}
	
	function onDisconnect() {
		$("h1").removeClass("connected");
		$("#runTests, #runCurrent, #editNode, #viewMingle").addClass("disabled");
		isConnected = false;
		updateStatus("Disconnected.");
		$(window).hashchange();
	}
	
  function onTestsError(res) {
		$("#runTests, #runCurrent, #editNode, #viewMingle").removeClass("disabled");
		updateStatus("Error running tests :-<br>"+ JSON.stringify(res.error));
	}
	
	function onTestsFinished(res) {
		updateStatus("Tests Complete.");
		$.bbq.pushState({ filename : res.filename });
	}
	
	function onReportError(res) {
		$("#runTests, #runCurrent, #editNode, #viewMingle").removeClass("disabled");
		updateStatus("Error generating report :-<br>"+ JSON.stringify(res.error));
	}
	
	function onReportsReceived(res) {
		$("#runTests, #runCurrent, #editNode, #viewMingle").removeClass("disabled");
		updateStatus("Displaying report for : "+ $.bbq.getState().filename);
		$("#summary").html(res.summary);
		$("#steps").html(res.steps);
		$("#steps").trigger("stepDefinitions.update");
		$("#domain").html(res.domain);
		$("#domain").trigger("testDomain.update");
		$("#reportTree").trigger("report.display", { data : res.report });
		$("#scenarioTree").trigger("report.display", { data : res.scenarios });
	}
	
	function onTestHistoryUpdated(res) {
		$("#testHistory").trigger("testHistory.display", { data : res.testHistory });
	}
	
	function onGlossaryUpdated(res) {
		if (res.error) {
			updateStatus("Error updating glossary:-<br>"+ JSON.stringify(res.error));
		} else {
			updateStatus("Glossary updated.")
			glossaryJson = res.glossaryJson;
			$(".report-tree").glossary().highlightTerms(res.glossaryJson);
			$("#glossary").html(res.glossary);
		}
	}
	
	/* Private */
	function getReport(filename) {
		$("#runTests, #runCurrent, #editNode, #viewMingle").addClass("disabled");
		updateStatus("Generating report for : " + filename);
		$("#reportTree").html("");
		cukeTree.emit('getReport', { filename : filename });
	}
		
	function displayDetailTools($node) {
		var type = $node.parent("li").data("type");
		
		$editNode.hide();
		$runCurrent.hide();
		if (type == "feature" || type == "group") {
			if ($node.data("path")) {
				$runCurrent.show().unbind("click").click(function(e) {
					e.preventDefault();
					if (!$(this).hasClass("disabled")) {
						var featurePath = $node.data("path").replace(/\\/g,"/");
						runTests({label : "Running "+ type +" : "+ featurePath, feature : featurePath})
					} 
				});
			
				$editNode.show().unbind("click").click(function(e) {
					e.preventDefault();
					if (!$(this).hasClass("disabled")) {
						cukeTree.emit('edit', { uri : $node.data("path").replace(/\\/g,"/") });
					}
				});
			}
		}
	}
	
	function runTests(options) {
		if (!$runTests.hasClass("disabled")) {
			$runTests.addClass("disabled");
			$runCurrent.addClass("disabled");
			updateStatus(options.label);
			cukeTree.emit('runTests', { feature : options.feature });
		}	
	}
	
	function finishTests() {
		$runTests.removeClass("disabled");
		$runCurrent.removeClass("disabled");
	}
		
	function updateStatus(message) {
		var date = new Date();
		var timestamp = " "+ padStringLeft(date.getHours().toString(), 2, "0") +":"+ padStringLeft(date.getMinutes().toString(), 2, "0") +":"+ padStringLeft(date.getSeconds().toString(), 2, "0");
		$("#statusLabel").prepend(timestamp +" -&gt; "+ message +"<br/>");
	}
	
	function padStringLeft(string, minLength, character) {
		var padding = "";
		for(var i=string.length; i<minLength; i++) {
			padding+=character;
		}
		return padding + string;
	}
});
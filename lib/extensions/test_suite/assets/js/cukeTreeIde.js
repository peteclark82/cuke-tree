/*
	# Expose runTests method on cukeTreeIde jquery extension
	# Expose edit method on cukeTreeIde jquery extension (ie so stepdefinitions plugin can open files)
	# Change UI disabling mechanism to use custom data attributes on elements, to make it more extensible
	# Add stateManager that wraps BBQ and abstracts page state and local storage state,
		with events when values are changed (also invoked on initial page load)
	# Fixed $elements, mechanism is crap at the moment, and potentially broken as selectors may be modified (jquery.add is used)
*/

var structureJson = null;

$(function() {
	var $cukeTree = $(window.document);
		
	$.stateManager
		.add({ name : "filename", type : "page.client", defaultValue : null });
	
	var $elements = {
		display : {
			connectionStatus:$(".cuke-tree-title"), statusBar:$("#statusBar"),
			statusLog:$("#statusLabel"), summary:$("#summary"),
			testHistory:$("#testHistory")
		},
		tabs : {
			glossary:$("#glossary"), stepDefinitions:$("#steps"), testDomain:$("#domain")
		},
		reportTrees : {
			all:$(".report-tree"), byFolder:$("#reportTree")
		},
		toolBox : {
			runAll:$("#runTests"), progressBar:$("#progressBar"), dryRunMode:$("#dryRunMode")
		},
		detailToolBox : {
			editSelected:$("#editNode"), runSelected:$("#runCurrent"), viewMingle:$("viewMingle")
		}
	};
		
	$.fn.cukeTreeIde = function() {
		var $this = this;
		
		var cukeTreeIde = {
			init : wrap(init),
			showReport : wrap(showReport),
			openFile : openFile,
			events : {
				uiDisabled : wrap(function() { this.trigger("cukeTreeIde.uiDisabled"); }),
				uiEnabled : wrap(function() { this.trigger("cukeTreeIde.uiEnabled"); })
			}
		};
		
		return cukeTreeIde;
		
		/* Public Methods */
		function init() {
			this.on("cukeTreeIde.uiDisabled", function() {
				$getElements("toolBox", "detailToolBox").addClass("disabled");
			}).on("cukeTreeIde.uiEnabled", function() {
				$getElements("toolBox", "detailToolBox").removeClass("disabled");
			}).on("cukeTree.report.nodeSelected", function(e, options) {
				displayDetailTools(options.selected);
			}).on("stateManager.stateUpdated.filename", function(e, options) {
				if (options.newValue) {
					$cukeTree.cukeTreeIde().showReport(options.newValue);
				}
			});
			
			$elements.toolBox.runAll.on("click", function(e) {
				e.preventDefault();
				runTests({label : "Running all tests...", feature : null})
			});
			
			updateProgressBar(0);
			
			$elements.display.testHistory.testHistory();
			
			this.data("cukeTreeIde.server.isConnected", false);
			var server = io.connect('/cuke-tree')
				.on("connect", onConnect)
				.on("disconnect", onDisconnect)
				.on("testsError", onTestsError)
				.on("testsFinished", onTestsFinished)
				.on("testsProgressed", onTestsProgressed)
				.on("reportError", onReportError)	
				.on("reportReceived", onReportReceived)
				.on("reportReceivedJson", onReportReceivedJson)
				.on("testHistoryUpdated", onTestHistoryUpdated)
				.on("glossaryUpdated", onGlossaryUpdated);		
			this.data("cukeTreeIde.server", server);					
			
			cukeTreeIde.events.uiDisabled();
			return this;
		}
		
		function showReport(filename) {
			cukeTreeIde.events.uiDisabled();
			updateStatus("Generating report for '" + filename+"'...");
			//this.data("cukeTreeIde.server").emit('getReport', { filename : filename });
			this.data("cukeTreeIde.server").emit('getReportJson', { filename : filename });
			return this;
		}

		function openFile(filename) {
			$cukeTree.data("cukeTreeIde.server").emit('edit', { uri : filename });
		}
		
		/* Socket Event Handlers */
		function onConnect() {
			cukeTreeIde.events.uiEnabled();
			$elements.display.connectionStatus.addClass("connected");
			updateStatus("Connected.");
			$this.data("cukeTreeIde.server.isConnected", true);
			$cukeTree.cukeTree().start(); 
		}
		
		function onDisconnect() {
			cukeTreeIde.events.uiDisabled();
			$elements.display.connectionStatus.removeClass("connected");			
			updateStatus("Disconnected.");
			$this.data("cukeTreeIde.server.isConnected", false);
		}
		
		function onTestsError(res) {
			cukeTreeIde.events.uiEnabled();
			updateStatus("Error running tests :-<br>"+ JSON.stringify(res.error), true);
		}
		
		function onTestsFinished(res) {
			console.log("Received testsFinished from server : "+ new Date().toString());
			cukeTreeIde.events.uiEnabled();
			updateStatus("Tests Complete.");
			$.stateManager.set("filename", res.filename);
			var minutes = Math.floor(res.elapsed/60);
			var seconds = Math.floor(res.elapsed % 60);
			var elapsed = padString(minutes.toString(), 2, "0") + ":" + padString(seconds.toString(), 2, "0");
			$elements.toolBox.progressBar.find("div").text("Elapsed : "+ elapsed);
		}
		
		function onTestsProgressed(res) {
			updateProgressBar(res.percent, res.scenarioStatus);
		}
		
		function onReportError(res) {
			cukeTreeIde.events.uiEnabled();
			updateStatus("Error generating report :-<br>"+ JSON.stringify(res.error), true);
		}
		
		function onReportReceived(res) {
			$this.trigger("cukeTreeIde.reportReceived", res);
		
			cukeTreeIde.events.uiEnabled();
			updateStatus("Displaying report for '"+ $.stateManager.get("filename") +"'...");
			$elements.display.summary.html(res.summary);
			$elements.tabs.stepDefinitions.html(res.steps).trigger("stepDefinitions.update");
			$elements.tabs.testDomain.html(res.domain).trigger("testDomain.update");
			
			$elements.reportTrees.byFolder.html("<ul>"+ res.report + "</ul>");
			$cukeTree.cukeTree().updateReport($elements.reportTrees.byFolder);
		}
		
		function onReportReceivedJson(res) {
			//$this.trigger("cukeTreeIde.reportReceived", res);
			console.log("HERE");
			console.log(res);
			cukeTreeIde.events.uiEnabled();
			
			structureJson = res;
			$cukeTree.cukeTree().updateReport($elements.reportTrees.byFolder);
		}
		
		function onTestHistoryUpdated(res) {
			$elements.display.testHistory.trigger("testHistory.display", { data : res.testHistory });
		}
		
		function onGlossaryUpdated(res) {
			if (res.error) {
				updateStatus("Error updating glossary:-<br>"+ JSON.stringify(res.error), true);
			} else {
				updateStatus("Glossary updated.")
				$elements.tabs.glossary.html(res.glossary);
				$cukeTree.cukeTree().updateGlossary(res.glossaryJson);
			}
		}
		
		/* Private Methods */	
		function padString(string, count, character) {
			while (string.length < count) {string = character + string;}
			return string;
		}
		
		function updateProgressBar(percent, status) {			
			$elements.toolBox.progressBar.progressbar({ value: percent });
			$elements.toolBox.progressBar.find("div").text(percent +"%");
			if (percent == 0) {
				$elements.toolBox.progressBar.data("status", "passed");
				$elements.toolBox.progressBar.find("div").removeClass("passed").removeClass("undefined").removeClass("failed");
				$elements.toolBox.progressBar.find("div").addClass("passed");
			} else if (status !== undefined) {
				var statusOrder = ["passed", "undefined", "failed"];
				var currentStatus = $elements.toolBox.progressBar.data("status");
				var currentStatusIndex = statusOrder.indexOf(currentStatus ? currentStatus : "passed");
				var newStatusIndex = statusOrder.indexOf(status);
				if (newStatusIndex > currentStatusIndex) {
					$elements.toolBox.progressBar.data("status", status);
					$elements.toolBox.progressBar.find("div").removeClass("passed").removeClass("undefined").removeClass("failed");
					$elements.toolBox.progressBar.find("div").addClass(status);
				}
			}
		}
		
		function displayDetailTools($node) {
			var type = $node.parent("li").data("type");
			
			$elements.detailToolBox.editSelected.hide();
			$elements.detailToolBox.runSelected.hide();
			if (type == "feature" || type == "group") {
				if ($node.data("path")) {
					$elements.detailToolBox.runSelected.show().unbind("click").click(function(e) {
						e.preventDefault();
						if (!$(this).hasClass("disabled")) {
							var featurePath = $node.data("path").replace(/\\/g,"/");
							runTests({label : "Running "+ type +" : "+ featurePath, feature : featurePath})
						} 
					});
				
					$elements.detailToolBox.editSelected.show().unbind("click").click(function(e) {
						
						e.preventDefault();
						if (!$(this).hasClass("disabled")) {
							cukeTreeIde.openFile($node.data("path").replace(/\\/g,"/"));
						}
					});
				}
			}
		}
		
		function runTests(options) {
			if (!$elements.toolBox.runAll.hasClass("disabled")) {
				cukeTreeIde.events.uiDisabled();
				updateProgressBar(0);
				updateStatus(options.label);
				$cukeTree.data("cukeTreeIde.server").emit('runTests', { feature : options.feature, dryRun : $elements.toolBox.dryRunMode.is(":checked") });
			}	
		}
					
		function updateStatus(message, isError) {
			var date = new Date();
			var hours = padStringLeft(date.getHours().toString(), 2, "0");
			var minutes = padStringLeft(date.getMinutes().toString(), 2, "0");
			var seconds = padStringLeft(date.getSeconds().toString(), 2, "0");
			var timestamp = " "+ hours +":"+ minutes +":"+ seconds;
			$elements.display.statusLog.prepend(timestamp +" -&gt; "+ message +"<br/>");
			$elements.display.statusBar.text(message).removeClass("error");
			if (isError) {
				$elements.display.statusBar.addClass("error");
			}
		}
		
		function padStringLeft(string, minLength, character) {
			var padding = "";
			for(var i=string.length; i<minLength; i++) { padding+=character; }
			return padding + string;
		}
		
		/* Helper Functions */
		function $getElements() {
			var groups = [], args = Array.prototype.slice.apply(arguments);
			
			if (args.length > 0) {
				for (var groupName in $elements) {
					if (args.indexOf(groupName) > -1) { groups.push($elements[groupName]); }
				}
			} else {
				for (var groupName in $elements) { groups.push($elements[groupName]); }
			}

			var $matched = null;			
			for (var i=0; i<groups.length; i++) {
				for (var elementName in groups[i]) {
					if ($matched === null) { $matched = groups[i][elementName];
					} else { $matched.add(groups[i][elementName]); }					
				}
			}

			return $matched === null ? $([]) : $matched;
		}
		
		function wrap(func) { return function() { func.apply($this, arguments);}; }
	};
});
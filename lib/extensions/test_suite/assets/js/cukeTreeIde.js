$(function() {
	var $cukeTree = $(window);

	var $elements = {
		display : {
			connectionStatus:$("h1"), statusLog:$("#statusLabel"), summary:$("#summary"),
			testHistory:$("#testHistory")
		},
		tabs : {
			glossary:$("#glossary"), stepDefinitions:$("#steps"), testDomain:$("#domain")
		},
		reportTrees : {
			all:$(".report-tree"), byFolder:$("#reportTree"), byScenario:$("#scenarioTree")
		},
		toolBox : {
			runAll:$("#runTests"), progressBar:$("#progressBar"), skeletonMode:$("#skeletonMode")
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
				.on("reportReceived", onReportsReceived)
				.on("testHistoryUpdated", onTestHistoryUpdated)
				.on("glossaryUpdated", onGlossaryUpdated);		
			this.data("cukeTreeIde.server", server);					
			
			cukeTreeIde.events.uiDisabled();
			return this;
		}
		
		function showReport(filename) {
			cukeTreeIde.events.uiDisabled();
			updateStatus("Generating report for : " + filename);
			this.data("cukeTreeIde.server").emit('getReport', { filename : filename });
			
			return this;
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
			updateStatus("Error running tests :-<br>"+ JSON.stringify(res.error));
		}
		
		function onTestsFinished(res) {
			cukeTreeIde.events.uiEnabled();
			updateStatus("Tests Complete.");
			$.bbq.pushState({ filename : res.filename });
		}
		
		function onTestsProgressed(res) {
			updateProgressBar(res.percent);
		}
		
		function onReportError(res) {
			cukeTreeIde.events.uiEnabled();
			updateStatus("Error generating report :-<br>"+ JSON.stringify(res.error));
		}
		
		function onReportsReceived(res) {
			cukeTreeIde.events.uiEnabled();
			updateStatus("Displaying report for : "+ $.bbq.getState().filename);
			$elements.display.summary.html(res.summary);
			$elements.tabs.stepDefinitions.html(res.steps).trigger("stepDefinitions.update");
			$elements.tabs.testDomain.html(res.domain).trigger("testDomain.update");
			
			$elements.reportTrees.byFolder.html("<ul>"+ res.report + "</ul>");
			$cukeTree.cukeTree().updateReport($elements.reportTrees.byFolder);
			$elements.reportTrees.byScenario.html("<ul>"+ res.scenarios + "</ul>");
			$cukeTree.cukeTree().updateReport($elements.reportTrees.byScenario);
		}
		
		function onTestHistoryUpdated(res) {
			$elements.display.testHistory.trigger("testHistory.display", { data : res.testHistory });
		}
		
		function onGlossaryUpdated(res) {
			if (res.error) {
				updateStatus("Error updating glossary:-<br>"+ JSON.stringify(res.error));
			} else {
				updateStatus("Glossary updated.")
				glossaryJson = res.glossaryJson;
				$elements.reportTrees.all.glossary().highlightTerms(res.glossaryJson);
				$elements.tabs.glossary.html(res.glossary);
			}
		}
		
		/* Private Methods */		
		function updateProgressBar(percent) {
			$elements.toolBox.progressBar.progressbar({ value: percent });
			$elements.toolBox.progressBar.find("div").text(percent +"%");
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
							$cukeTree.data("cukeTreeIde.server").emit('edit', { uri : $node.data("path").replace(/\\/g,"/") });
						}
					});
				}
			}
		}
		
		function runTests(options) {
			if (!$elements.toolBox.runAll.hasClass("disabled")) {
				cukeTreeIde.events.uiDisabled();
				updateStatus(options.label);
				$cukeTree.data("cukeTreeIde.server").emit('runTests', { feature : options.feature, skeleton : $elements.toolBox.skeletonMode.is(":checked") });
			}	
		}
					
		function updateStatus(message) {
			var date = new Date();
			var hours = padStringLeft(date.getHours().toString(), 2, "0");
			var minutes = padStringLeft(date.getMinutes().toString(), 2, "0");
			var seconds = padStringLeft(date.getSeconds().toString(), 2, "0");
			var timestamp = " "+ hours +":"+ minutes +":"+ seconds;
			$elements.display.statusLog.prepend(timestamp +" -&gt; "+ message +"<br/>");
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
var fs = require("fs"), path = require("path"), childProcess = require('child_process'),
  ce = require("cloneextend"), color = require("ansi-color").set, $f = require("fluid"),
  handlebars = require("handlebars"), dateFormat = require("dateformat"),
  jsonStream = require('JSONStream'),
  growingFile = require('growing-file');

var cukeTree = require("../../../cukeTree.js");
var testSuiteTemplates = cukeTree.internal.templates.loader.getSync(path.resolve(__dirname, "../templates"));


module.exports = function (options, callback) {
  var app = options.app;
  var config = options.config;

  cukeTree.createContext(config, function (err, ctContext) {
    var resultsPath = path.dirname(ctContext.input);

    var io = require("socket.io").listen(app);
    io.disable("log");

    var runningSocket = null;

    io.of("/cuke-tree")
      .on("connection", function (socket) {
        runningSocket = socket
          .on("runTests", onRunTests)
          .on("getReport", onGetReport)
          .on("edit", edit);

        getTestHistory();
      });
    io.configure(function () {
      io.set('transports', ['xhr-polling']);
    });

    fs.watch(config.glossaryFile, function (type, filename) {
      fs.stat(config.glossaryFile, function (err, stats) {
        if (stats.size > 0) {
          updateGlossary();
        }
      });
    });

    var server = {};
    callback(null, server);

    /* Socket Handlers */
    function onRunTests(data) {
      var running = (data && data.feature) ? "selected" : "all";
      var jsonFilename = dateFormat(new Date(), "isoDateTime").replace(/:/g, "-") + "_" + running + ".js";
      jsonFilename = path.join(resultsPath, jsonFilename);
      if (data.dryRun) {
        runTests({
          run: data && data.feature ? data.feature : config.features,
          output: jsonFilename,
          dryRun: true
        });
      } else {
        runTests({
          run: data && data.feature ? data.feature : config.features,
          output: jsonFilename,
          dryRun: true,
          ignoreStdout: true,
          finishedCallback: function (code) {
            console.log(color("\n------------------------------------------------------------", "black+white_bg"));
            if (code > 0) {
              console.log(color("Cucumber dry run process exited unexpectedly with code : " + code, "red+bold"));
              runningSocket.emit("testsError", { error: "Exited with code : " + code });
            } else {
              fs.readFile(jsonFilename, function (err, json) {
                if (err) {
                  console.log(color("Error reading output : " + jsonFilename + "\n" + err.toString(), "red+bold"));
                  runningSocket.emit("testsError", { error: "Error reading output : " + jsonFilename + "\n" + err.toString() });
                }
                else {
                  json = JSON.parse(json);

                  var scenarioCount = 0;

                  json.forEach(function (item) {
                    item.elements.forEach(function (element) {
                      scenarioCount++;
                    });
                  });

                  fs.unlink(jsonFilename, function (err) {
                    if (err) {
                      console.log(color("Error deleting dry run output : " + jsonFilename + "\n" + err.toString(), "red+bold"));
                      runningSocket.emit("testsError", { error: "Error attempting to delete dry run output : " + jsonFilename + "\n" + err.toString() });
                    } else {
                      console.log(color("Scenarios found in dry run : " + scenarioCount, "yellow+bold"));
                      console.log(color("Cucumber dry run process exited with code : " + code, "green+bold"));
                      runTests({
                        run: data && data.feature ? data.feature : config.features,
                        output: jsonFilename,
                        dryRun: false,
                        scenarioCount: scenarioCount
                      });
                    }
                  })
                }
              });
            }
            console.log(color("------------------------------------------------------------", "black+white_bg"));

          }
        });
      }
    }

    function runTests(options) {
      var scenarioIndex = 0;
      var outputReader;
      var jsonReader;

      console.log(color("\n------------------------------------------------------------", "black+white_bg"));
      console.log(color("Running cucumber" + (options.dryRun ? " dry run " : " ") + "feature path :-\n  " + options.run, "yellow+bold"));
      console.log(color("JSON output path :-\n  " + options.output, "yellow+bold"));
      console.log(color("\n------------------------------------------------------------", "black+white_bg"));

      if (options.scenarioCount) {
        outputReader = growingFile.open(options.output, { timeout: Infinity, interval: 250 });
        jsonReader = jsonStream.parse("*.elements.*");
        outputReader.pipe(jsonReader);

        jsonReader.on("data", function (data) {
          scenarioIndex++;

          var scenarioStatus = "passed";

          data.steps.forEach(function (step) {
            if (scenarioStatus === "passed" && step.result.status !== "passed") {
              scenarioStatus = "failed";
            }
          });

          runningSocket.emit("testsProgressed", { percent: Math.round((scenarioIndex / options.scenarioCount) * 100), scenarioStatus: scenarioStatus });
        });
      }

      var start = new Date();

      ctContext.behaviours.report_core.runTests(ce.cloneextend(ctContext, {
        output: options.output, //cukeTree input (report.json)
        run: options.run,
        dryRun: options.dryRun
      }), function (code) {
        var elapsed = (new Date() - start) / 1000;

        function done() {
          if (options.finishedCallback) {
            options.finishedCallback(code);
          }
          else {
            cucumberProcessFinished(code, options.output, elapsed)
          }
        }

        if (options.scenarioCount) {
          jsonReader.on('root', function(root, count) {
            jsonReader.destroy();
            jsonReader = null;
            outputReader.destroy();
            outputReader = null;

            done();
          });
        }
        else {
          done();
        }
      });
    }

    function onGetReport(data) {
      console.log(color("\n------------------------------------------------------------", "black+white_bg"));
      console.log(color("Generating report", "yellow+bold"));
      console.log(color("\n------------------------------------------------------------", "black+white_bg"));
      cukeTree.internal.pipelines.profiles.report.default(ce.cloneextend(ctContext, {
        input: path.join(resultsPath, data.filename)
      }), function (err, result) {
        console.log(color("\n------------------------------------------------------------", "black+white_bg"));
        if (err) {
          console.log(color("Error generating report :-", "red+bold"));
          console.log(err);
          runningSocket.emit("reportError", { error: err });
        } else {
          console.log(color("Report successfully generated", "green+bold"));
          runningSocket.emit("reportReceived", result.data);
          getTestHistory();
          updateGlossary();
        }
        console.log(color("\n------------------------------------------------------------", "black+white_bg"));
      });
    }

    function edit(data) {
      var cmd = "start " + data.uri;
      childProcess.exec(cmd);
    }

    /* Private Functions */
    function getTestHistory() {
      ctContext.behaviours.test_suite.getTestHistory(function (err, files) {
        if (err) {
          console.error(color("Error getting test history", "red+bold"));
          console.error(err);
        } else {
          runningSocket.emit("testHistoryUpdated", { testHistory: files });
        }
      });
    }

    function updateGlossary() {
      ctContext.behaviours.report_core.generateGlossary({ features: config.features, templates: testSuiteTemplates }, function (err, result) {
        if (err) {
          runningSocket.emit("glossaryUpdated", { error: err });
        } else {
          runningSocket.emit("glossaryUpdated", result);
        }
      });
    }

    function cucumberProcessFinished(code, jsonFilename, elapsed) {
      console.log(color("\n------------------------------------------------------------", "black+white_bg"));
      console.log(color("Time taken " + elapsed + " seconds", "yellow+bold"));
      if (code > 1) {
        console.log(color("Cucumber process exited unexpectedly with code : " + code, "red+bold"));
        runningSocket.emit("testsError", { error: "Exited with code : " + code }); //should include actual error message!!
      } else {
        console.log(color("Cucumber process exited with code : " + code, "green+bold"));
        console.log("Sending testsFinished to client : " + new Date().toString());
        runningSocket.emit("testsFinished", { filename: path.relative(resultsPath, jsonFilename), elapsed: elapsed });
      }
      console.log(color("------------------------------------------------------------", "black+white_bg"));
    }

  });
};
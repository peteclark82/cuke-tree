var CukeTree = require("./lib/cukeTree.js");

module.exports = {
  "command": "ide",
  "input": "./tmp/report.js",
  "output": "./tmp/report/",
  "features": "./features/",
  "bin": "node ./monkey_patches/cucumber/bin/cucumber.js",
  "launch": true,
  "ext": [
    CukeTree.extensions.test_suite
  ]
};

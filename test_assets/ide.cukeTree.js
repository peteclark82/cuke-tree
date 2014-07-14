var CukeTree = require("../lib/cukeTree.js");

module.exports = {
  "command": "ide",
  "input": "../tmp/report.js",
  "output": "../tmp/report/",
  "features": "./features/",
  "variant": "parallel-cucumber-js",
  "bin": "node ../node_modules/parallel-cucumber/bin/parallel-cucumber-js -f progress --max-retries=2",
  "launch": true,
  "ext": [
    CukeTree.extensions.test_suite
  ]
};

var CukeTree = require("./lib/cukeTree.js");

module.exports = {
  "command": "run",
  "input": "./tmp/report.js",
  "output": "./tmp/report/",
  "features": "./features/",
  "bin": "node ./node_modules/myriad-cucumber/bin/myriad-cucumber -w 2",
  "run": "./features/",
  "ext": []
};

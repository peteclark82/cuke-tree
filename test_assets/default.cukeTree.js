module.exports = {
  "command": "run",
  "input": "../tmp/report.js",
  "output": "../tmp/report/",
  "features": "./features/",
  "variant": "parallel-cucumber-js",
  "bin": "node ../node_modules/parallel-cucumber/bin/parallel-cucumber-js -f progress --max-retries=2",
  "run": "./features/",
  "ext": []
};

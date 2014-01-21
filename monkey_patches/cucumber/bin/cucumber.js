#!/usr/bin/env node

// This monkey patch is a temporary workaround for issue
// https://github.com/cucumber/cucumber-js/issues/120
var Cucumber = require('cucumber');
var cli = Cucumber.Cli(process.argv);
cli.run(function(succeeded) {
  var code = succeeded ? 0 : 1;

  process.on('exit', function() {
    process.exit(code);
  });
});

#!/usr/bin/env node
var Cucumber = require('cucumber');
Cucumber.Listener.JsonFormatter = require('../lib/cucumber/listener/json_formatter.js')

var argv = copyArray(process.argv);
removeItemFromArray(argv, '--dry-run');

var cli = Cucumber.Cli(argv);
cli.run(function(succeeded) {
  var code = succeeded ? 0 : 1;

  // This monkey patch is a temporary workaround for issue
  // https://github.com/cucumber/cucumber-js/issues/120
  process.on('exit', function() {
    process.exit(code);
  });
  
  var timeoutId = setTimeout(function () {
    console.error('Cucumber process timed out after waiting 60 seconds for the node.js event loop to empty.  There may be a resource leak.  Have all resources like database connections and network connections been closed properly?');
    process.exit(code);    
  }, 60 * 1000);
  
  if (timeoutId.unref) {
    timeoutId.unref();
  }
  else {
    clearTimeout(timeoutId);
  }
});

function copyArray(array) {
  return array.slice(0);
}

function removeItemFromArray(array, item) {
  var index = array.indexOf(item);
  
  if (index != -1) {
    array.splice(index, 1)
  }
}
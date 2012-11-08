#!/usr/bin/env node
var color = require("ansi-color").set, ce = require("cloneextend");		
		
var internal = require("../cukeTree.internal.js");

var cli = internal.cli.arguments.getCli();
var cmdArgs = cli.argv;

if (cmdArgs.h) { 
	cli.showHelp();
} else {
	internal.cli.arguments.getConfiguration(cmdArgs, function(err, config) {
		if (err) {
			console.error(color(err, "red"));
			cli.showHelp()
			process.exit(9);
		} else {
			var commands = {};
			config.extensions.forEach(function(extension) {
				if (extension.commands) { ce.extend(commands, extension.commands); }
			});

			var command = commands[config.command];
			if (!command) {
				console.error(color("Command not recognised : "+ config.command, "red"));
				console.error("Available commands :- ");
				console.error(Object.keys(commands));
				process.exit(3);
			} else {
				command(config);
			}
		}
	});		
}
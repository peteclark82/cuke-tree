module.exports = {
  package: '.',
  profiles: {
    desktop: {
      bin: './monkey_patches/.bin/cucumber-js',
      args: [].concat(['--format', 'json', '--require', './features']),
      env: {}
    }
  }
};
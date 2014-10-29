module.exports = function() {
  this.Before(function(callback) {
    callback();
  });

  this.World = function(callback) {
    var world = {};

    world.isDryRun = function() {
      return process.argv.indexOf('--dry-run') !== -1 || process.env.PARALLEL_CUCUMBER_DRY_RUN === 'true';
    };

    callback(world);
  };
} ;
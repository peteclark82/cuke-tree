module.exports = function() {
  this.Given(/^I note down the time$/, function(callback) {
    if (this.isDryRun()) { return callback(); }

    var self = this;

    self.time = new Date();
    callback();
  });

  this.When(/^I wait '(.*)' seconds$/, function(interval, callback) {
    if (this.isDryRun()) { return callback(); }

    setTimeout(
      function() {
        callback();
      },
      interval * 1000
    );
  });

  this.Then(/^'(.*)' to '(.*)' seconds should have elapsed$/, function(minInterval, maxInterval, callback) {
    if (this.isDryRun()) { return callback(); }

    var self = this;

    var actualInterval = new Date() - self.time;
    minInterval *= 1000;
    maxInterval *= 1000;

    if (actualInterval < minInterval) {
      callback({ message: "Elapsed interval was " + actualInterval + " milliseconds which is less than the minimum interval of " + minInterval + " milliseconds"});
    }
    else if (actualInterval > maxInterval) {
      callback({ message: "Elapsed interval was " + actualInterval + " milliseconds which is greater than the maximum interval of " + minInterval + " milliseconds"});
    }
    else {
      callback();
    }
  });
};

// https://gist.github.com/darrenscerri/5c3b3dcbe4d370435cfa

var Middleware = function(req, res) {
  this.req = req;
  this.res = res;
};

Middleware.prototype.use = function(fn) {
  var self = this;
  this.go = (function(req, res, stack) {
    return function(next) {
      stack.call(self, function() {
        fn.call(self, req, res, next.bind(self));
      });
    }.bind(this);
  })(this.req, this.res, this.go);
};

Middleware.prototype.go = function(next) {
  next(this.req, this.res);
};

module.exports = Middleware;
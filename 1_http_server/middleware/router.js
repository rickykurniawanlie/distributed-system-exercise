var RouteParser = require('route-parser');

var Route = function (method, uri, handler) {
  this.method = method;
  this.uri = uri;
  this.handler = handler;
}

var Router = (function Router () {
  var self = this;
  self.routes = [];
  self.error = function () { res.notFound(); };

  var get = function (uri, handler) {
    self.routes.push(new Route('GET', uri, handler));
  }

  var post = function (uri, handler) {
    self.routes.push(new Route('POST', uri, handler));
  }

  var error = function (handler) {
    self.error = handler;
  }

  var middleware = function (req, res, next) {
    var found = false;
    for (let i = 0; i < routes.length; i++) {
      let route = routes[i];
      var routeParser = new RouteParser(route.uri);
      var parseResult = routeParser.match(req.uri);
      if (req.method === route.method && parseResult) {
        found = true;
        req.route = parseResult;
        route.handler(req, res);
        next();
        break;
      }
    }
    if (!found) {
      self.error(req, res);
    }
    next();
  }

  return {
    Router: {
      get: get,
      post: post,
      error: error
    },
    middleware: middleware
  }
})();

module.exports = Router;
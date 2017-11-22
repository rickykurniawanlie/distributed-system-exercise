let constant = require('../const/infraConstant');
let healthy = true;

module.exports = {
  ping: function (req, res) {
    let msg = {};
    if (healthy) {
      msg.pong = constant.HEALTHY_STAT;
//      msg.message = constant.HEALTHY_MSG;
    } else {
      msg.pong = constant.UNHEALTHY_STAT;
//      msg.message = constant.UNHEALTHY_MSG;
    }
    res.json(msg);
  },
  setHealthy: function (req, res) {
    healthy = true;
    res.json({
      pong: constant.HEALTHY_STAT,
      message: constant.HEALTHY_MSG
    });
  },
  setUnhealthy: function (req, res) {
    healthy = false;
    res.json({
      pong: constant.UNHEALTHY_STAT,
      message: constant.UNHEALTHY_MSG
    });
  }
}

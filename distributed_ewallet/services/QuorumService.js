let ERROR_CODES = require('../const/errorConstant');
let constant = require('../const/infraConstant');
let logger = require('../services/Logger');
let printf = require('printf');

const CACHE_MILLIS = 10000;

class QuorumService {
  constructor(quorumCache, clusterService) {
    this.quorumCache = quorumCache;
    this.clusterService = clusterService;
  }

  async updatePing(user_id) {
    if (await this.clusterService.isMember(user_id)) {
      logger.info(printf('[PING][SUB][%s]', user_id));
      this.quorumCache.put(user_id, true, CACHE_MILLIS,
        function (key, value) {
          logger.debug('[PING][SUB][' + key + '] Removed from quorum');
        }
      );
    } else {
      logger.debug('[PING][SUB][' + user_id + '] Not cluster member. Ignoring...');
    }
  }

  async isFullQuorum() {
    var member = await this.clusterService.getMembers();
    var active = this.quorumCache.keys().length;
    var total = Object.keys(member).length;
    logger.info(printf('[FULL_QUORUM] %d/%d active: %s', active, total, this.quorumCache.keys().toString()));
    return active == total;
  }

  async isMajority() {
    var member = await this.clusterService.getMembers();
    var active = this.quorumCache.keys().length;
    var total = Object.keys(member).length;
    logger.info(printf('[MAJR_QUORUM] %d/%d active: %s', active, total, this.quorumCache.keys().toString()));
    return active * 2 > total;
  }
}

module.exports = QuorumService;

let asyncFs = require('async-file');
let axios = require('axios');
let path = require('path');
let Cluster = require('../models/cluster');

class ClusterCachedAccessor {
  constructor(cache) {
    this.cache = cache;
    this.CACHE_PREFIX = 'CLUSTER';
    this.CACHE_SVC_REPO = 'SVC_REPO';
    this.CACHE_EXP = 60 * 1000; // 60 secs
  }

  async getClusterMember() {
    try {
      var result = await Cluster.findOne({ _id: process.env.CLUSTER_ID }).exec();
      return result.members;
    } catch (e) {
      return [];
    }
  }

  async getServiceRepository() {
    var svcRepoList;
    try {
      if (process.env.SERVICE_REPO_SRC === 'url') {
        let result = await axios({
          method: 'get',
          url: process.env.SERVICE_REPO_URL,
          timeout: 1000
        });
        svcRepoList = result.data;
      } else if (process.env.SERVICE_REPO_SRC === 'file') {
        let result = await asyncFs.readFile(path.resolve('storage', process.env.SERVICE_REPO_URL), 'utf-8');
        svcRepoList = JSON.parse(result);
      }
      let idIpMap = {};
      for (var i = 0; i < svcRepoList.length; i++) {
        idIpMap[svcRepoList[i]['npm']] = svcRepoList[i]['ip'];
      }
      this.cache.put(this.CACHE_SVC_REPO, idIpMap, this.CACHE_EXP);

      return idIpMap;
    } catch (e) {
      return {};
    }

  }

  async updateMemberCache() {
    let idIpMap = await this.getServiceRepository();

    if (process.env.CLUSTER_MEMBER === 'repo') {
      this.cache.put(this.CACHE_PREFIX, idIpMap, this.CACHE_EXP);
      return idIpMap;
    }

    let clusterMembers = await this.getClusterMember();

    let result = {};
    for (var i = 0; i < clusterMembers.length; i++) {
      result[clusterMembers[i]] = idIpMap[clusterMembers[i]];
    }
    this.cache.put(this.CACHE_PREFIX, result, this.CACHE_EXP);
    return result;
  }

  async getMembers() {
    let result = this.cache.get(this.CACHE_PREFIX);
    if (!result) {
      result = await this.updateMemberCache();
      console.log(result);
    }
    return result;
  }

  async getIpById(id) {
    let cachedRepo = this.cache.get(this.CACHE_SVC_REPO);
    if (!cachedRepo) {
      cachedRepo = await this.getServiceRepository();
    }
    return cachedRepo[id];
  }
}

module.exports = ClusterCachedAccessor;
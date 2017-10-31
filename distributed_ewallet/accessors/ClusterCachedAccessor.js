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
    if (process.env.SERVICE_REPO_SRC === 'url') {
      let result = await axios.get(process.env.SERVICE_REPO_URL);
      svcRepoList = JSON.parse(result.data);
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
  }

  async updateCache() {
    let clusterMembers = await this.getClusterMember();
    let idIpMap = await this.getServiceRepository();

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
      result = await this.updateCache();
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
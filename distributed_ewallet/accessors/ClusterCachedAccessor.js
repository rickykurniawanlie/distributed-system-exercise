let asyncFs = require('async-file');
let axios = require('axios');
let path = require('path');

class ClusterCachedAccessor {
  constructor(cache) {
    this.cache = cache;
    this.CACHE_PREFIX = 'CLUSTER';
    this.CACHE_EXP = 60 * 1000; // 60 secs
  }

  async getClusterMember() {
    let result = await asyncFs.readFile(path.resolve('storage', 'clusterMembers.json'), 'utf-8');
    return JSON.parse(result);
  }

  async getServiceRepository() {
    // let result = await asyncFs.readFile(path.resolve('storage', 'serviceRepositoryMock.json'), 'utf-8');
    let result = await axios.get('http://152.118.31.2/list.php');
    return JSON.parse(result.data);
  }

  async updateCache() {
    let clusterMembers = await this.getClusterMember();
    let svcRepoList = await this.getServiceRepository();

    let tmpMap = {};
    for (var i = 0; i < svcRepoList.length; i++) {
      tmpMap[svcRepoList[i]['npm']] = svcRepoList[i]['ip'];
    }

    let result = {};
    for (var i = 0; i < clusterMembers.length; i++) {
      result[clusterMembers[i]] = tmpMap[clusterMembers[i]];
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

  getIp() {
    // TODO: Implement.
  }
}

module.exports = ClusterCachedAccessor;
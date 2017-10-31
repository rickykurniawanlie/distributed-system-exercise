class ClusterService {
  constructor(clusterAccessor) {
    this.clusterAccessor = clusterAccessor;
  }

  async getMembers() {
    return await this.clusterAccessor.getMembers();
  }

  async getIpById(id) {
    return await this.clusterAccessor.getIpById(id);
  }
}

module.exports = ClusterService;
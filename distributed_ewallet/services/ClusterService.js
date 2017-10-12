class ClusterService {
  constructor(clusterAccessor) {
    this.clusterAccessor = clusterAccessor;
  }

  async getMembers() {
    return await this.clusterAccessor.getMembers();
  }
}

module.exports = ClusterService;
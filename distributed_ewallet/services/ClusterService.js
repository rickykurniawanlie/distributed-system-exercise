class ClusterService {
  constructor(clusterAccessor) {
    this.clusterAccessor = clusterAccessor;
  }

  async isMember(id) {
  	var members = await this.clusterAccessor.getMembers();
  	return (members[id])? true : false;
  }

  async getMembers() {
    return await this.clusterAccessor.getMembers();
  }

  async getIpById(id) {
    return await this.clusterAccessor.getIpById(id);
  }
}

module.exports = ClusterService;
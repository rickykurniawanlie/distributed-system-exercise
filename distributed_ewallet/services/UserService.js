let User = require('../models/user');
class UserService {
  constructor() {
  }

  async getUser(user_id) {
    return await User.findOne({ _id: user_id }).exec();
  }

  async getUsers() {
    return await User.find({}).exec();
  }
}

module.exports = UserService;
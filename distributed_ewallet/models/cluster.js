var mongoose = require('mongoose');

let clusterSchema = mongoose.Schema({
    _id: String,
    members: Array
});

module.exports = mongoose.model('Cluster', clusterSchema);;
let clusterSchema = mongoose.Schema({
    _id: String,
    members: Array
});

module.exports = mongoose.model('cluster', clusterSchema);;
let userSchema = mongoose.Schema({
    _id: String,
    name: String,
    balance: Number
});

// userSchema.methods.XXX = function () {
//
// }

let User = mongoose.model('User', userSchema);

module.exports = User;
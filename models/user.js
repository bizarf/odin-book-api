const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String },
    provider: { type: String },
    joinDate: { type: Date },
    photo: { type: String },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    pendingFriends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, default: "user" },
});

module.exports = mongoose.model("User", UserSchema);

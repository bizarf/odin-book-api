const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    postContent: { type: String, required: true },
    timestamp: { type: Date },
    likes: { type: Number },
});

module.exports = mongoose.model("Post", PostSchema);

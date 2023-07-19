const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    comment: { type: String, required: true },
    timestamp: { type: Date },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    likes: { type: Number },
});

module.exports = mongoose.model("Comment", CommentSchema);

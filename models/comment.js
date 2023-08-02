const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },
    timestamp: { type: Date },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    edited: { type: Boolean, default: false },
});

module.exports = mongoose.model("Comment", CommentSchema);

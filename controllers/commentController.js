const Comment = require("../models/comment");
const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// makes a new comment on the post
exports.comment_create_post = [
    body("comment", "The comment must not be empty").trim().escape().notEmpty(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const comment = new Comment({
            user: req.user._id,
            comment: req.body.comment,
            timestamp: new Date(),
            postId: req.params.id,
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await comment.save();
            if (save) {
                res.status(201).json({
                    success: true,
                    message: "Comment was successfully made",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to save comment",
                });
            }
        }
    }),
];

// gets all comments for current post
exports.comments_get = asyncHandler(async (req, res, next) => {
    // check the post exists
    const post = await Post.findById(req.params.id).exec();
    if (post === null) {
        res.status(404).json({ success: false, message: "Post not found" });
    }

    // find comments by the post Id
    const allComments = await Comment.find({ postId: req.params.id })
        .populate("user")
        .exec();
    res.json({ allComments });
});

// deletes comment
exports.comment_delete = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec();

    if (!req.user._id === post.user._id) {
        res.status(401).json({
            success: false,
            message: "You are not authorized to do that",
        });
    }

    if (post === null) {
        res.status(404).json({ success: false, message: "Post not found" });
    } else {
        const comment = await Comment.findOneAndDelete({
            _id: req.params.commentId,
            postId: req.params.id,
        });

        if (comment) {
            res.json({
                success: true,
                message: "Comment successfully deleted",
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }
    }
});

// edit comment
exports.comment_edit_put = [
    body("comment", "The comment must not be empty").trim().escape().notEmpty(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const comment = await Comment.findOne({
            _id: req.params.commentId,
            postId: req.params.id,
        });

        if (comment) {
            const updatedComment = new Comment({
                user: req.user._id,
                comment: req.body.comment,
                timestamp: new Date(),
                edited: true,
                postId: req.params.id,
                _id: req.params.commentId,
                likes: comment.likes,
                likedBy: comment.likedBy,
            });

            if (!errors.isEmpty()) {
                res.status(400).json({
                    errors: errors.array({ onlyFirstError: true }),
                });
            } else {
                const save = await updatedComment.save();
                if (save) {
                    res.status(200).json({
                        success: true,
                        message: "Comment was successfully edited",
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        message: "Failed to save comment",
                    });
                }
            }
        } else {
            res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }
    }),
];

// like comment
exports.comment_like_toggle_put = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findOne({
        _id: req.params.commentId,
        postId: req.params.id,
    }).exec();

    if (comment === null) {
        res.status(404).json({ error: "Comment not found" });
    }

    const likedByCheck = comment.likedBy.filter((id) => id === req.user._id);

    if (likedByCheck.length === 1 && likedByCheck[0] === req.user_id) {
        // user removes a like to the post
        const removeLike = await Comment.findOneAndUpdate(
            {
                _id: req.params.commentId,
                postId: req.params.id,
                likedBy: { $elemMatch: { $eq: req.user._id } },
            },
            {
                $inc: { likes: -1 },
                $pull: { likedBy: req.user._id },
            }
        );

        if (removeLike) {
            res.json({ message: "Like removed from comment" });
        } else {
            res.status(500).json({ message: "Failed to remove comment" });
        }
    } else {
        // user adds a like to the comment
        const addLike = await Comment.findOneAndUpdate(
            {
                _id: req.params.commentId,
                postId: req.params.id,
            },
            {
                $inc: { likes: 1 },
                $addToSet: { likedBy: req.user._id },
            }
        );

        if (addLike) {
            res.json({ message: "Like added to comment" });
        } else {
            res.status(500).json({ message: "Failed to add comment" });
        }
    }
});

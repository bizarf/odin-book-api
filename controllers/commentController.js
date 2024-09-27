const Comment = require("../models/comment");
const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// makes a new comment on the post
exports.comment_create_post = [
    body("comment", "The comment must not be empty")
        .trim()
        // .escape()
        .blacklist("<>&/")
        .notEmpty(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);

        const comment = new Comment({
            user: req.user._id,
            comment: req.body.comment,
            timestamp: new Date(),
            postId: req.params.id,
        });

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await comment.save();
            if (save) {
                return res.status(201).json({
                    success: true,
                    message: "Comment was successfully made",
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to save comment",
                });
            }
        }
    }),
];

// gets all comments for current post
exports.comments_get = asyncHandler(async (req, res) => {
    // check the post exists
    const post = await Post.findById(req.params.id).exec();
    if (post === null) {
        return res
            .status(404)
            .json({ success: false, message: "Post not found" });
    }

    // find comments by the post Id
    const allComments = await Comment.find({ postId: req.params.id })
        .sort({ timestamp: -1 })
        .populate("user")
        .exec();
    return res.json({ allComments });
});

// deletes comment
exports.comment_delete = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).exec();
    if (!post) {
        return res
            .status(404)
            .json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.findById(req.params.commentId).exec();
    if (!comment) {
        return res
            .status(404)
            .json({ success: false, message: "Comment not found" });
    }

    if (req.user._id.toString() !== comment.user.toString()) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to delete this comment",
        });
    }

    await comment.deleteOne();

    return res.json({
        success: true,
        message: "Comment successfully deleted",
    });
});

// edit comment
exports.comment_edit_put = [
    body("comment", "The comment must not be empty")
        .trim()
        // .escape()
        .blacklist("<>&/")
        .notEmpty(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);

        // check if comment exists first
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        // make a new comment for the database, but we'll need to copy some of the existing data and make some changes too
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

        // validate comment and then find and update the comment with the new comment object
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await Comment.findByIdAndUpdate(
                req.params.commentId,
                updatedComment,
                {}
            );
            if (save) {
                return res.status(200).json({
                    success: true,
                    message: "Comment was successfully edited",
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to save comment",
                });
            }
        }
    }),
];

// like comment
exports.comment_like_toggle_put = asyncHandler(async (req, res) => {
    const comment = await Comment.findOne({
        _id: req.params.commentId,
        postId: req.params.id,
    }).exec();

    if (comment === null) {
        return res.status(404).json({ error: "Comment not found" });
    }

    const likedByCheck = comment.likedBy
        .map((id) => id.toString())
        .filter((id) => id === req.user._id.toString());

    if (likedByCheck.length === 0 && likedByCheck[0] !== req.user._id) {
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
            return res.json({
                success: true,
                message: "Like added to comment",
            });
        } else {
            return res
                .status(500)
                .json({ success: false, message: "Failed to add comment" });
        }
    } else {
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
            return res.json({
                success: true,
                message: "Like removed from comment",
            });
        } else {
            return res
                .status(500)
                .json({ success: false, message: "Failed to remove comment" });
        }
    }
});

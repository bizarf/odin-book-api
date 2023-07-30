const Post = require("../models/post");
const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// create a new post
exports.post_create_post = [
    body("postContent", "The post must not be empty")
        .trim()
        .escape()
        .notEmpty(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const post = new Post({
            user: req.user._id,
            postContent: req.body.postContent,
            timestamp: new Date(),
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await post.save();
            if (save) {
                res.status(201).json({
                    success: true,
                    message: "Post was successfully made",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to save post",
                });
            }
        }
    }),
];

// edit a post
exports.post_edit_put = [
    body("postContent", "The post must not be empty")
        .trim()
        .escape()
        .notEmpty(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        // get the original post object, so that we can later pass the original timestamp to the updated post object
        const post = await Post.findById(req.params.id).exec();

        // make sure the post exists first
        if (!post) {
            res.status(404).json({
                success: false,
                message: "The post does not exist",
            });
        }

        const updatedPost = new Post({
            user: req.user._id,
            postContent: req.body.postContent,
            timestamp: new Date(),
            edited: true,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await Post.findByIdAndUpdate(
                req.params.id,
                updatedPost,
                {}
            );
            if (save) {
                res.status(200).json({
                    success: true,
                    message: "Post was successfully edited",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to save post",
                });
            }
        }
    }),
];

// delete a post
exports.post_remove_delete = asyncHandler(async (req, res, next) => {
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
        const comments = await Comment.find({ postId: req.params.id });
        if (comments) {
            await Comment.deleteMany({ postId: req.params.id });
        }
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (deletedPost) {
            res.status(204).json({
                success: true,
                message: "Post successfully deleted",
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to delete post",
            });
        }
    }
});

// get all posts
exports.posts_get = asyncHandler(async (req, res, next) => {
    const page = req.query.page || 0;
    const postsPerPage = 10;

    // pagination feature: skip tells mongoose how many documents to skip, and limit will limit the number of documents that are returned
    const timeline = await Post.aggregate([
        {
            $match: {
                $or: [
                    { user: req.user._id },
                    { user: { $in: req.user.friends } },
                ],
            },
        },
        { $sort: { timestamp: -1 } },
        { $count: "totalPosts" },
        { $skip: page * postsPerPage },
        { $limit: postsPerPage },
    ]);
    if (timeline) {
        res.json({ success: true, timeline });
    } else {
        res.status(404).json({
            success: false,
            message: "Could not fetch posts",
        });
    }
});

// single post get
exports.post_single_get = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate("user").exec();

    if (post === null) {
        res.status(404).json({ success: false, message: "Post not found" });
    } else {
        res.json(post);
    }
});

// post like PUT
exports.post_toggle_put = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec();

    if (post === null) {
        res.status(404).json({ success: false, message: "Post not found" });
    }

    const likedByCheck = post.likedBy.filter((id) => id === req.user._id);

    if (likedByCheck.length === 1 && likedByCheck[0] === req.user_id) {
        // user removes a like to the post
        const removeLike = await Post.findByIdAndUpdate(req.params.id, {
            $inc: { likes: -1 },
            $pull: { likedBy: req.user._id },
        });

        if (removeLike) {
            res.json({ success: true, message: "Like removed from post" });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to remove like",
            });
        }
    } else {
        // user adds a like to the post
        const addLike = await Post.findByIdAndUpdate(req.params.id, {
            $inc: { likes: 1 },
            $addToSet: { likedBy: req.user._id },
        });

        if (addLike) {
            res.json({ success: true, message: "Like added to post" });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to add like",
            });
        }
    }
});

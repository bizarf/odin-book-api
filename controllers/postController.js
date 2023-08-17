const Post = require("../models/post");
const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// create a new post
exports.post_create_post = [
    body("postContent", "The post must not be empty")
        .trim()
        // .escape()
        .blacklist("<>&/")
        .notEmpty(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const post = new Post({
            user: req.user._id,
            postContent: req.body.postContent,
            timestamp: new Date(),
        });

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await post.save();
            if (save) {
                return res.status(201).json({
                    success: true,
                    message: "Post was successfully made",
                });
            } else {
                return res.status(500).json({
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
        // .escape()
        .blacklist("<>&/")
        .notEmpty(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        // get the original post object, so that we can later pass the original timestamp to the updated post object
        const post = await Post.findById(req.params.id).exec();

        // make sure the post exists first
        if (!post) {
            return res.status(404).json({
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
            return res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await Post.findByIdAndUpdate(
                req.params.id,
                updatedPost,
                {}
            );
            if (save) {
                return res.status(200).json({
                    success: true,
                    message: "Post was successfully edited",
                });
            } else {
                return res.status(500).json({
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

    if (!post) {
        return res
            .status(404)
            .json({ success: false, message: "Post not found" });
    }

    if (req.user._id.toString() !== post.user.toString()) {
        return res.status(401).json({
            success: false,
            message: "You are not authorized to delete this post",
        });
    }

    const comments = await Comment.find({ postId: req.params.id }).exec();
    if (comments) {
        await Comment.deleteMany({ postId: req.params.id });
    }

    const deletePost = await Post.findByIdAndDelete(req.params.id).exec();
    if (deletePost) {
        return res.status(200).json({
            success: true,
            message: "Post successfully deleted",
        });
    } else {
        return res.status(500).json({
            success: false,
            message: "Failed to delete post",
        });
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
        // { $count: "totalPosts" },
        { $skip: page * postsPerPage },
        { $limit: postsPerPage },
        {
            $lookup: {
                from: "users", // Replace with the actual collection name
                localField: "user",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                "user.password": 0,
                "user.joinDate": 0,
                "user.friends": 0,
                "user.provider": 0,
            },
        },
    ]);
    if (timeline) {
        return res.json({ success: true, timeline });
    } else {
        return res.status(404).json({
            success: false,
            message: "Could not fetch posts",
        });
    }
});

// get all posts from all users to create a global feed
exports.posts_global_get = asyncHandler(async (req, res, next) => {
    const page = req.query.page || 0;
    const postsPerPage = 10;

    // pagination feature: skip tells mongoose how many documents to skip, and limit will limit the number of documents that are returned
    const globalTimeline = await Post.find()
        .sort({ timestamp: -1 })
        .skip(page * postsPerPage)
        .limit(postsPerPage)
        .populate({
            path: "user",
            select: "-password -joinDate -friends -provider",
        })
        .exec();
    if (globalTimeline) {
        return res.json({ success: true, globalTimeline });
    } else {
        return res.status(404).json({
            success: false,
            message: "Could not fetch posts",
        });
    }
});

// get all posts from the provided user id
exports.post_user_get = asyncHandler(async (req, res, next) => {
    const page = req.query.page || 0;
    const postsPerPage = 10;

    // pagination feature: skip tells mongoose how many documents to skip, and limit will limit the number of documents that are returned
    const userPosts = await Post.find({ user: req.params.userId })
        .sort({ timestamp: -1 })
        .skip(page * postsPerPage)
        .limit(postsPerPage)
        .populate({
            path: "user",
            select: "-password -joinDate -friends -provider",
        })
        .exec();
    if (userPosts) {
        return res.json({ success: true, userPosts });
    } else {
        return res.status(404).json({
            success: false,
            message: "Could not fetch posts",
        });
    }
});

// single post get
exports.post_single_get = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate("user").exec();

    if (post === null) {
        return res
            .status(404)
            .json({ success: false, message: "Post not found" });
    } else {
        return res.json(post);
    }
});

// post like PUT
exports.post_toggle_put = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec();

    if (post === null) {
        return res
            .status(404)
            .json({ success: false, message: "Post not found" });
    }

    const likedByCheck = post.likedBy
        .map((id) => id.toString())
        .filter((id) => id === req.user._id.toString());

    if (likedByCheck.length === 0 && likedByCheck[0] != req.user._id) {
        // user adds a like to the post
        const addLike = await Post.findByIdAndUpdate(req.params.id, {
            $inc: { likes: 1 },
            $addToSet: { likedBy: req.user._id },
        });

        if (addLike) {
            return res.json({ success: true, message: "Like added to post" });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to add like",
            });
        }
    } else {
        // user removes a like to the post
        const removeLike = await Post.findByIdAndUpdate(req.params.id, {
            $inc: { likes: -1 },
            $pull: { likedBy: req.user._id },
        });

        if (removeLike) {
            return res.json({
                success: true,
                message: "Like removed from post",
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to remove like",
            });
        }
    }
});

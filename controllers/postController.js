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
                res.status(201).json({ message: "Post was successfully made" });
            } else {
                res.status(422).json({ message: "Something went wrong" });
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
            res.status(400).json({ error: "The post does not exist" });
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
                    message: "Post was successfully edited",
                });
            } else {
                res.status(422).json({ message: "Something went wrong" });
            }
        }
    }),
];

// delete a post
exports.post_remove_delete = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec();

    if (!req.user._id === post.user._id) {
        res.status(401).json({ error: "You are not authorized to do that" });
    }

    if (post === null) {
        res.status(404).json({ error: "Post not found" });
    } else {
        const comments = Comment.find({ postId: req.params.id });
        if (comments) {
            await Comment.deleteMany({ postId: req.params.id });
        }
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (deletedPost) {
            res.json({ message: "Post successfully deleted" });
        } else {
            res.status(422).json({ error: "Something went wrong" });
        }
    }
});

// get all posts
exports.posts_get = asyncHandler(async (req, res, next) => {
    const page = req.query.page || 0;
    const postsPerPage = 10;

    // count total number of posts for pagination buttons
    const totalPostsCount = await Post.countDocuments().exec();
    // pagination feature: skip tells mongoose how many documents to skip, and limit will limit the number of documents that are returned
    const allPosts = await Post.find()
        .sort({ timestamp: -1 })
        .skip(page * postsPerPage)
        .limit(postsPerPage)
        .exec();
    res.json({ totalPostsCount, allPosts });
});

// single post get
exports.post_single_get = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate("user").exec();

    if (post === null) {
        res.status(404).json({ error: "Post not found" });
    } else {
        res.json(post);
    }
});

// post like PUT
exports.post_like_put = asyncHandler(async (req, res, next) => {
    res.send("placeholder");
});

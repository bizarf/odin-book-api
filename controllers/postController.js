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

    asyncHandler((req, res, next) => {
        res.send("test");
    }),
];

// edit a post
exports.post_edit_put = [
    body("postContent", "The post must not be empty")
        .trim()
        .escape()
        .notEmpty(),

    asyncHandler((req, res, next) => {
        res.send("test");
    }),
];

// delete a post
exports.post_remove_delete = asyncHandler((req, res, next) => {
    res.send("test");
});

// get all posts
exports.posts_get = asyncHandler((req, res, next) => {
    res.send("test");
});

// single post get
exports.post_single_get = asyncHandler((req, res, next) => {
    res.send("data");
});

// post like PUT
exports.post_like_put = asyncHandler((req, res, next) => {
    res.send("placeholder");
});

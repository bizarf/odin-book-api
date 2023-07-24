const Comment = require("../models/comment");
const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// makes a new comment on the post
exports.comment_create_post = [
    body("comment"),

    asyncHandler((req, res, next) => {
        res.send("placeholder");
    }),
];

// gets all comments for current post
exports.comments_get = asyncHandler((req, res, next) => {
    res.send("t");
});

// deletes comment
exports.comment_delete = asyncHandler((req, res, next) => {
    res.send("test");
});

// edit comment
exports.comment_edit_put = asyncHandler((req, res, next) => {
    res.send("a");
});

// like comment
exports.comment_like_put = asyncHandler((req, res, next) => {
    res.send("test");
});

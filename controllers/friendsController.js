const User = require("../models/user");
const asyncHandler = require("express-async-handler");

// get all friends
exports.friends_list_get = asyncHandler((req, res, next) => {
    res.send("test");
});

// get a list of pending friends
exports.friends_pending_list_get = asyncHandler((req, res, next) => {
    res.send("test");
});

// send a friend request POST
exports.friends_request_send_post = asyncHandler((req, res, next) => {
    res.send("test");
});

// accept friend request PUT
exports.friends_request_accept_put = asyncHandler((req, res, next) => {
    res.send("test");
});

// reject the friend request PUT
exports.friends_request_reject_put = asyncHandler((req, res, next) => {
    res.send("test");
});

// unfriend function
exports.friends_remove_friend_delete = asyncHandler((req, res, next) => {
    res.send("test");
});

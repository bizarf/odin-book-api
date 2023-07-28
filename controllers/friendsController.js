const User = require("../models/user");
const asyncHandler = require("express-async-handler");

// get all friends
exports.friends_list_get = asyncHandler(async (req, res, next) => {
    // fetch only the array of friends from the user object. populate is so that we have all the data from the users in that array, or else we'll only receive an array of ids
    const friendsList = await User.findById(req.user._id)
        .select("friends")
        .populate("friends")
        .exec();

    if (friendsList === null) {
        res.status(404).json({
            success: false,
            message: "Friends list not found",
        });
    } else {
        res.status(200).json({ success: true, friendsList });
    }
});

// get a list of pending friends
exports.friends_pending_list_get = asyncHandler(async (req, res, next) => {
    const pendingFriendsList = await User.findById(req.user._id)
        .select("pendingFriends")
        .populate("pendingFriends")
        .exec();

    if (pendingFriendsList === null) {
        res.status(404).json({ error: "Pending friends list not found" });
    } else {
        res.json(pendingFriendsList);
    }
});

// send a friend request POST
exports.friends_request_send_post = asyncHandler(async (req, res, next) => {
    const friend = await User.findById(req.param.friendId);

    if (!friend) {
        res.status(404).json({ success: false, message: "User not found" });
    }

    if (!friend.pendingFriends.includes(req.user._id)) {
        friend.pendingFriends.push(req.user._id);
    } else {
        res.status(400).json({
            success: false,
            message: "Friend request is already pending",
        });
    }

    const save = await friend.save();
    if (save) {
        res.status(200).json({
            success: true,
            message: "Friend request successfully sent",
        });
    } else {
        res.status(500).json({ message: "Failed to send request" });
    }
});

// accept friend request PUT
exports.friends_request_accept_put = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.pendingFriends.includes(req.params.friendId)) {
        res.status(404).json({
            success: false,
            message: "No pending friend request",
        });
    }

    user.pendingFriends.pull(req.params.friendId);
    user.friends.push(req.params.friendId);

    const save = await user.save();

    if (save) {
        res.status(200).json({
            success: true,
            message: "Friend request successfully accepted",
        });
    } else {
        res.status(500).json({ message: "Failed to accept request" });
    }
});

// reject the friend request PUT
exports.friends_request_reject_put = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.pendingFriends.includes(req.params.friendId)) {
        res.status(404).json({
            success: false,
            message: "No pending friend request",
        });
    }

    user.pendingFriends.pull(req.params.friendId);

    const save = await user.save();

    if (save) {
        res.status(200).json({
            success: true,
            message: "Friend request successfully rejected",
        });
    } else {
        res.status(500).json({ message: "Failed to reject request" });
    }
});

// unfriend function
exports.friends_remove_friend_delete = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.friends.includes(req.params.friendId)) {
        res.status(404).json({
            success: false,
            message: "User is not in friends list",
        });
    }

    user.friends.pull(req.params.friendId);

    const save = await user.save();

    if (save) {
        res.status(200).json({
            success: true,
            message: "Friend successfully removed",
        });
    } else {
        res.status(500).json({ message: "Failed to remove friend" });
    }
});

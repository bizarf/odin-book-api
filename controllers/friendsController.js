const User = require("../models/user");
const FriendRequest = require("../models/friendRequest");
const asyncHandler = require("express-async-handler");

// get all friends
exports.friends_list_get = asyncHandler(async (req, res, next) => {
    // fetch only the array of friends from the user object. populate is so that we have all the data from the users in that array, or else we'll only receive an array of ids
    const friendsList = await User.findById(req.user._id)
        .select("friends")
        .populate({ path: "friends", select: "firstname lastname" })
        .exec();

    if (friendsList === null) {
        return res.status(404).json({
            success: false,
            message: "Friends list not found",
        });
    } else {
        return res.status(200).json({ success: true, friendsList });
    }
});

// get a list of pending friends
exports.friends_pending_list_get = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return res
            .status(404)
            .json({ success: false, message: "User not found" });
    }

    // check if the user is the sender or the receiver. we also only want requests that are pending. if they are found, then we populate the sender and receiver fields with just the firstname and lastname of the users
    const existingRequest = await FriendRequest.find({
        $or: [{ sender: user._id }, { receiver: user._id }],
        status: "pending",
    })
        .populate({ path: "sender", select: "firstname lastname" })
        .populate({ path: "receiver", select: "firstname lastname" });

    if (existingRequest) {
        return res.status(200).json({ success: true, existingRequest });
    } else {
        return res.status(200).json({
            success: false,
            message: "No pending friend requests found",
        });
    }
});

// send a friend request POST
exports.friends_request_send_post = asyncHandler(async (req, res, next) => {
    const friend = await User.findById(req.params.friendId);
    const user = await User.findById(req.user._id);

    if (!friend || !user) {
        return res
            .status(404)
            .json({ success: false, message: "User not found" });
    }

    if (friend === user) {
        return res.status(400).json({
            success: false,
            message: "You cannot send a friend request to yourself",
        });
    }

    if (
        user.friends.includes(friend._id) ||
        friend.friends.includes(user._id)
    ) {
        return res.status(400).json({
            success: false,
            message: "Already friends",
        });
    }

    // check if the request is already in the database. use the $or operator to check whether the sender is the user or the friend.
    const existingRequest = await FriendRequest.findOne({
        $or: [
            { sender: user._id, receiver: friend._id },
            { sender: friend._id, receiver: user._id },
        ],
        status: { $in: ["pending", "accepted", "rejected"] },
    });

    if (existingRequest) {
        // if the previous request was rejected and the user tries to send another friend request, then we can just update the original request's status to pending
        if (existingRequest.status === "rejected") {
            existingRequest.status = "pending";
            await existingRequest.save();
            res.status(200).json({
                success: true,
                message: "Friend request successfully sent",
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Friend request already sent or accepted",
            });
        }
    } else {
        // make a new friend request object. don't need to add status as the default is pending
        const friendRequest = new FriendRequest({
            sender: user._id,
            receiver: friend._id,
            createdAt: new Date(),
        });

        // save to the database
        await friendRequest.save();

        return res.status(200).json({
            success: true,
            message: "Friend request successfully sent",
        });
    }
});

// accept friend request PUT
exports.friends_request_accept_put = asyncHandler(async (req, res, next) => {
    const friend = await User.findById(req.params.friendId);
    const user = await User.findById(req.user._id);

    if (!friend || !user) {
        return res
            .status(404)
            .json({ success: false, message: "User not found" });
    }

    if (
        user.friends.includes(friend._id) ||
        friend.friends.includes(user._id)
    ) {
        return res.status(400).json({
            success: false,
            message: "Already friends",
        });
    }

    // check if the request is already in the database. use the $or operator to check whether the sender is the user or the friend.
    const existingRequest = await FriendRequest.findOne({
        sender: friend._id,
        receiver: user._id,
        status: "pending",
    });

    if (existingRequest) {
        // change the status to accepted, push the friend id object into the user's friends array. push the user id object into the friend's friends array. save them afterwards
        existingRequest.status = "accepted";
        user.friends.push(friend._id);
        friend.friends.push(user._id);

        await existingRequest.save();
        await user.save();
        await friend.save();

        return res.status(200).json({
            success: true,
            message: "Friend request accepted",
        });
    } else {
        return res.status(404).json({
            success: false,
            message: "The friend request does not exist",
        });
    }
});

// reject the friend request PUT
exports.friends_request_reject_put = asyncHandler(async (req, res, next) => {
    const friend = await User.findById(req.params.friendId);
    const user = await User.findById(req.user._id);

    if (!friend || !user) {
        return res
            .status(404)
            .json({ success: false, message: "User not found" });
    }

    if (
        user.friends.includes(friend._id) ||
        friend.friends.includes(user._id)
    ) {
        return res.status(400).json({
            success: false,
            message: "Already friends",
        });
    }

    // check if the request is already in the database. use the $or operator to check whether the sender is the user or the friend.
    const existingRequest = await FriendRequest.findOne({
        sender: friend._id,
        receiver: user._id,
        status: "pending",
    });

    if (existingRequest) {
        // change the status to accepted, push the friend id object into the user's friends array. push the user id object into the friend's friends array. save them afterwards
        existingRequest.status = "rejected";

        await existingRequest.save();

        return res.status(200).json({
            success: true,
            message: "Friend request rejected",
        });
    } else {
        return res.status(404).json({
            success: false,
            message: "The friend request does not exist",
        });
    }
});

// unfriend function
exports.friends_remove_friend_delete = asyncHandler(async (req, res, next) => {
    const friend = await User.findById(req.params.friendId);
    const user = await User.findById(req.user._id);

    if (!friend || !user) {
        return res
            .status(404)
            .json({ success: false, message: "User not found" });
    }

    // check if the request is already in the database. use the $or operator to check whether the sender is the user or the friend.
    const existingRequest = await FriendRequest.deleteOne({
        $or: [
            { sender: user._id, receiver: friend._id },
            { sender: friend._id, receiver: user._id },
        ],
        status: "accepted",
    });

    if (existingRequest.deletedCount === 1) {
        // change the status to accepted, push the friend id object into the user's friends array. push the user id object into the friend's friends array. save them afterwards
        user.friends.pull(friend._id);
        friend.friends.pull(user._id);

        await user.save();
        await friend.save();

        return res.status(200).json({
            success: true,
            message: "Friend removed",
        });
    } else {
        return res.status(404).json({
            success: false,
            message: "You are not friends with that user",
        });
    }
});

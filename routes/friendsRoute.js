const express = require("express");
const router = express.Router();
const friendsController = require("../controllers/friendsController");
const passport = require("passport");

// get the friends list
router.get(
    "/get-friends",
    passport.authenticate(
        "jwt",
        { session: false },
        friendsController.friends_list_get
    )
);

// get a list of pending friends
router.get(
    "/get-pending-friends",
    passport.authenticate(
        "jwt",
        { session: false },
        friendsController.friends_pending_list_get
    )
);

// post method for sending friend requests
router.post(
    "/send-friend-request",
    passport.authenticate(
        "jwt",
        { session: false },
        friendsController.friends_request_send_post
    )
);

// accept friend request
router.put(
    "/friend-request-accept",
    passport.authenticate(
        "jwt",
        { session: false },
        friendsController.friends_request_accept_put
    )
);

// reject friend request
router.put(
    "/friend-request-reject",
    passport.authenticate(
        "jwt",
        { session: false },
        friendsController.friends_request_reject_put
    )
);

// unfriend DELETE
router.delete(
    "/unfriend",
    passport.authenticate(
        "jwt",
        { session: false },
        friendsController.friends_remove_friend_delete
    )
);

module.exports = router;

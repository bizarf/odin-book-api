const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const passport = require("passport");

// create a comment POST
router.post(
    "/post/:id/comment",
    passport.authenticate("jwt", { session: false }),
    commentController.comment_create_post
);

// edit comment PUT
router.put(
    "/post/:id/comments/:commentId",
    passport.authenticate("jwt", { session: false }),
    commentController.comment_edit_put
);

// comment like toggle PUT
router.put(
    "/post/:id/comments/:commentId/like",
    passport.authenticate("jwt", { session: false }),
    commentController.comment_like_toggle_put
);

// DELETE comment
router.delete(
    "/post/:id/comments/:commentId",
    passport.authenticate("jwt", { session: false }),
    commentController.comment_delete
);

// GET all comments on a post
router.get(
    "/post/:id/comments",
    passport.authenticate("jwt", { session: false }),
    commentController.comments_get
);

module.exports = router;

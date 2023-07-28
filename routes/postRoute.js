const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const passport = require("passport");

// single post GET
router.get(
    "/post/:id",
    passport.authenticate("jwt", { session: false }),
    postController.post_single_get
);

// new post POST
router.post(
    "/create-post",
    passport.authenticate("jwt", { session: false }),
    postController.post_create_post
);

// post edit PUT
router.put(
    "/post/:id",
    passport.authenticate("jwt", { session: false }),
    postController.post_edit_put
);

// post delete DELETE
router.delete(
    "/post/:id",
    passport.authenticate("jwt", { session: false }),
    postController.post_remove_delete
);

// post like toggle PUT
router.put(
    "/post/:id/like",
    passport.authenticate("jwt", { session: false }),
    postController.post_toggle_put
);

// all posts GET
router.get(
    "/posts",
    passport.authenticate("jwt", { session: false }),
    postController.posts_get
);

module.exports = router;

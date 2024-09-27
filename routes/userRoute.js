const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const passport = require("passport");

// user sign up post method
router.post("/sign-up", userController.user_signup_post);

// user login
router.post("/login", userController.user_login_post);

// demo user login
router.post("/login-demo", userController.user_demo_login_post);

// github login
router.get("/github-login", userController.user_github_login_get);

// github login callback after the user logs in
router.get(
    "/github-login/callback",
    userController.user_github_login_callback_get
);

// get user info based on id
router.get(
    "/profile/:userId",
    passport.authenticate("jwt", { session: false }),
    userController.user_profile_get
);

// update user info route
router.put(
    "/profile/:userId",
    passport.authenticate("jwt", { session: false }),
    userController.user_profile_update_put
);

module.exports = router;

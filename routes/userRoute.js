const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const passport = require("passport");

router.get("/", (req, res, next) => {
    res.json({ message: "Welcome to the API" });
});

// user sign up post method
router.post("/sign-up", userController.user_signup_post);

// user login
router.post("/login", userController.user_login_post);

// facebook login
router.get("/facebook-login", userController.user_facebook_login_get);

// facebook login callback after the use logins in?
router.get(
    "/facebook-login/callback",
    userController.user_facebook_login_callback_get
);

router.get("/logout", userController.user_logout_get);

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

// jwt refresh route
router.post(
    "/refresh-token",
    passport.authenticate("jwt", { session: false }),
    userController.user_refresh_JWT_post
);

module.exports = router;

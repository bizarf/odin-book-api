const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", (req, res, next) => {
    res.json({ message: "Welcome to the API" });
});

// user sign up post method
router.post("/sign-up", userController.user_signup_post);

// user login
router.get("/login", userController.user_login_get);

// facebook login
router.get("/facebook-login", userController.user_facebook_login_get);

// facebook login callback after the use logins in?
router.get(
    "/facebook-login/callback",
    userController.user_facebook_login_callback_get
);

router.get("/logout", userController.user_logout_get);

module.exports = router;

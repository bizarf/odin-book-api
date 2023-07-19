const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", (req, res, next) => {
    res.json({ message: "Welcome to the API" });
});

// user sign up post method
router.post("/sign-up", userController.user_signup_post);

// user login
router.post("/login");

module.exports = router;

const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
    // res.redirect("/api");
    res.json({ message: "Welcome to the API" });
});

module.exports = router;

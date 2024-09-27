const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res) {
    res.redirect("/api");
});

router.get("/api/", (req, res) => {
    res.json({ message: "Welcome to the API" });
});

module.exports = router;

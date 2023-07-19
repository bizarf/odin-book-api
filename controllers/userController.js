const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");

// user sign up post
exports.user_signup_post = [
    body("firstname", "You must enter a first name").trim().escape().notEmpty(),
    body("lastname", "You must enter a last name").trim().escape().notEmpty(),
    body("username")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("You must enter a username")
        .custom(async (value, { req, res }) => {
            const userExists = await User.findOne({
                username: value,
            }).exec();
            if (userExists) {
                throw new Error("User already exists");
            }
        }),
    body("password")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("You must enter a password")
        .isLength({ min: 8 })
        .withMessage("Your password must be at least 8 characters long"),
    body("confirmPassword")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("You must confirm the password")
        .isLength({ min: 8 })
        .withMessage("Your password must be at least 8 characters long")
        // custom validator to compare password and confirm password fields
        .custom(async (value, { req, res }) => {
            // wait for the password field or else there is no value to compare
            await req.body.password;
            if (req.body.password != value) {
                throw new Error("The passwords don't match");
            }
        }),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            if (err) {
                throw new Error(err);
            } else {
                // hashedPassword instead of req.body.password as we want to save the hashed password to the database
                const user = new User({
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    username: req.body.username,
                    password: hashedPassword,
                    joinDate: new Date(),
                });

                if (!errors.isEmpty()) {
                    res.status(400);
                    res.json({
                        errors: errors.array({ onlyFirstError: true }),
                    });
                } else {
                    await user.save();
                    res.json({ message: "Sign up was successful!" });
                }
            }
        });
    }),
];

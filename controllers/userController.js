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
        .custom(async (value) => {
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
        .custom(async (value, { req }) => {
            // wait for the password field or else there is no value to compare
            await req.body.password;
            if (req.body.password !== value) {
                throw new Error("The passwords don't match");
            }
        }),

    asyncHandler(async (req, res) => {
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
                    provider: "local",
                    joinDate: new Date(),
                    photo: "",
                });

                if (!errors.isEmpty()) {
                    return res.status(400).json({
                        errors: errors.array({ onlyFirstError: true }),
                    });
                } else {
                    await user.save();
                    return res
                        .status(201)
                        .json({ message: "Sign up was successful!" });
                }
            }
        });
    }),
];

exports.user_login_post = [
    body("username")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("You must enter a username")
        .custom(async (value) => {
            const userExists = await User.findOne({
                username: value,
            }).exec();

            if (!userExists) {
                throw new Error("User does not exist");
            }
        }),
    body("password")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("You must enter a password")
        .isLength({ min: 8 })
        .withMessage("Your password must be at least 8 characters long"),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(401).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            // req, res, next at the end or else passport authenticate will hang
            // passport local authentication. set session to false as I will use a jsonwebtoken instead
            passport.authenticate(
                "local",
                { session: false },
                (err, user, info) => {
                    if (err || !user) {
                        // set status to 401 (unauthorized) and send the error message as a json object
                        return res.status(401).json(info);
                    } else {
                        req.login(user, { session: false }, (err) => {
                            if (err) {
                                return res.send(err);
                            }

                            if (req.user) {
                                const token = jwt.sign(
                                    { user: user._id },
                                    process.env.JWT_SECRET,
                                    { expiresIn: "1d" }
                                );
                                return res.json({ token });
                            }
                        });
                    }
                }
            )(req, res, next);
        }
    }),
];

exports.user_demo_login_post = asyncHandler((req, res, next) => {
    req.body.username = process.env.DEMO_USERNAME;
    req.body.password = process.env.DEMO_PASSWORD;

    passport.authenticate("local", { session: false }, (err, user, info) => {
        if (err || !user) {
            // set status to 401 (unauthorized) and send the error message as a json object
            return res.status(401).json(info);
        } else {
            req.login(user, { session: false }, (err) => {
                if (err) {
                    return res.send(err);
                }

                if (req.user) {
                    const token = jwt.sign(
                        { user: user._id },
                        process.env.JWT_SECRET,
                        { expiresIn: "30d" }
                    );
                    return res.json({ token });
                }
            });
        }
    })(req, res, next);
});

// github login
exports.user_github_login_get = asyncHandler((req, res, next) => {
    passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

// after an attempt to login on github's website, the user is sent back here
exports.user_github_login_callback_get = asyncHandler((req, res, next) => {
    passport.authenticate(
        "github",
        {
            session: false,
            failureRedirect: "/api/github-login",
        },
        (err, user, info) => {
            if (err || !user) {
                return res.status(401).json(info);
            } else {
                // login the user with passport js, and then create and send a jwt
                req.login(user, { session: false }, (err) => {
                    if (err) {
                        return res.send(err);
                    }
                    const token = jwt.sign(
                        { user: user._id },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: "1d",
                        }
                    );
                    // res.json({ token });
                    return res.redirect(
                        `https://bizarf.github.io/odin-book-client/#/github-login?token=${token}`
                    );
                });
            }
        }
    )(req, res, next);
});

// fetches the user details based on the id provided in the url params
exports.user_profile_get = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId)
        .select("-password")
        .exec();

    if (user === null) {
        return res
            .status(404)
            .json({ success: false, message: "User not found" });
    } else {
        return res.json({ success: true, user });
    }
});

// update profile
exports.user_profile_update_put = [
    body("firstname", "You must enter a first name").trim().escape().notEmpty(),
    body("lastname", "You must enter a last name").trim().escape().notEmpty(),
    body("username")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("You must enter a username")
        .custom(async (value, { req }) => {
            const user = await User.findById(req.params.userId).exec();
            const userExists = await User.findOne({
                username: value,
            }).exec();

            if (userExists && user.username !== value) {
                throw new Error("User already exists");
            }
        }),
    body("photo")
        .trim()
        .if((value, { req }) => {
            return req.body.photo;
        })
        .trim()
        .isURL()
        .withMessage("Invalid URL"),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);

        const user = await User.findById(req.params.userId).exec();

        if (req.user._id.toString() !== req.params.userId) {
            return res.status(401).json({
                success: false,
                message: "You are not authorized to edit this user",
            });
        }

        const updatedUser = new User({
            _id: req.params.userId,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            username: req.body.username,
            provider: user.provider,
            joinDate: user.joinDate,
            photo: req.body.photo,
            friends: user.friends,
            type: user.type,
        });

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array({ onlyFirstError: true }),
            });
        } else {
            const save = await User.findByIdAndUpdate(
                req.params.userId,
                updatedUser,
                {}
            );

            if (save) {
                return res.status(200).json({
                    success: true,
                    message: "User was successfully edited",
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to save user",
                });
            }
        }
    }),
];

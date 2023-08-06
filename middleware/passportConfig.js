const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

// user model
const User = require("../models/user");

// passport localstrategy
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return done(null, false, { msg: "Incorrect username" });
            }
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    // password match. log user in
                    return done(null, user);
                } else {
                    return done(null, false, {
                        msg: "Incorrect password",
                    });
                }
            });
        } catch (err) {
            done(err);
        }
    })
);

// Json web token strategy. This will extract the token from the header. This is for routes that require a jwt to access
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        },
        // we need async as we have to wait for a jwt payload to exist or else routes will give a 500 status error even with a correct token
        async (jwt_payload, done) => {
            try {
                const user = await User.findById(jwt_payload.user._id);
                // if can't find user, then don't login. else set user to req.user
                if (!user) {
                    return done(null, false);
                } else {
                    return done(null, user);
                }
            } catch (err) {
                return done(err);
            }
        }
    )
);

// passport facebook strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            // callbackURL: "/api/facebook-login/callback",
            callbackURL:
                "https://odin-book-api-5r5e.onrender.com/api/facebook-login/callback",
            profileFields: ["id", "photos", "name"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // check if the user exists in the database
                const user = await User.findOne({
                    username: profile.id,
                    provider: profile.provider,
                });

                // deconstruct the _json result
                const { id, picture, last_name, first_name } =
                    await profile._json;

                // if the user isn't in the database, then make a new one and save the info
                if (!user) {
                    const newUser = new User({
                        firstname: first_name,
                        lastname: last_name,
                        username: id,
                        provider: profile.provider,
                        photo: picture.data.url || "",
                        joinDate: new Date(),
                    });
                    await newUser.save();
                    return done(null, newUser);
                }
                return done(null, user);
            } catch (err) {
                console.log(err);
                return done(null, false);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
// encrypt and decrypt passwords
const bcrypt = require("bcrypt");
// passport and strategies to handle auth
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");

// user model for passport js
const User = require("./models/user");

// route imports
const indexRouter = require("./routes/index");
const userRouter = require("./routes/userRoute");
const postRouter = require("./routes/postRoute");

const app = express();

// dotenv init
require("dotenv").config();
require("./mongo/mongoConfig");

// passport localstrategy
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });
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

// Json web token strategy. This will extract the token from the header
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        },
        // we need async as we have to wait for a jwt payload to exist or else routes will give a 500 status error even with a correct token
        async (jwt_payload, done) => {
            try {
                const user = await User.findOne({ id: jwt_payload.sub });
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

// passport facebook strategy (incomplete for now)
// passport.use(
//     new FacebookStrategy({
//         clientID: process.env.FACEBOOK_APP_ID,
//         clientSecret: process.env.FACEBOOK_APP_SECRET,
//         // callbackURL: ""
//     }),
//     function (accessToken, refreshToken, profile, cb) {
//         User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//             return cb(err, user);
//         });
//     }
// );

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// make express use compression, helmet, and cors
app.use(compression());
app.use(helmet());
app.use(cors());

// express rate limiter
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
});
app.use(limiter);

// how the app uses the routes
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send("error");
});

module.exports = app;

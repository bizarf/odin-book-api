const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");

// route imports
const indexRouter = require("./routes/index");
const userRouter = require("./routes/userRoute");
const postRouter = require("./routes/postRoute");
const commentRouter = require("./routes/commentRoute");
const friendsRouter = require("./routes/friendsRoute");

const app = express();

// dotenv init
require("dotenv").config();
require("./middleware/mongoConfig");
// passport js strategies
require("./middleware/passportConfig");

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
app.use("/api", userRouter);
app.use("/api", postRouter);
app.use("/api", commentRouter);
app.use("/api", friendsRouter);

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

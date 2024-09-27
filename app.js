const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const config = require("./utils/config");

// route imports
const indexRouter = require("./routes/index");
const userRouter = require("./routes/userRoute");
const postRouter = require("./routes/postRoute");
const commentRouter = require("./routes/commentRoute");
const friendsRouter = require("./routes/friendsRoute");

const app = express();

// passport js config
require("./utils/passportConfig");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());
app.use(helmet());
// cross origin resource sharing config
let corsOptions;
if (process.env.NODE_ENV === "development") {
    corsOptions = {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    };
} else {
    corsOptions = {
        origin: "https://bizarf.github.io",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    };
}
app.use(cors(corsOptions));

// express rate limiter
const { rateLimit } = require("express-rate-limit");
const limiter = rateLimit({
    // 1 minute
    windowMs: 1 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
app.use(limiter);

config.connectToDatabase();

// routes
app.use("/", indexRouter);
app.use("/api", userRouter);
app.use("/api", postRouter);
app.use("/api", commentRouter);
app.use("/api", friendsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404, "Error 404: Page not found"));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;

import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session from "express-session";
import { createClient } from "redis";
import passport from "passport";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import signupRouter from "./routes/signup.js";
import bodyParser from "body-parser";
import multer from "multer";
import { RedisStore } from "connect-redis";

const version = 0.1;
console.info("------------------------------------------------");
console.info(`-- serviceapi v${version}`);
console.info("------------------------------------------------");

// Initialize redis client and store
const redisClient = createClient({
  url: process.env.REDIS_CONN_STRING,
});

try {
  redisClient.connect();
} catch (e) {
  console.error("Connection to redis failed - check env var REDIS_CONN_STRING");
}

const redisStore = new RedisStore({
  client: redisClient,
  prefix: "auth:",
});

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

var app = express();
const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    // no larger than 30mb.
    fileSize: 30 * 1024 * 1024,
  },
});
app.disable("x-powered-by");
app.use(multerMid.single("file"));
app.use(bodyParser.urlencoded({ extended: false, limit: "30mb" }));
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// Initialize session storage.
app.use(
  session({
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
  })
);
app.use(passport.authenticate("session"));

app.use("/", authRouter);
app.use("/", signupRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).json({ error: "Not Found" });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // send error response as JSON
  res.status(err.status || 500);
  res.json({ error: res.locals.message });
});

export default app;

import { postgraphile } from "postgraphile";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";
import PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector";
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createClient } from "redis";
import passport from "passport";
import bodyParser from "body-parser";
import cors from "cors";

const version = 0.1;
console.info("------------------------------------------------");
console.info(`-- api v${version}`);
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

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, user);
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

var app = express();
// Setup CORS // process.env.CORS.split(","),
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  accessControlAllowOrigin: "*",
  accessControlAllowCredentials: true,
};
app.use(cors(corsOptions));

app.disable("x-powered-by");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize session storage.
app.use(
  session({
    store: redisStore,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
  })
);
app.use(passport.authenticate("session"));

// Add this before your routes
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);

  // Log headers if you want to debug auth issues
  if (req.url.includes("/session.json")) {
    console.log("Headers:", {
      cookie: req.headers.cookie ? "Present" : "Missing",
      authorization: req.headers.authorization ? "Present" : "Missing",
    });
    console.log(
      "Auth status:",
      req.isAuthenticated ? req.isAuthenticated() : "No auth method"
    );
  }

  // Log response
  res.on("finish", () => {
    console.log(
      `[${timestamp}] ${req.method} ${req.url} - Status: ${res.statusCode}`
    );
  });

  next();
});

app.get(
  "/graphql/session.json",
  express.json(),
  async function (req, res, next) {
    if (!req.session?.passport?.user) {
      return res.json({
        error: "No session",
      });
    }
    return res.json({
      user: req.session.passport.user,
    });
  }
);

app.get("/graphql/test.json", express.json(), async function (req, res, next) {
  return res.json({
    test: "test",
  });
});

// Add authentication check middleware for Postgraphile
const pgAuthMiddleware = (req, res, next) => {
  if (!req.session?.passport?.user) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  if (!req.session?.passport?.user) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
  next();
};

// Apply the middleware before Postgraphile routes
app.use("/graphql", pgAuthMiddleware);

// Run postgraphile
const connectURL = `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
app.use(
  postgraphile(connectURL, "public", {
    pgSettings: (req) => {
      const settings = {
        role: process.env.POSTGRAPHILE_API_DEFAULT_ROLE,
        statement_timeout: "3000",
      };
      if (req.session?.passport?.user) {
        settings["jwt.claims.email"] = req.session.passport.user.email;
        const user = req.session.passport.user;

        // Set the user and permission IDs
        // Note JWT is deprecated
        settings["jwt.claims.userId"] = user.id;
        settings["jwt.claims.permissionId"] = user.permissionId;

        // Set session
        settings["session.userId"] = user.id;
        settings["session.permissionId"] = user.permissionId;
      }
      return settings;
    },
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    appendPlugins: [ConnectionFilterPlugin, PgSimplifyInflectorPlugin],
    dontSwallowErrors: true,
    enableCors: true,
    additionalGraphQLContextFromRequest: async (req, res) => {
      if (!req.session?.passport?.user) {
        throw new Error("Not authenticated");
      }

      return {
        jwt: {
          claims: {
            email: req.session.passport.user.email,
          },
        },
      };
    },
  })
);

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

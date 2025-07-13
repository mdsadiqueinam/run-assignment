#!/usr/bin/env node

import "dotenv/config";
import app from "./app.js";
import http from "http";
/**
 * Check required environment variables.
 */
function checkEnvVariables() {
  let requiredEnvVars = [
    "CORS",
    "DB_DATABASE",
    "DB_HOST",
    "DB_PASS",
    "DB_PORT",
    "DB_USER",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SESSION_SECRET",
    "PORT",
    "REDIS_CONN_STRING",
    "SERVER_URL",
    "GOOGLE_API_TOKEN_JSON",
    "SYNC_SERVER",
  ];

  const unsetEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (unsetEnvVars.length > 0) {
    console.error(
      `Error: Required environment variables are not set: ${unsetEnvVars.join(
        ", "
      )}`
    );
    process.exit(1);
  }
}

// Call the function to check environment variables
checkEnvVariables();

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " needs elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.info("Listening on " + bind);
}

/**
 * @fileoverview This script generates a new token.json file for the Gmail API.
 * It uses the local-auth library to authenticate with the Gmail API and save
 * the credentials to a file.
 *
 * The token.json file is used to authenticate with the Gmail API.
 *
 * Instructions:
 * To get the credentials.json file, visit https://console.cloud.google.com/apis/credentials
 * and create a new OAuth client ID.
 *
 * Save that file as credentials.json here. Then run this script.
 * It will create a new token.json file in the same directory.
 */

import fs from "fs/promises";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import MailComposer from "nodemailer/lib/mail-composer/index.js";

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function createCredentials() {
  let client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (!client.credentials) {
    throw new Error("*** Error: Error generating credentials ***");
  }
  await saveCredentials(client);
  console.info("*** Success: Credentials saved ***");
  return client;
}

async function done(auth) {
  console.log("Finished - New token.json file created");
}

createCredentials().then(done).catch(console.error);

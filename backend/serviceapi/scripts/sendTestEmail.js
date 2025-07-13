// Usage: node sendTestEmail.js <email>
// This script sends a test email to the specified email address using Gmail API.
// Ensure that GOOGLE_API_TOKEN_JSON environment variable is set with valid credentials.

import "dotenv/config";
import process from "process";
import { google } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer/index.js";

const encodeMessage = (message) => {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const createMail = async (options) => {
  const mailComposer = new MailComposer(options);
  const message = await mailComposer.compile().build();
  return encodeMessage(message);
};

const sendMail = async (auth, options) => {
  const gmail = google.gmail({ version: "v1", auth });
  const rawMessage = await createMail(options);
  const { data: { id } = {} } = await gmail.users.messages.send({
    userId: "me",
    resource: {
      raw: rawMessage,
    },
  });
  return id;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

async function sendTestEmail(auth, toEmail) {
  console.log("Testing email");
  const options = {
    from: "notifications@wiseboxs.com",
    to: toEmail,
    subject: "Hello from wiseboxs.com",
    text: "This is a test email sent using sendTestEmail.js",
    html: "<p>🙋🏻‍♀️ This is a test email sent using sendTestEmail.js</p>",
  };
  const messageId = await sendMail(auth, options);

  console.log("Mail was sent", messageId);
}

async function init() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("No email address provided.");
    console.log("Usage: node sendTestEmail.js <email>");
    process.exit(1);
  }

  const toEmail = args[0];
  if (!validateEmail(toEmail)) {
    console.error("Invalid email address.");
    process.exit(1);
  }

  if (!process.env.GOOGLE_API_TOKEN_JSON) {
    throw new Error("GOOGLE_API_TOKEN_JSON is not set");
  }

  const tokenJson = JSON.parse(process.env.GOOGLE_API_TOKEN_JSON);
  if (
    !tokenJson.client_id ||
    !tokenJson.client_secret ||
    !tokenJson.refresh_token
  ) {
    throw new Error("GOOGLE_API_TOKEN_JSON is not valid");
  }

  const auth = google.auth.fromJSON(tokenJson);

  await sendTestEmail(auth, toEmail);
}

init();

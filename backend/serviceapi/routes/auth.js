import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oidc";
import sql from "../sql.js";
import {
  requireAuth,
  hydratePermissions,
  getUserFromEmail,
} from "../utils/permissions.js";

var router = express.Router();

////////////////////////////////////////////////////////////
/// Google strategy
////////////////////////////////////////////////////////////
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}oauth2/redirect/google`,
      scope: ["profile", "email"],
    },
    async function verify(issuer, profile, cb) {
      try {
        // Validate environment variables
        if (
          !process.env.GOOGLE_CLIENT_ID ||
          !process.env.GOOGLE_CLIENT_SECRET ||
          !process.env.SERVER_URL
        ) {
          throw new Error(
            "Missing required environment variables for Google OAuth."
          );
        }

        // Validate email existence
        if (!profile.emails || profile.emails.length === 0) {
          throw new Error("Google profile does not contain an email address.");
        }

        const userEmail = profile.emails[0].value;
        let user = await getUserFromEmail(userEmail, {
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
        });

        return cb(null, user);
      } catch (error) {
        console.error("Unexpected authentication error:", error);
        return cb(error, null);
      }
    }
  )
);

// URL to start Google login
router.get(
  "/auth/login/federated/google",
  passport.authenticate("google", {
    prompt: "select_account",
  })
);

function handleUserRedirection(req, res) {
  // If user ID is null, redirect to signup page for user registration
  if (req.user.id === null) {
    res.redirect(`${process.env.SERVER_URL}signup`);
  } else {
    // Redirect to the main dashboard after successful authentication
    res.redirect(`${process.env.SERVER_URL}home`);
  }
}

// URL to handle Google login callback
router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    failureRedirect: `${process.env.SERVER_URL}signup`,
  }),
  (req, res) => {
    handleUserRedirection(req, res);
  }
);

////////////////////////////////////////////////////////////
/// Other
////////////////////////////////////////////////////////////

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

router.get("/auth/signout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy();
    res.redirect("/signin");
  });
});

router.put("/auth/signout.json", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy();
    res.json({ success: true, message: "Successfully signed out" });
  });
});

router.get(
  ["/auth/hydrateSession.json"],
  requireAuth,
  async function (req, res) {
    // Clone the current user session
    const originalSession = JSON.parse(
      JSON.stringify(req.session.passport.user)
    );

    // Store impersonator info if it exists
    const impersonator = originalSession.impersonator;

    await hydratePermissions(req, res);

    // Restore impersonator info if it existed
    if (impersonator) {
      req.session.passport.user.impersonator = impersonator;
    }

    // Compare the original user with the updated session user
    const updatedSession = req.session.passport.user;
    const hasUpdated =
      JSON.stringify(originalSession) !== JSON.stringify(updatedSession);

    if (!hasUpdated) {
      // Send 304 Not Modified if no changes
      return res.status(304).end();
    }

    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        session: updatedSession,
      })
    );
  }
);

router.get(
  ["/auth/session.json"],
  requireAuth,
  express.json(),
  function (req, res) {
    const session = req.session.passport.user;

    return res.json({
      session: session,
    });
  }
);

router.get(
  ["/auth/impersonate"],
  requireAuth,
  express.json(),
  async function (req, res) {
    // Security check: Ensure the current user has a @ruhcare.com email
    if (!req.session.passport.user.email.endsWith("@ruhcare.com")) {
      return res.status(400).json({ message: "Not authorized" });
    }

    // Check if an ID is passed in the query
    const userId = req.query.id;
    if (userId) {
      // Fetch the user details for the given ID
      const userResult = await sql`
        SELECT u.id, u.email, u.first_name, u.last_name
        FROM users u
        WHERE u.id = ${userId} AND u.state_id = 'ACTIVE'
      `;

      if (userResult.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = await getUserFromEmail(userResult[0].email, {
        firstName: userResult[0].first_name,
        lastName: userResult[0].last_name,
      });

      // Store the returnUrl and original user info in an impersonator object
      const returnUrl = req.query.returnUrl || "/";
      const originalUser = req.session.passport.user;
      user.impersonator = {
        returnUrl: returnUrl,
        originalEmail: originalUser.email,
        originalId: originalUser.id,
        originalFirstName: originalUser.firstName || originalUser.first_name,
        originalLastName: originalUser.lastName || originalUser.last_name,
      };

      // Update the server session with latest details
      req.session.passport.user = user;
      req.session.save();

      // Redirect to the dashboard
      return res.redirect(`${process.env.SERVER_URL}home`);
    }

    // Expect an email param
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: "Email param is required" });
    }

    // Update the SQL query to fetch user fields only
    const usersResult = await sql`
      SELECT u.id, u.email, u.first_name, u.last_name,
             u.job_title, u.language_id, u.user_permission_id,
             u.time_zone, u.integration_google_calendar_setup
      FROM users u
      WHERE u.email = ${email} AND u.state_id = 'ACTIVE'
    `;

    // Render HTML page with Tailwind CSS
    let html = `
      <html>
      <head>
        <title>Impersonate Users</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 p-6">
        <h1 class="text-2xl font-bold mb-4">Active users with email ${email}</h1>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">First Name</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">Last Name</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">Email</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">Job Title</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">Language ID</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">User Permission ID</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">User Time Zone</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">Google Calendar Setup</th>
                <th class="py-2 px-4 bg-gray-200 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
    `;

    usersResult.forEach((user) => {
      html += `
        <tr class="border-b">
          <td class="py-2 px-4">${user.first_name}</td>
          <td class="py-2 px-4">${user.last_name}</td>
          <td class="py-2 px-4">${user.email}</td>
          <td class="py-2 px-4">${user.job_title}</td>
          <td class="py-2 px-4">${user.language_id}</td>
          <td class="py-2 px-4">${user.user_permission_id}</td>
          <td class="py-2 px-4">${user.time_zone}</td>
          <td class="py-2 px-4">${
            user.integration_google_calendar_setup ? "Yes" : "No"
          }</td>
          <td class="py-2 px-4">
            <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onclick="impersonateUser('${
              user.id
            }', '${req.query.returnUrl || "/"}')">Impersonate</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
        <script>
          function impersonateUser(userId, returnUrl) {
            const encodedReturnUrl = encodeURIComponent(returnUrl);
            window.location.href = '/auth/impersonate?id=' + userId + '&returnUrl=' + encodedReturnUrl;
          }
        </script>
      </body>
      </html>
    `;

    res.send(html);
  }
);

// Add a new route for returning from impersonation
router.get(
  ["/auth/return-from-impersonation"],
  requireAuth,
  async function (req, res) {
    const currentUser = req.session.passport.user;

    // Check if the current user is being impersonated
    if (!currentUser.impersonator) {
      return res
        .status(400)
        .json({ message: "Not currently impersonating a user" });
    }

    // Get the original admin user by email
    const originalEmail = currentUser.impersonator.originalEmail;
    const returnUrl = currentUser.impersonator.returnUrl || "/";

    // Get the original admin user
    const originalUser = await getUserFromEmail(originalEmail);

    // Update the session to restore the original admin user
    req.session.passport.user = originalUser;
    req.session.save();

    // Redirect to the return URL
    res.redirect(returnUrl);
  }
);

export default router;

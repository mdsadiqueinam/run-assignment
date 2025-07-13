import sql from "../sql.js";

// Add authentication check middleware
export async function requireAuth(req, res, next) {
  if (!req.session?.passport?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function getUserFromEmail(userEmail, profile = {}) {
  let user;

  // Check if user exists in the database
  let matchingUsers;
  try {
    matchingUsers = await sql`
      SELECT u.id AS userid, u.first_name, u.last_name, u.email
      FROM users u
      LEFT OUTER JOIN sync s ON s.user_id = u.id
      WHERE LOWER(u.email) = LOWER(${userEmail})
        AND u.state_id = 'ACTIVE'
      ORDER BY s.updated_at DESC
      `;
  } catch (dbError) {
    console.error("Database query failed:", dbError);
    throw dbError;
  }

  // If user not found, create a new user entry or return basic profile information
  if (matchingUsers.length === 0) {
    return {
      firstName: profile?.firstName || "Unknown",
      lastName: profile?.lastName || "Unknown",
      email: userEmail,
      id: null, // Will be set when user is created in database
    };
  }

  // User already exists, return the existing user
  user = {
    id: matchingUsers[0].userid,
    firstName: matchingUsers[0].first_name,
    lastName: matchingUsers[0].last_name,
    email: userEmail,
  };

  return user;
}

export async function hydratePermissions(req, _res) {
  // Lookup user again from email in session
  const updatedUser = await getUserFromEmail(req.session.passport.user.email, {
    firstName: req.session.passport.user.firstName,
    lastName: req.session.passport.user.lastName,
  });

  // Update the session with latest details
  req.session.passport.user = updatedUser;
  req.session.save();

  return updatedUser;
}
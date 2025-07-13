import express from "express";
import sql from "../sql.js";
import { requireAuth, hydratePermissions } from "../utils/permissions.js";

var router = express.Router();

router.put(
  ["/services/signup.json"],
  requireAuth,
  express.json(),
  async function (req, res) {
    try {
      let { timeZone, phone, permissionId } = req.body;

      // Validate timeZone
      const validTimeZones = Intl.supportedValuesOf("timeZone");

      if (!timeZone?.trim()) {
        return res.status(400).json({
          message: "Time zone is required and cannot be empty",
        });
      }

      if (!validTimeZones.includes(timeZone.trim())) {
        console.warn(
          `Invalid time zone provided: ${timeZone}. Defaulting to "America/New_York".`
        );
        timeZone = "America/New_York";
      }

      // Validate phone (optional but if provided, should be valid)
      if (phone && typeof phone !== "string") {
        return res.status(400).json({
          message: "Phone number must be a string",
        });
      }

      // Validate permissionId (optional but if provided, should be valid)
      if (permissionId && typeof permissionId !== "string") {
        return res.status(400).json({
          message: "Permission ID must be a string",
        });
      }

      if (!req.session?.passport?.user?.email) {
        return res.status(401).json({
          message: "User session is invalid",
        });
      }

      // Check if user already exists in database
      const existingUser = await sql`
        SELECT id FROM users
        WHERE LOWER(email) = LOWER(${req.session.passport.user.email})
        AND state_id = 'ACTIVE'
        LIMIT 1
      `.catch((error) => {
        console.error("Database error checking existing user:", error);
        throw new Error("Failed to check user existence");
      });

      if (existingUser.length > 0) {
        return res.status(409).json({
          message: "User already exists in the system",
        });
      }

      // Create new user
      const result = await sql`
        INSERT INTO users (
          email,
          first_name,
          last_name,
          phone,
          time_zone,
          permission_id,
          state_id,
          updated_at
        )
        VALUES (
          ${req.session.passport.user.email},
          ${req.session.passport.user.firstName || ""},
          ${req.session.passport.user.lastName || ""},
          ${phone || null},
          ${timeZone},
          ${permissionId || null},
          'ACTIVE',
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `.catch((error) => {
        console.error("Database error creating user:", error);
        throw new Error("Failed to create user");
      });

      // Hydrate permissions after successful user creation
      await hydratePermissions(req, res).catch((error) => {
        console.error("Failed to hydrate permissions:", error);
        // Continue since user was created successfully
      });

      return res.json({
        message: "User created successfully",
        user_id: result[0].id,
      });
    } catch (error) {
      console.error("Error in signup process:", error);
      return res.status(500).json({
        message: error.message || "Internal server error",
        error:
          process.env.NODE_ENV !== "production" ? error.toString() : undefined,
      });
    }
  }
);

export default router;

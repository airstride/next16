import { NextResponse } from "next/server";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { Permissions } from "@/types/enums";
import { getUser } from "@/utils/propelAuth";

/**
 * Get user display name by ID
 * @description Returns just the display name of a user (lightweight endpoint for UI display)
 * @params id - Target user ID from URL parameter
 * @response { name: string }
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDB(async (_req, { params }) => {
    try {
      // Extract target user ID from URL parameter [id]
      const { id: targetUserId } = await params;

      if (!targetUserId) {
        return NextResponse.json({ name: "—" }, { status: 200 });
      }

      // Get target user from PropelAuth
      const propelUser = await getUser(targetUserId);

      if (!propelUser) {
        return NextResponse.json({ name: targetUserId.slice(-8) }, { status: 200 });
      }

      // Build full name
      const fullName = `${propelUser.firstName || ""} ${propelUser.lastName || ""}`.trim();
      const displayName = fullName || propelUser.email || targetUserId.slice(-8);

      return NextResponse.json({ name: displayName }, { status: 200 });
    } catch (error) {
      console.warn("Failed to fetch user name:", error);
      // Return generic fallback on error
      return NextResponse.json({ name: "—" }, { status: 200 });
    }
  }),
  {
    requiredPermissions: [Permissions.READ_DEALS],
  }
);

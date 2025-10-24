import { NextResponse } from "next/server";
import { InviteUserSchema } from "@/app/api/_validations/auth/invite.user.validation";
import { withAuth, withValidation } from "@/shared/api";
import { Permissions } from "@/shared/auth/types";
import { createErrorResponse } from "@/shared/api/response.helpers";
import { inviteUser } from "@/shared/auth/auth.service";

/**
 * Invite a user to an organization
 * @description Invites a user to join an organization with specified role and additional roles.
 * @body InviteUserZodSchema
 * @response Success message with invitation details
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withValidation(InviteUserSchema, async (_req, {}, { body }) => {
    try {
      // org_id in body is the PropelAuth org ID
      const result = await inviteUser({
        email: body.email,
        orgId: body.org_id,
        role: body.role || "",
        additionalRoles: body.additional_roles || [],
      });

      if (!result) {
        return createErrorResponse(new Error("Failed to invite user"));
      }

      return NextResponse.json({
        message: "User invitation sent successfully",
        success: result,
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.WRITE_INVITE],
  }
);

import { NextResponse } from "next/server";
import { RevokeInviteSchema } from "@/app/api/_validations/auth/invite.user.validation";
import { withAuth, withValidation } from "@/shared/api";
import { Permissions } from "@/shared/auth/types";
import { createErrorResponse } from "@/shared/api/response.helpers";
import { revokeInvite } from "@/shared/auth/auth.service";

/**
 * Revoke an invite
 * @description Revokes an invite to join an organization.
 * @body RevokeInviteZodSchema
 * @response Success message with invitation details
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withValidation(RevokeInviteSchema, async (_req, {}, { body }) => {
    try {
      // org_id in body is the PropelAuth org ID
      const result = await revokeInvite({
        inviteeEmail: body.invitee_email,
        orgId: body.org_id,
      });

      if (!result) {
        return createErrorResponse(new Error("Failed to revoke invite"));
      }

      return NextResponse.json({
        message: "Invite revoked successfully",
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

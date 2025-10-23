import { NextResponse } from "next/server";
import { InviteUserZodSchema } from "@/app/api/_validations/auth/invite.user.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withValidation } from "@/lib/zod/validation";
import { organisationService } from "@/services/organisation.service";
import { Permissions } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";
import { inviteUser } from "@/utils/propelAuth";

/**
 * Invite a user to an organization
 * @description Invites a user to join an organization with specified role and additional roles.
 * @body InviteUserZodSchema
 * @response Success message with invitation details
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
    withValidation(InviteUserZodSchema, async (_req, {}, { body, activeOrgId }) => {
      try {
        const org = await organisationService.find(body.org_id, activeOrgId);
        if (!org) {
          return createErrorResponse(new Error("Organisation not found"));
        }

        const result = await inviteUser({
          email: body.email,
          orgId: org.propel_auth_org_id,
          role: body.role,
          additionalRoles: body.additional_roles,
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
    })
  ),
  {
    requiredPermissions: [Permissions.WRITE_INVITE],
  }
);

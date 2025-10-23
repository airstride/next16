import { NextResponse } from "next/server";
import { RevokeInviteZodSchema } from "@/app/api/_validations/auth/invite.user.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withValidation } from "@/lib/zod/validation";
import { organisationService } from "@/services/organisation.service";
import { partnerContactService } from "@/services/partner.contact.service";
import { Permissions } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";
import { NotFoundError } from "@/types/errors";
import { revokeInvite } from "@/utils/propelAuth";

/**
 * Revoke an invite
 * @description Revokes an invite to join an organization.
 * @body RevokeInviteZodSchema
 * @response Success message with invitation details
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withDB(
    withValidation(RevokeInviteZodSchema, async (_req, {}, { body, activeOrgId }) => {
      try {
        // Get the organization to retrieve the PropelAuth org ID
        const org = await organisationService.find(body.org_id, activeOrgId);
        if (!org) {
          throw new NotFoundError("Organisation not found");
        }

        const result = await revokeInvite({
          inviteeEmail: body.invitee_email,
          orgId: org.propel_auth_org_id,
        });

        if (!result) {
          return createErrorResponse(new Error("Failed to revoke invite"));
        }
        const params = new URLSearchParams();
        params.append("search", body.invitee_email);
        const contact = await partnerContactService.getPartnerContacts(params);
        if (contact.data.length > 0) {
          const contactId = contact.data[0].id;
          await partnerContactService.deleteById(contactId);
        }

        return NextResponse.json({
          message: "Invite revoked successfully",
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

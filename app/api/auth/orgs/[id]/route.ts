import { NextResponse } from "next/server";
import {
  UpdateOrganisationRequest,
  UpdateOrganisationZodSchema,
} from "@/app/api/_validations/auth/create.organisation.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withOrgValidation } from "@/hooks/withOrgValidation";
import { withPatchValidation } from "@/lib/zod/validation";
import { organisationService } from "@/services/organisation.service";
import { Permissions } from "@/types/enums";
import { NotFoundError } from "@/types/errors";
import { createErrorResponse } from "@/utils/api.error.handler";

/**
 * Get organisation by ID
 * @description Returns a single organisation combining PropelAuth and database data
 * @response OrganisationResponse
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDB(
    withOrgValidation(async (_req, _params, { orgId, activeOrgId }) => {
      try {
        const organisation = await organisationService.find(orgId, activeOrgId);

        return NextResponse.json(organisation);
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  ),
  {
    requiredPermissions: [Permissions.READ_ORGANISATIONS],
  }
);

/**
 * Update organisation
 * @description Updates an existing organisation. Supports both JSON Patch (RFC 6902) and regular JSON object updates.
 * Note: PropelAuth fields are updated in PropelAuth, additional fields are updated in our database.
 * @body UpdateOrganisationRequest | JsonPatchOperation[]
 * @response OrganisationResponse
 * @auth bearer
 * @openapi
 */
export const PATCH = withAuth(
  withDB(
    withOrgValidation(
      withPatchValidation(
        UpdateOrganisationZodSchema,
        async (_req, _params, { user, body, orgId, activeOrgId }) => {
          try {
            const dbResult = await organisationService.update(
              orgId,
              activeOrgId,
              user.userId,
              body as UpdateOrganisationRequest
            );

            if (!dbResult) {
              throw new NotFoundError("Organisation not found in database");
            }

            return NextResponse.json(dbResult, { status: 200 });
          } catch (error) {
            return createErrorResponse(error);
          }
        }
      )
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_ORGANISATIONS],
  }
);

/**
 * Delete organisation
 * @description Deletes an organisation from both PropelAuth and our database
 * @response Success message
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withDB(
    withOrgValidation(async (_req, _params, { orgId, activeOrgId }) => {
      try {
        await organisationService.delete(orgId, activeOrgId);

        return new NextResponse(null, { status: 204 });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  ),
  {
    requiredPermissions: [Permissions.WRITE_ORGANISATIONS],
  }
);

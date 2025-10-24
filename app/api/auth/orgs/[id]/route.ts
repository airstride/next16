import { NextResponse } from "next/server";
import {
  UpdateOrganisationRequest,
  UpdateOrganisationSchema,
} from "@/app/api/_validations/organisations/organisation.validation";
import { withAuth } from "@/shared/api/hofs/withAuth";
import { withOrgValidation } from "@/shared/api/hofs/withOrgValidation";
import { withPatchValidation } from "@/shared/api/hofs/withValidation";
import {
  getOrganisation,
  updateOrganisation,
  deleteOrganisation,
} from "@/shared/auth/auth.service";
import { Permissions } from "@/shared/auth/types";
import { NotFoundError } from "@/shared/utils/errors";
import { createErrorResponse } from "@/shared/api/response.helpers";

/**
 * Get organisation by ID
 * @description Returns a single organisation combining PropelAuth and database data
 * @response OrganisationResponse
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withOrgValidation(async (_req, _params, { orgId }) => {
    try {
      // Get organization from PropelAuth
      const organisation = await getOrganisation(orgId);

      if (!organisation) {
        throw new NotFoundError("Organization not found");
      }

      return NextResponse.json(organisation);
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
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
  withOrgValidation(
    withPatchValidation(
      UpdateOrganisationSchema,
      async (_req, _params, { body, orgId }) => {
        try {
          // Update organization in PropelAuth
          const updated = await updateOrganisation(
            orgId,
            body as UpdateOrganisationRequest
          );

          if (!updated) {
            throw new NotFoundError("Organisation not found");
          }

          return NextResponse.json(updated, { status: 200 });
        } catch (error) {
          return createErrorResponse(error);
        }
      }
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
  withOrgValidation(async (_req, _params, { orgId }) => {
    try {
      // Delete organization from PropelAuth
      await deleteOrganisation(orgId);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.WRITE_ORGANISATIONS],
  }
);

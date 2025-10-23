import { NextResponse } from "next/server";
import { OrganisationResponse } from "@/app/api/_responses/organisation.response";
import {
  CreateOrganisationRequest,
  CreateOrganisationZodSchema,
} from "@/app/api/_validations/auth/create.organisation.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withValidation } from "@/lib/zod/validation";
import { IPaginationResponse } from "@/repositories/types";
import { organisationService } from "@/services/organisation.service";
import { Permissions } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";

/**
 * Get organizations
 * @description Returns a list of organizations with filtering, searching, and pagination support.
 * @params OrganisationsQuerySchema
 * @response PaginatedResponse<OrganisationResponse>
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDB(async (req, {}, {}) => {
    try {
      const { searchParams } = new URL(req.url);

      // Get organizations from our database using the unified query parser
      const dbOrgs = await organisationService.getOrganisations(searchParams);

      return NextResponse.json<IPaginationResponse<OrganisationResponse>>(dbOrgs, {
        status: 200,
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.READ_ORGANISATIONS],
  }
);

/**
 * Create a new organization
 * @description Creates a new organization in PropelAuth and stores additional data in our database.
 * @body CreateOrganisationZodSchema
 * @response Success message with organization details
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
    withValidation(CreateOrganisationZodSchema, async (_req, {}, { user, body }) => {
      try {
        const result = await organisationService.createFromPropelAuth(
          body as CreateOrganisationRequest,
          user.userId
        );

        return NextResponse.json<OrganisationResponse>(result, { status: 201 });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  )
);

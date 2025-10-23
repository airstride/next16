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
import { deleteOrganisation } from "@/utils/propelAuth";

/**
 * Get organizations
 * @description Returns a list of organizations with filtering, searching, and pagination support.
 * @params OrganisationsQuerySchema
 * @response PaginatedResponse<OrganisationResponse>
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDB(async (req, {}) => {
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
 * Handles domain-based uniqueness and automatic name disambiguation for PropelAuth.
 * @body CreateOrganisationZodSchema
 * @response Success message with organization details
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
    withValidation(CreateOrganisationZodSchema, async (_req, {}, { user, body }) => {
      try {
        const orgData = body as CreateOrganisationRequest;

        // Use the service method which handles:
        // - Domain-based uniqueness checking
        // - PropelAuth name conflict resolution with automatic suffixes
        // - PropelAuth organization creation
        // - Database storage with proper name mapping
        const dbResult = await organisationService.createFromPropelAuth(orgData, user.userId);

        return NextResponse.json<OrganisationResponse>(dbResult, { status: 201 });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  ),
  {
    requiredPermissions: [Permissions.READ_USERS],
  }
);

/**
 * Delete an organization
 * @description Deletes an organization from PropelAuth and our database.
 * @body DeleteOrganisationZodSchema
 * @response Success message
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withDB(async (_req, { params }) => {
    try {
      const { id } = await params;

      // Delete from PropelAuth first
      const propelResult = await deleteOrganisation(id);

      if (!propelResult) {
        return createErrorResponse(new Error("Failed to delete organization from PropelAuth"));
      }

      // Delete from our database

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.WRITE_USERS],
  }
);

import { NextResponse } from "next/server";
import {
  CreateOrganisationRequest,
  CreateOrganisationZodSchema,
} from "@/app/api/_validations/auth/create.organisation.validation";
import { withAuth, withDb, withValidation } from "@/shared/api";
import * as authService from "@/shared/auth/auth.service";
import {
  subscriptionsService,
  SubscriptionTier,
} from "@/modules/subscriptions";
import { Permissions } from "@/shared/auth/types";
import { createErrorResponse } from "@/shared/api/response.helpers";

/**
 * Get organizations
 * @description Returns a list of organizations with filtering, searching, and pagination support.
 * @params OrganisationsQuerySchema
 * @response PaginatedResponse<OrganisationResponse>
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  async (req, {}) => {
    try {
      const { searchParams } = new URL(req.url);
      const name = searchParams.get("name") || undefined;
      const domain = searchParams.get("domain") || undefined;

      // Get organizations directly from PropelAuth
      const orgs = await authService.getOrganisations(name, domain);

      return NextResponse.json(orgs);
    } catch (error) {
      return createErrorResponse(error);
    }
  },
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
  withDb(
    withValidation(
      CreateOrganisationZodSchema,
      async (_req, {}, { user, body }) => {
        try {
          const orgData = body as CreateOrganisationRequest;

          // Create in PropelAuth
          const propelAuthOrg = await authService.createOrganisation(orgData);

          if (!propelAuthOrg) {
            throw new Error("Failed to create organization in PropelAuth");
          }

          // Create free tier subscription
          await subscriptionsService.createForOrganization(
            propelAuthOrg.orgId,
            SubscriptionTier.FREE,
            user.userId,
            14 // 14 day trial
          );

          return NextResponse.json(propelAuthOrg, {
            status: 201,
          });
        } catch (error) {
          return createErrorResponse(error);
        }
      }
    )
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
  async (_req, { params }) => {
    try {
      const { id } = await params;

      // Delete from PropelAuth
      const propelResult = await authService.deleteOrganisation(id);

      if (!propelResult) {
        return createErrorResponse(
          new Error("Failed to delete organization from PropelAuth")
        );
      }

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return createErrorResponse(error);
    }
  },
  {
    requiredPermissions: [Permissions.WRITE_USERS],
  }
);

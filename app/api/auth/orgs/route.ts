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
 * @description Returns organizations from PropelAuth
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  async (req, {}, {}) => {
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
 * @description Creates organization in PropelAuth and initializes free tier subscription
 * @body CreateOrganisationZodSchema
 * @response OrganizationResponse with subscription
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

          // Create free tier subscription for the new org
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
  )
);

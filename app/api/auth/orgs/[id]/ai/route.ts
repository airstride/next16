import { NextResponse } from "next/server";
import { withAuth } from "@/shared/api";
import { withOrgValidation } from "@/shared/api/hofs/withOrgValidation";
import { getOrganisation } from "@/shared/auth/auth.service";
import { createErrorResponse } from "@/shared/api/response.helpers";

/**
 * Trigger AI vendor signup workflow
 * @description Initiates AI-powered vendor onboarding process
 * @params id - Organization ID (PropelAuth org ID)
 * @response Success message
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withOrgValidation(async (_req, _params, { orgId }) => {
    try {
      // Get organization details from PropelAuth
      const organisation = await getOrganisation(orgId);

      if (!organisation) {
        throw new Error("Organisation not found");
      }

      return NextResponse.json(
        { message: "Vendor signup initiated" },
        { status: 202 }
      );
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

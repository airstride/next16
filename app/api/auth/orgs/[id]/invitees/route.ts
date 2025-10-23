import { NextResponse } from "next/server";
import { withAuth } from "@/hooks/withAuth";
import { withOrgValidation } from "@/hooks/withOrgValidation";
import { organisationService } from "@/services/organisation.service";
import { Permissions } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";
import { objectToSnakeCase } from "@/utils/case.converter";
import { getInvitesByOrg } from "@/utils/propelAuth";

/**
 * Get all invites in an organization
 * @description Retrieves all invites belonging to the specified organization
 * @params id - Organization ID from the route parameter
 * @query include_orgs - Whether to include organization details in the response (default: false)
 * @query page - Page number (default: 1)
 * @query limit - Number of items per page (default: 10)
 * @response IPaginationResponse<Invite>
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withOrgValidation(async (req, _params, { orgId, activeOrgId }) => {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("pageNumber") || "1");
      const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

      // PropelAuth uses 0-based page numbering, so convert from 1-based
      const pageNumber = page - 1;

      const org = await organisationService.find(orgId, activeOrgId);
      if (!org) {
        return createErrorResponse(new Error("Organisation not found"));
      }

      const result = await getInvitesByOrg({
        orgId: org.propel_auth_org_id,
        pageNumber,
        pageSize,
      });

      if (!result) {
        return NextResponse.json(
          { message: "Failed to fetch invites for organisation" },
          { status: 500 }
        );
      }

      // Transform PropelAuth response to IPaginationResponse format with snake_case
      const transformedInvites = result.invites.map((invite) => objectToSnakeCase(invite));
      const pageCount = Math.ceil(result.totalInvites / pageSize);

      return NextResponse.json({
        data: transformedInvites,
        meta: {
          total: result.totalInvites,
          page,
          limit: pageSize,
          page_count: pageCount,
        },
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.WRITE_INVITE],
  }
);

import { NextResponse } from "next/server";
import { withAuth } from "@/shared/api";
import { withOrgValidation } from "@/shared/api/hofs/withOrgValidation";
import { Permissions } from "@/shared/auth/types";
import { createErrorResponse } from "@/shared/api/response.helpers";
import { objectToSnakeCase } from "@/shared/utils/case.converter";
import { getInvitesByOrg } from "@/shared/auth/auth.service";

/**
 * Get all invites in an organization
 * @description Retrieves all invites belonging to the specified organization
 * @params id - Organization ID (PropelAuth org ID)
 * @query include_orgs - Whether to include organization details in the response (default: false)
 * @query page - Page number (default: 1)
 * @query limit - Number of items per page (default: 10)
 * @response IPaginationResponse<Invite>
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withOrgValidation(async (req, _params, { orgId }) => {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("pageNumber") || "1");
      const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

      // PropelAuth uses 0-based page numbering, so convert from 1-based
      const pageNumber = page - 1;

      // orgId is already the PropelAuth org ID
      const result = await getInvitesByOrg({
        orgId,
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
      const transformedInvites = result.invites.map((invite) =>
        objectToSnakeCase(invite)
      );
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

import { NextResponse } from "next/server";
import { withAuth } from "@/shared/api";
import { withOrgValidation } from "@/shared/api/hofs/withOrgValidation";
import { Permissions } from "@/shared/auth/types";
import { createErrorResponse } from "@/shared/api/response.helpers";
import { objectToSnakeCase } from "@/shared/utils/case.converter";
import { getUsersByOrg } from "@/shared/auth/auth.service";

/**
 * Get all users in an organization
 * @description Retrieves all users belonging to the specified organization
 * @params id - Organization ID (PropelAuth org ID)
 * @query include_orgs - Whether to include organization details in the response (default: false)
 * @query page - Page number (default: 1)
 * @query limit - Number of items per page (default: 10)
 * @response IPaginationResponse<User>
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withOrgValidation(async (req, _params, { orgId }) => {
    try {
      const url = new URL(req.url);
      const includeOrgs = url.searchParams.get("include_orgs") === "true";
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const role = url.searchParams.get("role") || undefined;

      // PropelAuth uses 0-based page numbering, so convert from 1-based
      const pageNumber = page - 1;

      // orgId is already the PropelAuth org ID
      const result = await getUsersByOrg({
        orgId,
        includeOrgs,
        pageNumber,
        pageSize: limit,
        role,
      });

      if (!result) {
        return NextResponse.json(
          { message: "Failed to fetch users for organisation" },
          { status: 500 }
        );
      }

      // Transform PropelAuth response to IPaginationResponse format with snake_case
      const transformedUsers = result.users.map((user) =>
        objectToSnakeCase(user)
      );
      const pageCount = Math.ceil(result.totalUsers / limit);

      return NextResponse.json({
        data: transformedUsers,
        meta: {
          total: result.totalUsers,
          page,
          limit,
          page_count: pageCount,
        },
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.READ_USERS],
  }
);

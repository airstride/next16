import { NextResponse } from "next/server";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withOrgValidation } from "@/hooks/withOrgValidation";
import { organisationService } from "@/services/organisation.service";
import { Permissions } from "@/types/enums";
import { NotFoundError } from "@/types/errors";
import { createErrorResponse } from "@/utils/api.error.handler";
import { objectToSnakeCase } from "@/utils/case.converter";
import { getUsersByOrg } from "@/utils/propelAuth";

/**
 * Get all users in an organization
 * @description Retrieves all users belonging to the specified organization
 * @params id - Organization ID from the route parameter
 * @query include_orgs - Whether to include organization details in the response (default: false)
 * @query page - Page number (default: 1)
 * @query limit - Number of items per page (default: 10)
 * @response IPaginationResponse<User>
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDB(
    withOrgValidation(async (req, _params, { orgId, activeOrgId }) => {
      try {
        const url = new URL(req.url);
        const includeOrgs = url.searchParams.get("include_orgs") === "true";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const role = url.searchParams.get("role") || undefined;

        // PropelAuth uses 0-based page numbering, so convert from 1-based
        const pageNumber = page - 1;

        const org = await organisationService.find(orgId, activeOrgId);

        if (!org) {
          throw new NotFoundError("Organisation not found");
        }

        const result = await getUsersByOrg({
          orgId: org.propel_auth_org_id,
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
        const transformedUsers = result.users.map((user) => objectToSnakeCase(user));
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
    })
  ),
  {
    requiredPermissions: [Permissions.READ_USERS],
  }
);

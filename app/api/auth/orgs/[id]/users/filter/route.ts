import { NextResponse } from "next/server";
import {
  UserFilterRequest,
  UserFilterSchema,
} from "@/app/api/_validations/auth/user.filter.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withValidation } from "@/lib/zod/validation";
import { getOrganisationUsers } from "@/requests/organisations/queries";
import { Permissions } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";
import { convertFiltersToSearchParams } from "@/utils/query.parser";

/**
 * Filter organization users with POST body
 * @description Returns a list of users in an organization with advanced filtering, searching, and pagination support using POST body to avoid URL length limitations.
 * @param id - Organization ID
 * @body UserFilterRequest
 * @response PaginatedResponse<UserResponse>
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
    withValidation(UserFilterSchema, async (_req, { params }, { body }) => {
      try {
        const { id: orgId } = await params;
        if (!orgId) {
          return NextResponse.json({ message: "Organization ID is required" }, { status: 400 });
        }

        const filterRequest = body as UserFilterRequest;

        // Convert filter request to URLSearchParams using generic converter
        const searchParams = convertFiltersToSearchParams(filterRequest);

        // Use existing organization users service with converted search params
        const data = await getOrganisationUsers(orgId, {
          orgId,
          ...Object.fromEntries(searchParams.entries()),
        });

        return NextResponse.json(data, { status: 200 });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  ),
  {
    requiredPermissions: [Permissions.READ_USERS],
  }
);

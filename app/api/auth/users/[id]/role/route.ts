import { NextResponse } from "next/server";
import { UserResponse } from "@/app/api/_responses/user.response";
import {
  UpdateUserRoleRequest,
  UpdateUserRoleZodSchema,
} from "@/app/api/_validations/auth/update.user.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withUserValidation } from "@/hooks/withUserValidation";
import { withValidation } from "@/lib/zod/validation";
import { organisationService } from "@/services/organisation.service";
import { Permissions } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";
import { getUser, updateUserRoleInOrg } from "@/utils/propelAuth";

/**
 * Update a user role
 * @description Updates user role in PropelAuth.
 * @body UpdateUserRoleZodSchema
 * @response UserResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
    withUserValidation(
      withValidation(UpdateUserRoleZodSchema, async (_req, {}, { body, userId, activeOrgId }) => {
        try {
          const userData = body as UpdateUserRoleRequest;
          const organisation = await organisationService.find(userData.org_id, activeOrgId);

          if (!organisation) {
            return createErrorResponse(new Error("Organisation not found"));
          }

          // Update user in PropelAuth using the PropelAuth org ID
          const propelResult = await updateUserRoleInOrg({
            userId,
            orgId: organisation.propel_auth_org_id,
            role: userData.role,
          });

          if (!propelResult) {
            return createErrorResponse(new Error("Failed to update user role in PropelAuth"));
          }

          // Get updated user data
          const updatedUser = await getUser(userId);
          if (!updatedUser) {
            return createErrorResponse(new Error("Failed to retrieve updated user"));
          }

          const userResponse = UserResponse.fromPropelAuthUser(updatedUser);

          return NextResponse.json<UserResponse>(userResponse, { status: 200 });
        } catch (error) {
          return createErrorResponse(error);
        }
      })
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_USER_ROLES],
  }
);

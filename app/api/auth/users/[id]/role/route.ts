import { NextResponse } from "next/server";
import { UserResponse } from "@/app/api/_responses/user.response";
import {
  UpdateUserRoleRequest,
  UpdateUserRoleZodSchema,
} from "@/app/api/_validations/auth/update.user.validation";
import { withAuth, withValidation } from "@/shared/api";
import { withUserValidation } from "@/shared/api/hofs/withUserValidation";
import { Permissions } from "@/shared/auth/types";
import { createErrorResponse } from "@/shared/api/response.helpers";
import { getUser, updateUserRoleInOrg } from "@/shared/auth/auth.service";

/**
 * Update a user role
 * @description Updates user role in PropelAuth.
 * @body UpdateUserRoleZodSchema
 * @response UserResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withUserValidation(
    withValidation(
      UpdateUserRoleZodSchema,
      async (_req, {}, { body, userId }) => {
        try {
          const userData = body as UpdateUserRoleRequest;

          // userData.org_id is the PropelAuth org ID
          const propelResult = await updateUserRoleInOrg({
            userId,
            orgId: userData.org_id,
            role: userData.role,
          });

          if (!propelResult) {
            return createErrorResponse(
              new Error("Failed to update user role in PropelAuth")
            );
          }

          // Get updated user data
          const updatedUser = await getUser(userId);
          if (!updatedUser) {
            return createErrorResponse(
              new Error("Failed to retrieve updated user")
            );
          }

          const userResponse = UserResponse.fromPropelAuthUser(updatedUser);

          return NextResponse.json<UserResponse>(userResponse, {
            status: 200,
          });
        } catch (error) {
          return createErrorResponse(error);
        }
      }
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_USER_ROLES],
  }
);

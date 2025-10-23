import { NextResponse } from "next/server";
import { UserResponse } from "@/app/api/_responses/user.response";
import {
  UpdateUserPasswordRequest,
  UpdateUserPasswordZodSchema,
} from "@/app/api/_validations/auth/update.user.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withUserValidation } from "@/hooks/withUserValidation";
import { withValidation } from "@/lib/zod/validation";
import { Permissions } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";
import { getUser, updateUserPassword } from "@/utils/propelAuth";

/**
 * Update a user password
 * @description Updates user password in PropelAuth.
 * @body UpdateUserPasswordZodSchema
 * @response UserResponse
 * @auth bearer
 * @openapi
 */
export const PUT = withAuth(
  withDB(
    withUserValidation(
      withValidation(UpdateUserPasswordZodSchema, async (_req, {}, { body, userId }) => {
        try {
          const userData = body as UpdateUserPasswordRequest;

          // Update user in PropelAuth
          const propelResult = await updateUserPassword(userId, userData.password);

          if (!propelResult) {
            return createErrorResponse(new Error("Failed to update user password in PropelAuth"));
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
    requiredPermissions: [Permissions.WRITE_USER],
  }
);

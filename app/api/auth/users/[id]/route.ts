import { NextResponse } from "next/server";
import { UserResponse } from "@/app/api/_responses/user.response";
import {
  PartialUpdateUserZodSchema,
  UpdateUserRequest,
} from "@/app/api/_validations/auth/update.user.validation";
import {
  RemoveUserFromOrgSchema,
  RemoveUserFromOrgRequest,
} from "@/app/api/_validations/organisations/user.validation";
import { withAuth, withValidation } from "@/shared/api";
import { withUserValidation } from "@/shared/api/hofs/withUserValidation";
import { Permissions } from "@/shared/auth/types";
import { createErrorResponse } from "@/shared/api/response.helpers";
import {
  getUser,
  removeUserFromOrg,
  updateUser,
} from "@/shared/auth/auth.service";

/**
 * Get user by ID
 * @description Returns user details from PropelAuth.
 * @params userId from URL
 * @response UserResponse
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withUserValidation(async (_req, {}, { userId }) => {
    try {
      // Get user from PropelAuth
      const propelUser = await getUser(userId);

      if (!propelUser) {
        return createErrorResponse(new Error("User not found"));
      }

      const userResponse = UserResponse.fromPropelAuthUser(propelUser);

      return NextResponse.json<UserResponse>(userResponse, {
        status: 200,
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.READ_USERS],
  }
);

/**
 * Update a user
 * @description Updates user information in PropelAuth.
 * @body UpdateUserZodSchema
 * @response UserResponse
 * @auth bearer
 * @openapi
 */
export const PUT = withAuth(
  withUserValidation(
    withValidation(
      PartialUpdateUserZodSchema,
      async (_req, {}, { body, userId }) => {
        try {
          const userData = body as UpdateUserRequest;

          // Update user in PropelAuth
          const propelResult = await updateUser(userId, {
            firstName: userData.first_name,
            lastName: userData.last_name,
            pictureUrl: userData.picture_url,
            metadata: userData.metadata,
          });

          if (!propelResult) {
            return createErrorResponse(
              new Error("Failed to update user in PropelAuth")
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
    requiredPermissions: [Permissions.WRITE_USERS],
  }
);

/**
 * Remove user from organisation
 * @description Removes a user from an organisation
 * @response Success message
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withUserValidation(
    withValidation(
      RemoveUserFromOrgSchema,
      async (_req, {}, { body, userId }) => {
        try {
          const removeData = body as RemoveUserFromOrgRequest;

          // removeData.orgId is the PropelAuth org ID
          const propelOrg = await removeUserFromOrg({
            userId,
            orgId: removeData.orgId,
          });
          if (!propelOrg) {
            throw new Error("User not found in Organisation.");
          }

          return new NextResponse(null, { status: 204 });
        } catch (error) {
          return createErrorResponse(error);
        }
      }
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_USERS],
  }
);

import { NextResponse } from "next/server";
import { UserResponse } from "@/app/api/_responses/user.response";
import {
  PartialUpdateUserZodSchema,
  UpdateUserRequest,
} from "@/app/api/_validations/auth/update.user.validation";
import { RemoveUserFromOrgSchema } from "@/app/api/_validations/organisations/user.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withUserValidation } from "@/hooks/withUserValidation";
import { withValidation } from "@/lib/zod/validation";
import { organisationService } from "@/services/organisation.service";
import { Permissions } from "@/types/enums";
import { NotFoundError } from "@/types/errors";
import { createErrorResponse } from "@/utils/api.error.handler";
import { getUser, removeUserFromOrg, updateUser } from "@/utils/propelAuth";

/**
 * Get user by ID
 * @description Returns user details from PropelAuth.
 * @params userId from URL
 * @response UserResponse
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDB(
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
    })
  ),
  {
    requiredPermissions: [Permissions.READ_USER],
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
  withDB(
    withUserValidation(
      withValidation(PartialUpdateUserZodSchema, async (_req, {}, { body, userId }) => {
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
            return createErrorResponse(new Error("Failed to update user in PropelAuth"));
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

/**
 * Remove user from organisation
 * @description Removes a user from an organisation
 * @response Success message
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withDB(
    withUserValidation(
      withValidation(RemoveUserFromOrgSchema, async (_req, {}, { body, userId, activeOrgId }) => {
        try {
          // Get the organization to retrieve the PropelAuth org ID
          const org = await organisationService.find(body.orgId, activeOrgId);
          if (!org) {
            throw new NotFoundError("Organisation not found");
          }

          const propelOrg = await removeUserFromOrg({ userId, orgId: org.propel_auth_org_id });
          if (!propelOrg) {
            throw new NotFoundError("User not found in Organisation.");
          }

          return new NextResponse(null, { status: 204 });
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

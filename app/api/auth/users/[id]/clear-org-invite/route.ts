import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/shared/api/hofs/withAuth";
import { withUserValidation } from "@/shared/api/hofs/withUserValidation";
import { withDb } from "@/shared/api";
import { NotFoundError } from "@/shared/utils/errors";
import { createErrorResponse } from "@/shared/api/response.helpers";
import { getUser, updateUser } from "@/shared/auth/auth.service";

/**
 * Clear org_invite metadata after successful org switch
 * @description Removes org_invite and redirect_to_accept_invite from user metadata
 * @response Success confirmation
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withUserValidation(async (_req: NextRequest, {}, { user }) => {
      try {
        // Get current user to preserve other metadata
        const propelUser = await getUser(user.userId);

        if (!propelUser) {
          throw new NotFoundError("User not found");
        }

        // Remove org_invite properties while preserving other metadata
        const updatedMetadata = { ...propelUser.metadata };
        delete updatedMetadata.org_invite;
        delete updatedMetadata.redirect_to_accept_invite;

        await updateUser(user.userId, {
          metadata: updatedMetadata,
        });

        return NextResponse.json({
          message: "org_invite_cleared_successfully",
        });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  )
);

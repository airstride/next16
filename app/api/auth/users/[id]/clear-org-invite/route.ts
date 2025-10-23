import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withUserValidation } from "@/hooks/withUserValidation";
import { NotFoundError } from "@/types/errors";
import { createErrorResponse } from "@/utils/error.response.builders";
import { getUser, updateUser } from "@/utils/propelAuth";

/**
 * Clear org_invite metadata after successful org switch
 * @description Removes org_invite and redirect_to_accept_invite from user metadata
 * @response Success confirmation
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
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

        return NextResponse.json({ message: "org_invite_cleared_successfully" });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  )
);

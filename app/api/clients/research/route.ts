import { NextResponse } from "next/server";
import { withAuth, withDb, withValidation } from "@/shared/api";
import { clientsService, WebsiteUrlInputSchema } from "@/modules/clients";
import { Permissions } from "@/shared/auth/types";
import { ErrorHandler } from "@/shared/utils/errors";

/**
 * Helper to create error responses
 */
const createErrorResponse = (error: unknown) => {
  const response = ErrorHandler.handle(error);
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
};

/**
 * Research website and create client
 * @description Submit website URL for AI research and client creation
 * @body WebsiteUrlInputSchema
 * @response ClientResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withValidation(
      WebsiteUrlInputSchema,
      async (_req, {}, { user, body, activeOrgId }) => {
        try {
          const client = await clientsService.createClientFromWebsite(
            body.website_url,
            user.userId,
            activeOrgId
          );
          return NextResponse.json(client, { status: 201 });
        } catch (error) {
          return createErrorResponse(error);
        }
      }
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_CLIENTS],
  }
);

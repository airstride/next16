import { NextResponse } from "next/server";
import { withAuth, withDb, withValidation } from "@/shared/api";
import {
  clientsService,
  RefineContextInput,
  RefineContextSchema,
} from "@/modules/clients";
import { Permissions } from "@/shared/auth/types";
import { ErrorHandler } from "@/shared/utils/errors";
import { NextRouteContext } from "@/shared/types";

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
 * Refine AI-extracted context
 * @description User refines/overrides AI-extracted client data
 * @body RefineContextSchema
 * @response ClientResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withValidation(
      RefineContextSchema,
      async (
        _req,
        context: NextRouteContext<{ id: string }>,
        { user, body, activeOrgId }
      ) => {
        try {
          const { id } = await context.params;

          // Verify ownership before refining
          const existingClient = await clientsService.getClientContext(id);
          if (existingClient.organization_id !== activeOrgId) {
            return NextResponse.json(
              {
                error: "Forbidden",
                message: "You don't have access to this client",
              },
              { status: 403 }
            );
          }

          const client = await clientsService.refineContext(
            id,
            body as RefineContextInput,
            user.userId
          );
          return NextResponse.json(client);
        } catch (error) {
          return createErrorResponse(error);
        }
      }
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_PROJECTS],
  }
);

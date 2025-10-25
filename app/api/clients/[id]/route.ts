import { NextResponse } from "next/server";
import { withAuth, withDb, withValidation } from "@/shared/api";
import { clientsService, UpdateClientSchema } from "@/modules/clients";
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
 * Get client by ID
 * @description Retrieve a specific client by ID
 * @response ClientResponse
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDb(
    async (
      _req,
      context: NextRouteContext<{ id: string }>,
      { activeOrgId }
    ) => {
      try {
        const { id } = await context.params;
        const client = await clientsService.getClientContext(id);

        // Verify ownership
        if (client.organization_id !== activeOrgId) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: "You don't have access to this client",
            },
            { status: 403 }
          );
        }

        return NextResponse.json(client);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  ),
  {
    requiredPermissions: [Permissions.READ_PROJECTS],
  }
);

/**
 * Update client
 * @description Update client details
 * @body UpdateClientSchema
 * @response ClientResponse
 * @auth bearer
 * @openapi
 */
export const PATCH = withAuth(
  withDb(
    withValidation(
      UpdateClientSchema,
      async (
        _req,
        context: NextRouteContext<{ id: string }>,
        { user, body, activeOrgId }
      ) => {
        try {
          const { id } = await context.params;

          // Verify ownership before update
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

          const client = await clientsService.updateContext(
            id,
            body as any,
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

/**
 * Delete client
 * @description Soft delete a client
 * @response NoContent
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withDb(
    async (
      _req,
      context: NextRouteContext<{ id: string }>,
      { activeOrgId }
    ) => {
      try {
        const { id } = await context.params;

        // Verify ownership before deletion
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

        await clientsService.deleteById(id);
        return new NextResponse(null, { status: 204 });
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  ),
  {
    requiredPermissions: [Permissions.WRITE_PROJECTS],
  }
);

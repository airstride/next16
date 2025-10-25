import { NextResponse } from "next/server";
import {
  withAuth,
  withDb,
  withValidation,
  createErrorResponse,
} from "@/shared/api";
import { clientsService, CreateClientSchema } from "@/modules/clients";
import { Permissions } from "@/shared/auth/types";

/**
 * Get clients
 * @description Returns a list of clients for the authenticated user/organization
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDb(async (_req, {}, { activeOrgId }) => {
    try {
      const data = await clientsService.findClientsByOrganization(
        activeOrgId
      );
      return NextResponse.json(data);
    } catch (error) {
      return createErrorResponse(error);
    }
  }),
  {
    requiredPermissions: [Permissions.READ_PROJECTS],
  }
);

/**
 * Create a new client
 * @description Create a client manually with provided data
 * @body CreateClientSchema
 * @response ClientResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withValidation(
      CreateClientSchema,
      async (_req, {}, { user, body, activeOrgId }) => {
        try {
          const client = await clientsService.createClient(
            body as any,
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
    requiredPermissions: [Permissions.WRITE_PROJECTS],
  }
);

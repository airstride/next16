import { NextResponse } from "next/server";
import {
  withAuth,
  withDb,
  withValidation,
  createErrorResponse,
} from "@/shared/api";
import { projectsService, CreateProjectSchema } from "@/modules/projects";
import { Permissions } from "@/shared/auth/types";

/**
 * Get projects
 * @description Returns a list of projects for the authenticated user/organization
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDb(async (_req, {}, { activeOrgId }) => {
    try {
      const data = await projectsService.findProjectsByOrganization(
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
 * Create a new project
 * @description Create a project manually with provided data
 * @body CreateProjectSchema
 * @response ProjectResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withValidation(
      CreateProjectSchema,
      async (_req, {}, { user, body, activeOrgId }) => {
        try {
          const project = await projectsService.createProject(
            body as any,
            user.userId,
            activeOrgId
          );
          return NextResponse.json(project, { status: 201 });
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

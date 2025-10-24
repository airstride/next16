// /lib/withAuth.ts
import { NextRequest, NextResponse } from "next/server";
import { UserRole, UserType, getUserType } from "@/shared/auth/types";

import type { AuthUser } from "@/shared/auth/auth.service";
import { getUserFromAuthHeader } from "@/shared/auth/auth.service";
import {
  ServerPermissions,
  type PermissionConfig,
} from "@/shared/auth/server.permissions";

// What your app code will receive as the 3rd arg:
export type WithAuthProps = {
  role: UserRole;
  user: AuthUser;
  activeOrgId: string;
  activeOrgName: string;
  userType: UserType;
  permissions: ServerPermissions;
  name: string;
};

// The inner handler type: 3 args (req, ctx, auth)
export type AuthenticatedHandler<
  P extends Record<string, string> = Record<string, never>
> = (
  req: NextRequest,
  ctx: { params: Promise<P> },
  auth: WithAuthProps
) => Response | Promise<Response>;

// The HOF returns a 2-arg Route Handler that Next.js 15 expects.
export function withAuth<
  P extends Record<string, string> = Record<string, never>
>(handler: AuthenticatedHandler<P>, permissionConfig?: PermissionConfig) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<P> }
  ): Promise<Response> => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "You must be logged in." },
        { status: 401 }
      );
    }

    const user = await getUserFromAuthHeader(authHeader);
    if (!user) {
      return NextResponse.json(
        { message: "You must be logged in." },
        { status: 401 }
      );
    }

    const activeOrg = user.getActiveOrg() || user.getOrgs()[0];
    if (!activeOrg) {
      return NextResponse.json(
        { message: "You must be a user with a role in an organisation." },
        { status: 401 }
      );
    }

    const permissions = new ServerPermissions(user, activeOrg.orgId);

    if (permissionConfig) {
      const hasPermission = permissions.validateConfig(permissionConfig);
      if (!hasPermission) {
        return NextResponse.json(
          {
            message: "You do not have permission to access this resource.",
          },
          { status: 403 }
        );
      }
    }

    const role = activeOrg.assignedRole as UserRole;
    const userType = getUserType(role);

    const authProps: WithAuthProps = {
      user,
      role,
      activeOrgId: activeOrg.orgId,
      activeOrgName: activeOrg.orgName,
      userType,
      permissions,
      name: user.firstName + " " + user.lastName,
    };

    return handler(req, ctx, authProps);
  };
}

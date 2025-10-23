import { NextRequest } from "next/server";
import { UserFromToken } from "@propelauth/nextjs/server";
import { getRouteHandlers } from "@propelauth/nextjs/server/app-router";

const routeHandlers = getRouteHandlers({
  getDefaultActiveOrgId: (_req: NextRequest, user: UserFromToken) => {
    const orgs = user.getOrgs();
    const metadata = user?.properties?.metadata as Record<string, any>;
    const orgInvite = metadata?.org_invite;

    if (!orgs.length) {
      return;
    }

    const org = orgs.find((org) => org.orgId === orgInvite);

    if (org) {
      return org.orgId;
    }

    return orgs?.at?.(-1)?.orgId;
  },
});

/**
 * Get auth route
 */
export const GET = routeHandlers.getRouteHandlerAsync;

/**
 * Post auth route
 */
export const POST = routeHandlers.postRouteHandlerAsync;

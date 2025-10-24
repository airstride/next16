import { NextRequest, NextResponse } from "next/server";
import type {
  CoreHandler,
  NextRouteContext,
} from "@/shared/types/api-hof.types";
import { GUID_REGEX } from "@/shared/utils/constants";

function validateOrgId(orgId: string) {
  if (!orgId || !GUID_REGEX.test(orgId)) {
    return NextResponse.json(
      { message: "Organisation ID is required" },
      { status: 400 }
    );
  }
  return null;
}

export function withOrgValidation<
  P extends Record<string, string>,
  ExistingProps extends Record<string, any>
>(
  handler: CoreHandler<P, ExistingProps & { orgId: string }>
): CoreHandler<P, ExistingProps> {
  return async (
    req: NextRequest,
    context: NextRouteContext<P>,
    props: ExistingProps
  ) => {
    const { id: orgId } = await context.params;
    const invalid = validateOrgId(orgId);
    if (invalid) return invalid;

    const mergedProps = { ...props, orgId };

    return handler(req, context, mergedProps);
  };
}

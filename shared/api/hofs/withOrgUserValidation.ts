import { NextRequest, NextResponse } from "next/server";
import { withOrgValidation } from "@/shared/api/hofs/withOrgValidation";
import type {
  CoreHandler,
  NextRouteContext,
} from "@/shared/types/api-hof.types";
import { UserRole, UserType } from "@/shared/auth/types";

function validateCustomerType(customer_type: string) {
  if (!Object.values(UserType).includes(customer_type as UserType)) {
    return NextResponse.json(
      { message: "Invalid customer type" },
      { status: 400 }
    );
  }
  return null;
}

export function withOrgUserValidation<
  P extends Record<string, string>,
  ExistingProps extends Record<string, any>
>(
  handler: CoreHandler<
    P,
    ExistingProps & { orgId: string; customer_type: UserType; role: UserRole }
  >
): CoreHandler<P, ExistingProps> {
  return withOrgValidation(
    async (
      req: NextRequest,
      context: NextRouteContext<P>,
      props: ExistingProps
    ): Promise<Response> => {
      try {
        const { id: orgId } = await context.params;
        const customer_type =
          req.nextUrl.searchParams.get("customer_type") || "";

        const role = req.nextUrl.searchParams.get("role") || "";

        const invalid = validateCustomerType(customer_type);
        if (invalid) return invalid;

        const mergedProps = {
          ...props,
          orgId,
          customer_type: customer_type as UserType,
          role: role as UserRole,
        };

        return handler(req, context, mergedProps);
      } catch (error: any) {
        return NextResponse.json(
          { message: error.message || "Access token required" },
          { status: 401 }
        );
      }
    }
  );
}

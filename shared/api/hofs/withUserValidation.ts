import { NextRequest, NextResponse } from "next/server";
import type {
  CoreHandler,
  NextRouteContext,
} from "@/shared/types/api-hof.types";
import { GUID_REGEX } from "@/shared/utils/constants";

function validateUserId(userId: string) {
  if (!userId || !GUID_REGEX.test(userId)) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 }
    );
  }
  return null;
}

export function withUserValidation<
  P extends Record<string, string>,
  ExistingProps extends Record<string, any>
>(
  handler: CoreHandler<P, ExistingProps & { userId: string }>
): CoreHandler<P, ExistingProps> {
  return async (
    req: NextRequest,
    context: NextRouteContext<P>,
    props: ExistingProps
  ): Promise<Response> => {
    const { id: userId } = await context.params;

    const invalid = validateUserId(userId);
    if (invalid) return invalid;

    return handler(req, context, {
      ...props,
      userId,
    });
  };
}

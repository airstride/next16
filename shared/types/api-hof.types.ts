/**
 * API Higher-Order Function Types
 *
 * Type definitions for API route handlers and HOF compositions
 */

import { NextRequest } from "next/server";

/**
 * Next.js 15+ route context with async params
 */
export type NextRouteContext<
  P extends Record<string, string> = Record<string, string>
> = {
  params: Promise<P>;
};

/**
 * Core handler type that all HOFs wrap
 * This is the final handler signature after all HOFs are applied
 *
 * @template P - URL params type (e.g., { id: string })
 * @template TProps - Props accumulated from HOFs (e.g., { auth: AuthUser, body: ValidatedData })
 */
export type CoreHandler<
  P extends Record<string, string> = Record<string, string>,
  TProps extends Record<string, unknown> = Record<string, unknown>
> = (
  req: NextRequest,
  context: NextRouteContext<P>,
  props: TProps
) => Response | Promise<Response>;

/**
 * Next.js route handler type (before HOFs)
 * This is what Next.js expects: (req, context) => Response
 */
export type NextRouteHandler<
  P extends Record<string, string> = Record<string, string>
> = (
  req: NextRequest,
  context: NextRouteContext<P>
) => Response | Promise<Response>;

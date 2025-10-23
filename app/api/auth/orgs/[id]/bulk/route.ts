import { NextResponse } from "next/server";
import { CsvOrganisationUploadSchema } from "@/app/api/_validations/organisations/organisation.csv.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withOrgUserValidation } from "@/hooks/withOrgUserValidation";
import { EventEnabledEnum } from "@/lib/inngest/event.types";
import { IErrorResponse } from "@/repositories/types";
import { organisationService } from "@/services/organisation.service";
import { UserType } from "@/types/enums";
import { createErrorResponse } from "@/utils/api.error.handler";

/**
 * Create users (bulk from CSV)
 * @description
 * @body
 * @response
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
    withOrgUserValidation(async (req, _params, { user, orgId }) => {
      try {
        const formData = await req.formData();

        const { customer_type, enabled } = Object.fromEntries(req.nextUrl.searchParams);

        const enabledArray = enabled?.split(",") as EventEnabledEnum[];

        // Change to use the new schema
        const validation = await CsvOrganisationUploadSchema.safeParseAsync({
          csv: formData.get("csv"),
        });

        // TODO: Refactor in three places (this, partner and organisation)
        if (!validation.success) {
          return NextResponse.json<IErrorResponse>(
            {
              message: "CSV validation failed",
              details: validation.error.issues.reduce(
                (acc, issue) => {
                  const path = issue.path.join(".");
                  acc[path] = [issue.message];
                  return acc;
                },
                {} as Record<string, string[]>
              ),
            },
            { status: 400 }
          );
        }

        // Delegate to partner service for all business logic
        const userName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email || user.userId;
        const result = await organisationService.processBulkCsvUpload(
          validation.data.csv,
          user.userId,
          orgId,
          enabledArray,
          customer_type as UserType,
          userName
        );

        return NextResponse.json(result, { status: 202 });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  )
);

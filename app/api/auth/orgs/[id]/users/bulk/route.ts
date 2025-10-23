import { NextResponse } from "next/server";
import { CsvUserUploadSchema } from "@/app/api/_validations/organisations/user.csv.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withOrgUserValidation } from "@/hooks/withOrgUserValidation";
import { EventEnabledEnum } from "@/lib/inngest/event.types";
import { IErrorResponse } from "@/repositories/types";
import { processBulkCsvUpload } from "@/services/csv.bulk.upload.service";
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
    withOrgUserValidation(async (req, _params, { user, customer_type, role, activeOrgId }) => {
      try {
        const formData = await req.formData();

        const enabled = req.nextUrl.searchParams.get("enabled");

        const enabledArray = enabled?.split(",") as EventEnabledEnum[];

        const validation = await CsvUserUploadSchema.safeParseAsync({
          csv: formData.get("csv"),
        });

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
        const result = await processBulkCsvUpload(
          validation.data.csv,
          user.userId,
          activeOrgId,
          customer_type,
          role,
          enabledArray,
          userName
        );

        return NextResponse.json(result, { status: 202 });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  )
);

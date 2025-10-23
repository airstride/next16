import { NextResponse } from "next/server";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withOrgValidation } from "@/hooks/withOrgValidation";
import { inngest } from "@/lib/inngest/client";
import { EventNameEnum } from "@/lib/inngest/event.types";
import { organisationService } from "@/services/organisation.service";
import { UserType } from "@/types/enums";
import { NotFoundError, ValidationError } from "@/types/errors";
import { createErrorResponse } from "@/utils/api.error.handler";

export const POST = withAuth(
  withDB(
    withOrgValidation(async (_req, _params, { user, orgId }) => {
      try {
        const organisation = await organisationService.findById(orgId);

        if (!organisation) {
          throw new NotFoundError("Organisation not found");
        }
        if (organisation.customer_type !== UserType.VENDOR) {
          throw new ValidationError("Organisation is not a vendor");
        }

        // send inngest event
        await inngest.send({
          name: EventNameEnum.VENDOR_SIGNUP,
          version: "1.0.0",
          data: {
            vendor_name: organisation.name,
            vendor_website: organisation.domain,
            user_id: user.userId,
            organisation_id: orgId,
            propel_auth_org_id: organisation.propel_auth_org_id,
          },
        });

        return NextResponse.json({ message: "Vendor signup initiated" }, { status: 202 });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  )
);

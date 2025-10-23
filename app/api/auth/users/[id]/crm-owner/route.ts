import { NextRequest, NextResponse } from "next/server";
import { UserMetadata } from "@/app/api/_validations/auth/update.user.validation";
import { withAuth } from "@/hooks/withAuth";
import { withDB } from "@/hooks/withDB";
import { withUserValidation } from "@/hooks/withUserValidation";
import { oauth2Service } from "@/services/oauth2.service";
import { Permissions } from "@/types/enums";
import { SupportedConnector } from "@/types/integrations";
import { createErrorResponse } from "@/utils/api.error.handler";
import { getUser, updateUser } from "@/utils/propelAuth";

// Generic CRM Owner interface
interface CrmOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

// HubSpot specific interfaces
interface HubSpotOwner extends CrmOwner {
  type: string;
  userId: number;
  userIdIncludingInactive: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotOwnersResponse {
  results: HubSpotOwner[];
}

/**
 * Update user's CRM owner ID for any supported connector
 * @description Fetches CRM owner by user's email and updates user metadata
 * @params userId from URL
 * @body { connector: SupportedConnector }
 * @response Updated user data
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDB(
    withUserValidation(async (req: NextRequest, {}, { userId, activeOrgId }) => {
      try {
        const { connector } = await req.json();

        if (!connector) {
          return createErrorResponse(new Error("Connector is required"));
        }

        // Validate connector
        const validConnectors: SupportedConnector[] = ["hubspot", "salesforce", "linkedin"];
        if (!validConnectors.includes(connector)) {
          return createErrorResponse(new Error(`Unsupported connector: ${connector}`));
        }

        // Get the current user data
        const currentUser = await getUser(userId);
        if (!currentUser) {
          return createErrorResponse(new Error("User not found"));
        }

        const oauth2Record = await oauth2Service.getByUserAndOrgConnector(
          userId,
          activeOrgId,
          connector
        );

        if (!oauth2Record) {
          return createErrorResponse(new Error(`${connector} connection not found for user`));
        }

        const crmOwner = await fetchCrmOwnerByEmail(
          connector,
          currentUser.email,
          oauth2Record.access_token
        );

        if (!crmOwner) {
          return createErrorResponse(
            new Error(`No ${connector} owner found for email: ${currentUser.email}`)
          );
        }

        const currentMetadata = (currentUser.metadata as UserMetadata) ?? {
          customer_type: "PARTNER",
          onboarded: false,
          crm_owner_ids: { salesforce: "", hubspot: "", linkedin: "" },
        };

        const newMetadata = {
          ...currentMetadata,
          crm_owner_ids: {
            ...currentMetadata.crm_owner_ids,
            [connector]: crmOwner.id,
          },
        };

        const updatedUser = await updateUser(userId, {
          metadata: newMetadata,
        });

        if (!updatedUser) {
          return createErrorResponse(new Error("Failed to update user metadata"));
        }

        return NextResponse.json({
          success: true,
          connector,
          message: `Updated ${connector} owner ID to ${crmOwner.id}`,
          owner: {
            id: crmOwner.id,
            name: `${crmOwner.firstName} ${crmOwner.lastName}`,
            email: crmOwner.email,
          },
        });
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  ),
  {
    requiredPermissions: [Permissions.WRITE_USER],
  }
);
/**
 * Generic CRM owner fetcher that routes to appropriate connector
 */
async function fetchCrmOwnerByEmail(
  connector: SupportedConnector,
  email: string,
  accessToken: string
): Promise<CrmOwner | null> {
  switch (connector.toLowerCase()) {
    case "hubspot":
      return fetchHubSpotOwnerByEmail(email, accessToken);
    case "salesforce":
      // TODO: Implement Salesforce owner fetching when needed
      console.log("Salesforce owner fetching not yet implemented");
      return null;
    case "linkedin":
      // TODO: Implement LinkedIn owner fetching when needed
      console.log("LinkedIn owner fetching not yet implemented");
      return null;
    default:
      throw new Error(`Unsupported connector: ${connector}`);
  }
}

/**
 * Fetch HubSpot owner by email using server-side call
 */
async function fetchHubSpotOwnerByEmail(
  email: string,
  accessToken: string
): Promise<HubSpotOwner | null> {
  try {
    const url = `https://api.hubapi.com/crm/v3/owners?email=${encodeURIComponent(email)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [HubSpot API] Failed to fetch HubSpot owner:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return null;
    }

    const data: HubSpotOwnersResponse = await response.json();
    console.log(`📋 [HubSpot API] Found ${data.results?.length || 0} owners`);

    if (data.results && data.results.length > 0) {
      const activeOwner = data.results.find((owner: HubSpotOwner) => !owner.archived);
      const selectedOwner = activeOwner || data.results[0];

      console.log(`✅ [HubSpot API] Selected owner:`, {
        id: selectedOwner.id,
        email: selectedOwner.email,
        firstName: selectedOwner.firstName,
        lastName: selectedOwner.lastName,
        archived: selectedOwner.archived,
      });

      return selectedOwner;
    }

    console.log(`⚠️ [HubSpot API] No owners found for email: ${email}`);
    return null;
  } catch (error) {
    console.error("❌ [HubSpot API] Error fetching HubSpot owner by email:", error);
    return null;
  }
}

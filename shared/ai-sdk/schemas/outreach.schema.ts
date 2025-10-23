import { z } from "zod";

/**
 * Outreach message response schema
 */
export const OutreachMessageSchema = z.object({
  message: z.string().max(300),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

// Export the inferred type
export type OutreachMessage = z.infer<typeof OutreachMessageSchema>;

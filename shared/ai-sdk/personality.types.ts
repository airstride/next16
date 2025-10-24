/**
 * AI Personality types for customizing tone and style
 * These provide personality and tone guidance to the AI
 */
export enum AIPersonality {
  PROFESSIONAL = "professional",
  FRIENDLY = "friendly",
  ENTHUSIASTIC = "enthusiastic",
  CONCISE = "concise",
  DETAILED = "detailed",
  CREATIVE = "creative",
  CONSULTATIVE = "consultative",
}

/**
 * Personality descriptions and prompt instructions
 */
export const PERSONALITY_CONFIG: Record<
  AIPersonality,
  {
    label: string;
    description: string;
    promptInstruction: string;
  }
> = {
  [AIPersonality.PROFESSIONAL]: {
    label: "Professional",
    description: "Formal, polished, business-appropriate tone",
    promptInstruction:
      "Write in a professional, formal tone. Use polished language appropriate for business communications. Be respectful and maintain professional boundaries.",
  },
  [AIPersonality.FRIENDLY]: {
    label: "Friendly",
    description: "Warm, approachable, conversational style",
    promptInstruction:
      "Write in a warm, friendly, and approachable tone. Use conversational language that feels personal and genuine while remaining professional.",
  },
  [AIPersonality.ENTHUSIASTIC]: {
    label: "Enthusiastic",
    description: "Energetic, positive, excited about opportunities",
    promptInstruction:
      "Write with enthusiasm and positive energy. Show genuine excitement about the partnership opportunity. Use upbeat language that conveys optimism.",
  },
  [AIPersonality.CONCISE]: {
    label: "Concise",
    description: "Brief, direct, to-the-point messaging",
    promptInstruction:
      "Write in a concise, direct manner. Get straight to the point with minimal fluff. Be brief while conveying all necessary information.",
  },
  [AIPersonality.DETAILED]: {
    label: "Detailed",
    description: "Thorough, comprehensive, informative",
    promptInstruction:
      "Write with thorough detail and comprehensive information. Provide context and explanation. Be informative while maintaining engagement.",
  },
  [AIPersonality.CREATIVE]: {
    label: "Creative",
    description: "Unique, memorable, stands out from generic messages",
    promptInstruction:
      "Write with creative flair that makes the message memorable and unique. Use interesting angles and perspectives while maintaining professionalism.",
  },
  [AIPersonality.CONSULTATIVE]: {
    label: "Consultative",
    description: "Advisory, problem-solving, value-focused",
    promptInstruction:
      "Write in a consultative tone that focuses on problem-solving and value creation. Position yourself as an advisor offering strategic insights.",
  },
};

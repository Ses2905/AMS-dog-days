/** The assistant runs through Vercel AI Gateway. It stays switched off until AI_GATEWAY_API_KEY is set. */
export const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";

export function aiStatus(env: Record<string, string | undefined> = process.env): { ready: boolean; model: string } {
  return { ready: !!env.AI_GATEWAY_API_KEY?.trim(), model: env.AI_MODEL?.trim() || DEFAULT_MODEL };
}

export const LIMITS = {
  question: 1000,
  goals: 1500,
  transcript: 40_000,
  contextChars: 30_000,
  outputTokens: 4000,
  timeoutMs: 55_000,
} as const;

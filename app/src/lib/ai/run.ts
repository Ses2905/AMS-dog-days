import { generateText, Output, type LanguageModel } from "ai";
import { LIMITS } from "./config";
import { buildContext, extractCitations, playerRef, practiceLines, type AssistantData, type Source } from "./context";
import { askPrompt, askSystem, draftPrompt, draftSystem, transcriptPrompt, transcriptSystem } from "./prompts";
import { checkDraft, checkTranscript, draftSchema, transcriptSchema, type DraftRequest, type DraftResult, type Proposal } from "./schemas";

export type Ok<T> = { ok: true; value: T };
export type Fail = { ok: false; error: string };

const common = () => ({ maxOutputTokens: LIMITS.outputTokens, abortSignal: AbortSignal.timeout(LIMITS.timeoutMs), maxRetries: 1 });

function explain(e: unknown): Fail {
  const msg = e instanceof Error ? e.message : "";
  if (/abort|timeout/i.test(msg)) return { ok: false, error: "That took too long. Try a shorter request." };
  if (/unauthor|api key|401|403/i.test(msg)) return { ok: false, error: "The assistant's key was rejected. Check AI_GATEWAY_API_KEY in Vercel." };
  if (/rate|429|credit|quota/i.test(msg)) return { ok: false, error: "The assistant is out of credits or rate limited. Try again in a minute." };
  return { ok: false, error: "The assistant couldn't answer just now. Try again." };
}

export async function runAsk(model: LanguageModel, data: AssistantData, question: string): Promise<Ok<{ answer: string; sources: Source[] }> | Fail> {
  const q = question.trim();
  if (!q) return { ok: false, error: "Type a question first." };
  if (q.length > LIMITS.question) return { ok: false, error: `Keep the question under ${LIMITS.question} characters.` };
  const { text: context, sources } = buildContext(data, LIMITS.contextChars);
  try {
    const { text } = await generateText({ model, system: askSystem, prompt: askPrompt(context, q), ...common() });
    const { text: answer, cited } = extractCitations(text, sources);
    if (!answer) return { ok: false, error: "The assistant sent back an empty answer. Try again." };
    return { ok: true, value: { answer, sources: cited } };
  } catch (e) { return explain(e); }
}

export async function runDraft(model: LanguageModel, data: AssistantData, req: DraftRequest, goals: string): Promise<Ok<DraftResult> | Fail> {
  const g = goals.trim();
  if (!g) return { ok: false, error: "Say what the practice should accomplish." };
  if (g.length > LIMITS.goals) return { ok: false, error: `Keep the goals under ${LIMITS.goals} characters.` };
  if (!Number.isInteger(req.minutes) || req.minutes < 15 || req.minutes > 180 || req.minutes % 5 !== 0) return { ok: false, error: "Length should be 15 to 180 minutes, in steps of 5." };
  const active = data.coaches.filter((c) => c.active);
  const { text: context } = buildContext({ ...data, practices: data.practices.filter((p) => p.date < req.date) }, LIMITS.contextChars);
  const examples = [...data.practices].filter((p) => p.session === req.session).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2)
    .map((p) => `${p.date} ${p.session}\n${practiceLines(p).join("\n")}`).join("\n\n") || "(none yet)";
  try {
    const { output } = await generateText({
      model, system: draftSystem, output: Output.object({ schema: draftSchema }),
      prompt: draftPrompt({ context, goals: g, minutes: req.minutes, staff: active.map((c) => c.last), examples }), ...common(),
    });
    return checkDraft(output, req, active);
  } catch (e) { return explain(e); }
}

export async function runTranscript(model: LanguageModel, data: AssistantData, transcript: string): Promise<Ok<{ summary: string; proposals: Proposal[]; suggestions: string[] }> | Fail> {
  const t = transcript.trim();
  if (!t) return { ok: false, error: "Paste the transcript first." };
  if (t.length > LIMITS.transcript) return { ok: false, error: `That's too long (max ${LIMITS.transcript.toLocaleString()} characters). Paste it in two parts.` };
  const roster = data.players.map(playerRef).join(", ");
  const { text: context } = buildContext({ ...data, players: data.players }, 8000);
  try {
    const { output } = await generateText({
      model, system: transcriptSystem, output: Output.object({ schema: transcriptSchema }),
      prompt: transcriptPrompt(`${context}\n\n## ROSTER (number and last name)\n${roster}`, t), ...common(),
    });
    return { ok: true, value: checkTranscript(output, data.players, data.coaches) };
  } catch (e) { return explain(e); }
}

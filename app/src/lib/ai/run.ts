import { generateText, Output, type LanguageModel } from "ai";
import { LIMITS } from "./config";
import { buildContext, docContext, extractCitations, playerRef, practiceLines, type AssistantData, type Source } from "./context";
import { askPrompt, askSystem, draftPrompt, draftSystem, RULES, transcriptPrompt, transcriptSystem } from "./prompts";
import { vsLabel } from "../games";
import { situation, type ScriptRow } from "../scripts";
import { workflowById, workflowContext, workflowSystem } from "./workflows";
import { checkDraft, checkScriptDraft, checkTranscript, draftSchema, scriptDraftSchema, transcriptSchema, type DraftRequest, type DraftResult, type Proposal } from "./schemas";

export type Ok<T> = { ok: true; value: T };
export type Fail = { ok: false; error: string };

const common = () => ({ maxOutputTokens: LIMITS.outputTokens, abortSignal: AbortSignal.timeout(LIMITS.timeoutMs), maxRetries: 1 });

/** Plain-language reason first, then the provider's own words so a problem can be diagnosed from the screen. */
export function explain(e: unknown): Fail {
  const err = (e ?? {}) as { name?: string; statusCode?: number; message?: string; cause?: { message?: string } };
  const msg = `${err.message ?? ""} ${err.cause?.message ?? ""}`.trim();
  const status = err.statusCode;
  const detail = [err.name, status, msg].filter(Boolean).join(" · ").replace(/\s+/g, " ").slice(0, 300);
  const tail = detail ? ` (${detail})` : "";
  if (err.name === "TimeoutError" || err.name === "AbortError" || /\baborted\b|\btimed? ?out\b/i.test(msg)) return { ok: false, error: "That took too long. Try a shorter request." };
  if (status === 401 || err.name === "GatewayAuthenticationError") return { ok: false, error: `The assistant's key was rejected. Check AI_GATEWAY_API_KEY in Vercel.${tail}` };
  if (err.name === "GatewayModelNotFoundError" || status === 404) return { ok: false, error: `The assistant's model wasn't found. Set AI_MODEL in Vercel to a model listed in AI Gateway.${tail}` };
  if (/\b(credits?|balance|payment|billing|credit card)\b/i.test(msg)) return { ok: false, error: `AI Gateway needs credits or a payment method before it will answer.${tail}` };
  if (status === 429 || err.name === "GatewayRateLimitError") return { ok: false, error: `The assistant is rate limited. Try again in a minute.${tail}` };
  return { ok: false, error: `The assistant couldn't answer just now.${tail}` };
}

export async function runAsk(model: LanguageModel, data: AssistantData, question: string): Promise<Ok<{ answer: string; sources: Source[] }> | Fail> {
  const q = question.trim();
  if (!q) return { ok: false, error: "Type a question first." };
  if (q.length > LIMITS.question) return { ok: false, error: `Keep the question under ${LIMITS.question} characters.` };
  const base = buildContext(data, LIMITS.contextChars);
  const docs = docContext(q, data.docTexts);
  const context = docs.text ? `${base.text}\n\n${docs.text}` : base.text;
  const sources = { ...base.sources, ...docs.sources };
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

export type WorkflowResult = { kind: "document"; title: string; body: string } | { kind: "script"; title: string; body: string; script: { name: string; rows: ScriptRow[] } };

export async function runWorkflow(model: LanguageModel, data: AssistantData, workflowId: string, subjectId: string, input: string): Promise<Ok<WorkflowResult> | Fail> {
  const w = workflowById(workflowId);
  if (!w) return { ok: false, error: "Unknown workflow." };
  const text = input.trim();
  if (!text && w.id !== "week" && w.id !== "depth") return { ok: false, error: "Tell it what to work from first." };
  if (text.length > LIMITS.transcript) return { ok: false, error: `That's too long (max ${LIMITS.transcript.toLocaleString()} characters).` };
  if (w.subject === "game" && subjectId && !data.games.some((g) => g.id === subjectId)) return { ok: false, error: "That game wasn't found." };
  if (w.subject === "player" && !data.players.some((p) => p.id === subjectId)) return { ok: false, error: "Pick a player." };
  if (w.subject === "game" && !subjectId && !w.subjectHint.includes("optional")) return { ok: false, error: "Pick a game." };
  const context = workflowContext(w, subjectId, data, LIMITS.contextChars, text);
  const prompt = `<data>\n${context}\n</data>\n\n<request>\n${text || "Use the data above."}\n</request>`;
  const system = `${RULES}\n\n${workflowSystem(w)}`;
  const subject = w.subject === "game" ? data.games.find((g) => g.id === subjectId) : undefined;
  const title = `${w.title}${subject ? ` · ${vsLabel(subject)}` : ""}`;
  try {
    if (w.kind === "script") {
      const { output } = await generateText({ model, system, prompt, output: Output.object({ schema: scriptDraftSchema }), ...common() });
      const c = checkScriptDraft(output);
      if (!c.ok) return c;
      const lines = c.value.rows.map((r, i) => `${i + 1}. ${[r.section, situation(r), r.formation, r.play].filter(Boolean).join(" · ")}`);
      return { ok: true, value: { kind: "script", title, body: `${c.value.name}\n\n${lines.join("\n")}${c.value.dropped ? `\n\n(${c.value.dropped} unusable rows were dropped.)` : ""}`, script: { name: c.value.name, rows: c.value.rows } } };
    }
    const { text: out } = await generateText({ model, system, prompt, ...common() });
    if (!out.trim()) return { ok: false, error: "The assistant sent back an empty answer. Try again." };
    return { ok: true, value: { kind: "document", title, body: out.trim() } };
  } catch (e) { return explain(e); }
}

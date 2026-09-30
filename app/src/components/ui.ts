/**
 * The whole look of buttons, chips and fields, in one place. Every button is 48px tall with the same type size;
 * only the fill tells you how important it is: solid green = the main action, green outline = a common action,
 * white = everything else, red text = destructive (always confirms first).
 */
const btn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
export const btnPrimary = `${btn} bg-green-900 text-white hover:bg-green-600`;
export const btnOutline = `${btn} border border-green-900 text-green-900 hover:bg-green-900/5`;
export const btnPlain = `${btn} border border-neutral-300 bg-white hover:bg-wash`;
export const btnDanger = `${btnPlain} !text-red-700`;
/** Square icon-only button (move up, remove, previous, next). Always give it an aria-label. */
export const btnIcon = "inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-neutral-300 bg-white transition-colors hover:bg-wash active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
/** Small square icon-only button for inside a list row (delete, remove). Always give it an aria-label. */
export const btnIconSm = "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-red-50 hover:text-red-700 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50";
export const inputCls = "mt-1 min-h-12 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base";

/** A filter or toggle: pill-shaped, 40px. On = solid green. */
export const chip = (on: boolean) => `inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors ${on ? "border-green-900 bg-green-900 text-white" : "border-neutral-300 bg-white hover:bg-wash"}`;
/** Tabs that switch a whole panel sit in a `tabBar`. The chosen one is solid green. */
export const tabBar = "inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-neutral-200 p-1";
export const tab = (on: boolean) => `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-base font-semibold transition-colors ${on ? "bg-green-900 text-white shadow-sm" : "text-neutral-700 hover:bg-white/70"}`;

/** A quiet placeholder while a page loads, so a tap always shows something happening. */
export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="h-9 w-48 animate-pulse rounded-md bg-neutral-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
      <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
      <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>
  );
}

"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="min-h-12 rounded-lg bg-green-900 px-5 font-semibold text-white">
      Print
    </button>
  );
}

"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
    >
      Print / Save as PDF
    </button>
  );
}

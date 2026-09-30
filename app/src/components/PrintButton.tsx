"use client";
import { btnPrimary } from "./ui";
import { Icon } from "./Icon";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className={btnPrimary}>
      <Icon name="printer" />Print
    </button>
  );
}

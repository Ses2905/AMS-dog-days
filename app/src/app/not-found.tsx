import Link from "next/link";
import { Icon } from "@/components/Icon";
import { btnPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl bg-white p-6 text-center shadow-sm">
      <h1>We Couldn&apos;t Find That</h1>
      <p className="text-neutral-700">It may have been deleted, or the link is old.</p>
      <Link href="/" className={btnPrimary}><Icon name="home" />Go to Today</Link>
    </div>
  );
}

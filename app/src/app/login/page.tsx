import Image from "next/image";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const field = "mt-1 min-h-12 w-full rounded-lg border border-neutral-300 px-3 text-base";
  return (
    <div className="mx-auto mt-10 max-w-sm space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <Image src="/brand/airedale-head-color.png" alt="" width={72} height={72} priority />
        <h1 className="text-xl font-semibold text-green-900">Coach OS</h1>
      </div>
      <form action={signIn} className="space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" autoComplete="username" required className={field} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input name="password" type="password" autoComplete="current-password" required className={field} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">That email or password didn’t work.</p>}
        <button className="min-h-12 w-full rounded-lg bg-green-900 font-semibold text-white">Sign in</button>
      </form>
    </div>
  );
}

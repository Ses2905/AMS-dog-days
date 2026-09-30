import { createBrowserClient } from "@supabase/ssr";

/** Browser-side client. Used only to send a file straight to storage with a one-time upload token from the server. */
export const createClient = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

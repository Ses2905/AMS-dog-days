import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Opens a document: checks the sign-in, then sends the browser to a link that works for one minute. */
export async function GET(request: Request, ctx: RouteContext<"/documents/[id]/file">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const row = await supabase.from("documents").select("path").eq("id", id).maybeSingle();
  if (!row.data) return new NextResponse("Not found", { status: 404 });
  const signed = await supabase.storage.from("documents").createSignedUrl(row.data.path, 60);
  if (signed.error || !signed.data) return new NextResponse("Could not open that file", { status: 500 });
  return NextResponse.redirect(signed.data.signedUrl);
}

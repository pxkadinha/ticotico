import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: sessionData, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !sessionData?.user) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  const user = sessionData.user;

  // Check if this user already has a family (e.g. re-confirmation click).
  const { data: existingMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    // First time confirming — create the family using metadata stored at signup.
    const displayName: string =
      user.user_metadata?.display_name ??
      user.email?.split("@")[0] ??
      "Parent";
    const familyName: string =
      user.user_metadata?.family_name ?? `${displayName}'s Family`;

    const { data: family } = await supabase
      .from("families")
      .insert({ name: familyName })
      .select()
      .single();

    if (family) {
      await supabase.from("family_members").insert({
        family_id: family.id,
        user_id: user.id,
        role: "admin",
        display_name: displayName,
      });
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}

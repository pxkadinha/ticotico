"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface JoinClientProps {
  familyName: string;
  familyId: string;
  token: string;
}

export function JoinClient({ familyName, familyId, token }: JoinClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // token is kept in scope so the join URL remains shareable
  void token;

  async function joinFamily(userId: string) {
    const supabase = createClient();
    const name = displayName.trim() || email.split("@")[0];

    await supabase.from("family_members").insert({
      family_id: familyId,
      user_id: userId,
      role: "member",
      display_name: name,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "register") {
      if (password.length < 6) {
        setError(t.join.passwordMin);
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        await joinFamily(data.user.id);
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Email confirmation required
      localStorage.setItem("pending_join_family_id", familyId);
      localStorage.setItem("pending_join_display_name", displayName || email.split("@")[0]);
      setError(null);
      setLoading(false);
      router.push(`/join/confirm-email?email=${encodeURIComponent(email)}`);
      return;
    }

    if (mode === "login") {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await joinFamily(data.user.id);
        router.push("/dashboard");
        router.refresh();
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {t.join.title.replace("{name}", familyName)}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t.join.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border p-1 gap-1 mb-4">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-rose-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "register" ? t.join.newAccount : t.join.haveAccount}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">{t.join.yourName}</Label>
                <Input
                  id="displayName"
                  placeholder={t.join.namePlaceholder}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.join.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "register" ? t.auth.passwordPlaceholder : t.auth.passwordBullets}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "register" ? t.join.createAndJoin : t.join.signInAndJoin}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

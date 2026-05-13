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

interface JoinClientProps {
  familyName: string;
  familyId: string;
  token: string;
}

export function JoinClient({ familyName, familyId, token }: JoinClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinFamily(userId: string) {
    const supabase = createClient();
    const name =
      displayName.trim() || email.split("@")[0];

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
        setError("Password must be at least 6 characters");
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

      // Email confirmation required — they'll be joined after confirming
      // Store the intent in localStorage so the callback can handle it
      localStorage.setItem("pending_join_family_id", familyId);
      localStorage.setItem("pending_join_display_name", displayName || email.split("@")[0]);
      setError(null);
      setLoading(false);
      // Show confirmation message
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Join {familyName}
          </CardTitle>
          <CardDescription className="text-gray-500">
            You&apos;ve been invited to Family Hub
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 gap-1 mb-4">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                  mode === m
                    ? "bg-rose-500 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "register" ? "New account" : "I have an account"}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Your name</Label>
                <Input
                  id="displayName"
                  placeholder="Ana"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
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
              {mode === "register" ? "Create account & join" : "Sign in & join"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useActionState } from "react";
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
import { Heart, Loader2, AlertCircle, LogOut } from "lucide-react";
import { setupFamily } from "./actions";
import { useState } from "react";

type ActionState = { error: string } | null;

export default function SetupPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const [state, action, isPending] = useActionState<ActionState, FormData>(
    async (_prev: ActionState, formData: FormData) => {
      const result = await setupFamily(formData);
      // If setupFamily redirects, this line never runs.
      // If it returns an error object, surface it.
      return result ?? null;
    },
    null
  );

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
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
            Set up your family
          </CardTitle>
          <CardDescription className="text-gray-500">
            You&apos;re almost in — just give your family a name.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {state?.error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Your name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Miguel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyName">Family name</Label>
              <Input
                id="familyName"
                name="familyName"
                placeholder="Pescadinha Family"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enter Family Hub
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {signingOut ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <LogOut className="w-3 h-3" />
              )}
              Sign out and use a different account
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

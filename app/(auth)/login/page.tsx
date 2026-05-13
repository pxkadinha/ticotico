"use client";

import { useActionState } from "react";
import Link from "next/link";
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
import { loginAction } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";

type State = { error: string } | null;

export default function LoginPage() {
  const { t } = useLanguage();
  const [state, action, isPending] = useActionState<State, FormData>(
    async (_prev: State, formData: FormData) => {
      const result = await loginAction(formData);
      return result ?? null;
    },
    null
  );

  return (
    <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">Family Hub</CardTitle>
        <CardDescription className="text-muted-foreground">{t.auth.signInSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {state?.error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t.auth.emailPlaceholder}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t.auth.passwordBullets}
              required
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            disabled={isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t.auth.signIn}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.auth.newHere}{" "}
          <Link href="/register" className="text-rose-500 font-medium hover:underline">
            {t.auth.createAccount}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

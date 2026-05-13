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
import { Heart, Loader2, AlertCircle, Mail } from "lucide-react";
import { registerAction } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";

type State = { error: string } | { awaitingConfirmation: true; email: string } | null;

export default function RegisterPage() {
  const { t } = useLanguage();
  const [state, action, isPending] = useActionState<State, FormData>(
    async (_prev: State, formData: FormData) => {
      const result = await registerAction(formData);
      return result ?? null;
    },
    null
  );

  if (state && "awaitingConfirmation" in state) {
    return (
      <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm text-center">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t.auth.checkEmail}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t.auth.emailSent}{" "}
            <span className="font-medium text-foreground">{state.email}</span>.{" "}
            {t.auth.clickActivate}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">{t.auth.noEmail}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{t.auth.createFamily}</CardTitle>
        <CardDescription className="text-muted-foreground">{t.auth.setupSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {state && "error" in state && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t.auth.yourName}</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder={t.auth.namePlaceholder}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="familyName">{t.auth.familyName}</Label>
            <Input
              id="familyName"
              name="familyName"
              placeholder={t.auth.familyNamePlaceholder}
            />
          </div>
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
              placeholder={t.auth.passwordPlaceholder}
              required
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            disabled={isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t.auth.createAccount}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.auth.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-rose-500 font-medium hover:underline">
            {t.auth.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

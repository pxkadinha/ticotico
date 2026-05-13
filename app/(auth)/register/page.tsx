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

type State = { error: string } | { awaitingConfirmation: true; email: string } | null;

export default function RegisterPage() {
  const [state, action, isPending] = useActionState<State, FormData>(
    async (_prev: State, formData: FormData) => {
      const result = await registerAction(formData);
      return result ?? null;
    },
    null
  );

  // Email confirmation waiting state
  if (state && "awaitingConfirmation" in state) {
    return (
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm text-center">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-medium text-gray-700">{state.email}</span>.
            Click it to activate your account.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Didn&apos;t get it? Check your spam folder.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Create your family
        </CardTitle>
        <CardDescription className="text-gray-500">
          Set up your Family Hub account
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {state && "error" in state && (
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
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 6 characters"
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
            Create account
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-rose-500 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

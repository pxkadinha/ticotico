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

type State = { error: string } | null;

export default function LoginPage() {
  const [state, action, isPending] = useActionState<State, FormData>(
    async (_prev: State, formData: FormData) => {
      const result = await loginAction(formData);
      return result ?? null;
    },
    null
  );

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Family Hub
        </CardTitle>
        <CardDescription className="text-gray-500">
          Inicia sessão para gerir a tua família
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@exemplo.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
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
            Iniciar sessão
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Novo no Family Hub?{" "}
          <Link
            href="/register"
            className="text-rose-500 font-medium hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

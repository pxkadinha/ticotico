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

  if (state && "awaitingConfirmation" in state) {
    return (
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm text-center">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Verifica o teu email
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Enviámos um link de confirmação para{" "}
            <span className="font-medium text-gray-700">{state.email}</span>.
            Clica nele para ativar a tua conta.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Não recebeste? Verifica a pasta de spam.
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
          Cria a tua família
        </CardTitle>
        <CardDescription className="text-gray-500">
          Configura a tua conta do Family Hub
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
            <Label htmlFor="displayName">O teu nome</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Miguel"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="familyName">Nome da família</Label>
            <Input
              id="familyName"
              name="familyName"
              placeholder="Família Pescadinha"
            />
          </div>
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
              placeholder="Mín. 6 caracteres"
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
            Criar conta
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Já tens conta?{" "}
          <Link
            href="/login"
            className="text-rose-500 font-medium hover:underline"
          >
            Iniciar sessão
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

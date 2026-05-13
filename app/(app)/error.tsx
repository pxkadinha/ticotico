"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <h1 className="text-xl font-semibold text-foreground mb-2">
        {t.common.errorTitle}
      </h1>
      <p className="text-sm text-muted-foreground mb-2">{error.message}</p>
      <Button onClick={reset} variant="outline" className="mt-4">
        {t.common.tryAgain}
      </Button>
    </div>
  );
}

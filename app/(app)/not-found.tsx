import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export default async function AppNotFound() {
  const t = await getT();
  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <p className="text-6xl font-bold text-muted-foreground/30 mb-2">404</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">{t.common.notFoundTitle}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t.common.notFoundDesc}</p>
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "default", size: "default" }),
          "bg-rose-500 hover:bg-rose-600 text-white border-0"
        )}
      >
        {t.common.backHome}
      </Link>
    </div>
  );
}

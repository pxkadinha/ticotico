"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAppointment } from "./actions";
import { useLanguage } from "@/components/providers/language-provider";

export function DeleteAppointmentButton({ id }: { id: string }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-7 h-7 text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteAppointment(id);
            toast.success(t.calendar.deleted);
          } catch {
            toast.error(t.calendar.couldNotDelete);
          }
        })
      }
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
    </Button>
  );
}

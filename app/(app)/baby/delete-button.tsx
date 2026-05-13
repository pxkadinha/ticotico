"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBabyLog } from "./actions";

export function DeleteBabyLogButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-7 h-7 text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteBabyLog(id);
            toast.success("Log deleted");
          } catch {
            toast.error("Could not delete");
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

"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

/** « Feedback » : trois gestes, trois notifications — celles du vrai `Toaster`, en bas à droite de la page. */
export function FeedbackScene() {
  return (
    <div className="flex w-full max-w-[var(--site-scene-width)] flex-col gap-2">
      <Button
        variant="secondary"
        label="Save changes"
        onClick={() =>
          toast({ title: "Changes saved", description: "Your icon set is up to date.", tone: "positive" })
        }
      />
      <Button
        variant="secondary"
        label="Send message"
        onClick={() => toast({ title: "Message sent", description: "Florian will get it shortly." })}
      />
      <Button
        variant="secondary"
        label="Delete file"
        onClick={() =>
          toast({
            title: "File deleted",
            description: "neume-svg.zip is gone.",
            tone: "negative",
            action: { label: "Undo", onClick: () => toast({ title: "File restored", tone: "positive" }) },
          })
        }
      />
    </div>
  );
}

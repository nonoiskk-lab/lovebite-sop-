import * as React from "react";
import { cn } from "@/lib/utils";

/** Nocturne surface card. `elevated` adds the hairline-edge shadow (elev-sm). */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { elevated?: boolean }
>(({ className, elevated = true, ...props }, ref) => (
  <div ref={ref} className={cn("card", elevated && "elev-sm", className)} {...props} />
));
Card.displayName = "Card";

export function CardKicker({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-kicker", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-title", className)} {...props} />;
}

export function CardMeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-meta", className)} {...props} />;
}

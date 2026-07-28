import * as React from "react";
import { cn } from "@/lib/utils";
import type { TagClass } from "@/lib/status";

export function Tag({
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant: TagClass }) {
  return <span className={cn("tag", variant, className)} {...props} />;
}

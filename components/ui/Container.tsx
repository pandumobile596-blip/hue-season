import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Centered page column with a 20px mobile gutter. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props} />;
}

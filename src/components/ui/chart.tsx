// Simplified — using recharts directly in pages
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { config?: ChartConfig; children: React.ReactElement }
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("h-full w-full", className)} {...props}>
    <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
  </div>
));
ChartContainer.displayName = "ChartContainer";

export { ChartContainer };

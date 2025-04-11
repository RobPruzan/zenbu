import { Zap, Info, Clock, Package, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "~/lib/utils";

interface NextLintIssue {
  id: string;
  title: string;
  type: "performance" | "bundle" | "accessibility";
  description: string;
  impact: "high" | "medium" | "low";
  children?: number;
  metric?: {
    value: string;
    threshold: string;
  };
}

const mockIssues: NextLintIssue[] = [
  {
    id: "cls-1",
    title: "Layout Shift in /products",
    type: "performance",
    description: "Large layout shift detected when loading product images",
    impact: "high",
    metric: {
      value: "0.28",
      threshold: "0.1",
    },
    children: 2,
  },
  {
    id: "ttfb-1",
    title: "Slow Page Load",
    type: "performance",
    description: "High Time to First Byte in category pages",
    impact: "medium",
    metric: {
      value: "980ms",
      threshold: "600ms",
    },
  },
  {
    id: "bundle-1",
    title: "Large Page Bundle",
    type: "bundle",
    description: "Main bundle exceeds recommended size",
    impact: "medium",
    metric: {
      value: "350kb",
      threshold: "170kb",
    },
  },
];

export function NextLint() {
  return (
    <div className="flex h-full w-[320px] flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-foreground" />
          <h2 className="text-sm font-semibold">Performance</h2>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 px-0">
          <Info className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-3">
        <p className="text-xs text-muted-foreground">
          Optimize performance issues and improve page metrics. Selected issues are from your current file and related dependencies.
        </p>

        <Button className="mt-3 w-full" size="sm">
          <Zap className="mr-2 h-3.5 w-3.5" />
          Optimize Issues
        </Button>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Issues</h3>
              <Badge variant="outline" className="text-xs">3</Badge>
            </div>
            <span className="text-xs text-green-500">22ms</span>
          </div>

          <div className="space-y-2">
            {mockIssues.map((issue) => (
              <div
                key={issue.id}
                className="group relative rounded-lg border border-border/40 bg-card p-2.5 hover:border-border"
              >
                <div className="mb-1.5 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {issue.type === "performance" && <Clock className="h-3.5 w-3.5 text-foreground" />}
                    {issue.type === "bundle" && <Package className="h-3.5 w-3.5 text-foreground" />}
                    <span className="text-sm font-medium">{issue.title}</span>
                    {issue.children && (
                      <Badge variant="secondary" className="text-xs">
                        {issue.children}
                      </Badge>
                    )}
                  </div>
                  {issue.impact === "high" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{issue.description}</p>

                {issue.metric && (
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className="text-foreground/80">Current: {issue.metric.value}</span>
                    <span className="text-foreground/60">•</span>
                    <span className="text-foreground/80">Target: {issue.metric.threshold}</span>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 top-1.5 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="mt-3 w-full text-xs text-muted-foreground">
            view previous (4)
          </Button>
        </div>
      </div>
    </div>
  );
} 